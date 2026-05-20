const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('EMAIL NOT CONFIGURED - skipping email to:', to);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
  await transporter.sendMail({
    from: `"BookShare" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({ name, email, password, role: role || 'student' });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.googleId) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Google Login
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: { url: picture },
        password: `google_${googleId}`,
        role: 'student',
        kycStatus: 'pending'
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        token
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/#/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      'BookShare - Password Reset Request',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetUrl}" style="background: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">Reset Password</a>
          <p>This link expires in <strong>15 minutes</strong>.</p>
          <p>If you didn't request this, ignore this email.</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">BookShare Team</p>
        </div>
      `
    );

    res.json({ success: true, message: 'Password reset email sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    if (req.body.password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful! Please login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send OTP for email verification (signup)
const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in memory with expiry (use temp storage)
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expire = Date.now() + 10 * 60 * 1000;

    // Store in a temp user or use JWT to pass OTP
    const tempToken = jwt.sign({ email, hashedOtp, expire }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // Try to send email, don't fail if not configured
    try {
      await sendEmail(
        email,
        'BookShare - Email Verification OTP',
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Verify Your Email</h2>
          <p>Your OTP is:</p>
          <div style="background: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #0284c7; font-size: 40px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p>Expires in <strong>10 minutes</strong>.</p>
        </div>`
      );
    } catch (emailErr) {
      console.log('Email send failed:', emailErr.message);
    }

    res.json({ 
      success: true, 
      message: process.env.EMAIL_USER ? 'OTP sent to your email!' : 'OTP generated',
      tempToken,
      ...((!process.env.EMAIL_USER) && { devOtp: otp })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify OTP and register
const verifyAndRegister = async (req, res) => {
  try {
    const { tempToken, otp, name, phone, password, role } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== decoded.hashedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const existing = await User.findOne({ email: decoded.email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name, email: decoded.email, phone, password,
      role: role || 'student'
    });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send OTP for password reset
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Try to send email, but don't fail if email not configured
    try {
      await sendEmail(
        user.email,
        'BookShare - Password Reset OTP',
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Password Reset OTP</h2>
          <p>Hi ${user.name}, your OTP is:</p>
          <div style="background: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #0284c7; font-size: 40px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p>Expires in <strong>10 minutes</strong>.</p>
        </div>`
      );
    } catch (emailErr) {
      console.log('Email send failed:', emailErr.message);
    }

    res.json({ 
      success: true, 
      message: process.env.EMAIL_USER ? 'OTP sent to your email!' : 'OTP generated',
      ...((!process.env.EMAIL_USER) && { devOtp: otp })
    });
  } catch (error) {
    console.error('sendOTP error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and reset password
const resetPasswordDirect = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, googleLogin, forgotPassword, resetPassword, sendOTP, resetPasswordDirect, sendVerificationOTP, verifyAndRegister };

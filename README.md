# BookShare Backend

## Quick Start

```bash
cd backend
npm install
npm start
```

## API Endpoints

- **Health**: GET /health
- **Auth**: POST /api/auth/register, POST /api/auth/login
- **Users**: GET /api/users/profile
- **Listings**: GET /api/listings
- **Orders**: GET /api/orders

## Environment Variables

Create `.env` file:
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/bookshare
JWT_SECRET=your_jwt_secret
```

## Test

Backend runs on: http://localhost:5001
Health check: http://localhost:5001/health
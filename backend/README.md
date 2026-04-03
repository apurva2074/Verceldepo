# RentIt Backend Server

## 🚀 Quick Start

### Development
```bash
npm run dev
```
Starts the server with nodemon for auto-restart on file changes.

### Production
```bash
npm start
```
Starts the server in production mode.

### Environment Check
```bash
npm run test-env
```
Displays current environment variables for debugging.

## 📁 Project Structure

```
backend/
├── server.js          # 🎯 MAIN ENTRY POINT - Start server here
├── src/
│   ├── app.js         # Express app configuration
│   ├── index.js       # Legacy entry point (deprecated)
│   ├── routes/        # API routes
│   ├── middleware/    # Authentication & authorization
│   └── firebaseAdmin.js # Firebase configuration
├── package.json       # Dependencies and scripts
└── .env              # Environment variables (create this file)
```

## 🔧 Environment Setup

Create a `.env` file with:
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY_BASE64=your-base64-private-key
CORS_ORIGIN=http://localhost:3000
```

## 🌐 API Endpoints

- **Health Check**: `GET /api/health`
- **User Routes**: `GET /api/users/*`
- **Property Routes**: `GET /api/properties/*`
- **Authentication**: All protected routes require `Authorization: Bearer <token>`

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal to stop the server gracefully.

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change port in .env file
PORT=5001
```

**Environment variables not loading?**
```bash
npm run test-env
# Check if .env file exists and is properly formatted
```

## 📝 Notes

- **Single Entry Point**: Use `server.js` only - all other startup files have been removed
- **Graceful Shutdown**: Server handles SIGINT/SIGTERM signals properly
- **Error Handling**: Comprehensive error handling for production stability
- **Environment Aware**: Different behavior for development vs production

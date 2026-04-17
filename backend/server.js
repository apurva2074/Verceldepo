// 🚀 RentIt Backend Server - Single Entry Point
// This is the main server file. Run with: node server.js

require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Note: Routes are defined in src/app.js to avoid conflicts

// Start server
const server = app.listen(PORT, () => {
  console.log(`\ud83d\ude80 RentIt Backend Server running successfully!`);
  console.log(`\ud83c\udf10 Server URL: http://localhost:${PORT}`);
  console.log(`\ud83d\udce1 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\ud83d\udcdd Press Ctrl+C to stop the server`);
  console.log(`\ud83d\udd27 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Export for testing
module.exports = server;

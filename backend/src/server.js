require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

// In production, enforce critical security configuration
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('[Startup Error]: Strong JWT_SECRET (at least 16 characters) is required in production.');
    process.exit(1);
  }
}

let server;

// Connect to MongoDB and start HTTP server
connectDB()
  .then(() => {
    server = app.listen(PORT, HOST, () => {
      console.log(`[FoodLoop Engine]: Server active on ${HOST}:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`[FoodLoop Engine]: Health check at http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('[Startup Fatal Error]:', err.message);
    process.exit(1);
  });

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[FoodLoop Engine]: ${signal} received. Closing HTTP server and database connections...`);
  if (server) {
    server.close(async () => {
      console.log('[FoodLoop Engine]: HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('[FoodLoop Engine]: MongoDB connection closed gracefully.');
        process.exit(0);
      } catch (err) {
        console.error('[FoodLoop Engine]: Error during database disconnect:', err.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err);
});


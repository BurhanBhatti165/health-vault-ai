import mongoose from 'mongoose';

// MongoDB connection with caching for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connection;
    console.log('MongoDB Connected for serverless function');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Import your backend app
async function getApp() {
  // Dynamic import to avoid issues with top-level imports
  const { default: app } = await import('../backend/server.js');
  return app;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Health check endpoint (simple, no DB needed)
    if (req.url === '/api/health') {
      return res.status(200).json({
        success: true,
        message: 'Health Vault AI API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    }

    // Connect to database for other endpoints
    await connectToDatabase();
    
    // Get the Express app and handle the request
    const app = await getApp();
    return app(req, res);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
// Simple test endpoint to debug Vercel deployment
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'not set',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'set' : 'not set',
      VITE_API_URL: process.env.VITE_API_URL || 'not set'
    };

    res.status(200).json({
      success: true,
      message: 'Test endpoint working - Serverless function is running!',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      method: req.method,
      url: req.url
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
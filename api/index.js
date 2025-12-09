// Basic serverless function handler for debugging
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Simple health check
    if (req.url === '/api/health') {
      return res.status(200).json({
        success: true,
        message: 'API is working',
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'not set',
          MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
          JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing'
        }
      });
    }

    // For now, return a simple response for all other routes
    res.status(200).json({
      success: true,
      message: 'Basic API handler working',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
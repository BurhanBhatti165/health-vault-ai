# Health Vault AI - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: Ensure your database is accessible from anywhere (0.0.0.0/0)

## Deployment Steps

### 1. Prepare Your Environment Variables

In Vercel dashboard, add these environment variables:

#### Required Variables:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OCR_API_KEY=your_ocr_api_key
GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key_for_frontend
GEMINI_EXTRACT_API_KEY=your_gemini_extract_api_key
```

#### Optional (if using Supabase):
```
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_URL=your_supabase_url
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration
5. Add environment variables in the dashboard
6. Deploy

### 3. Update Frontend API URL

After deployment, update your frontend environment variable:
```
VITE_API_URL=https://your-app-name.vercel.app/api
```

### 4. Test Your Deployment

Visit your deployed app and test:
- ✅ User authentication
- ✅ Appointment creation
- ✅ File uploads
- ✅ Chat functionality
- ✅ LangGraph integration

## Project Structure

```
health-vault-ai/
├── api/                    # Vercel serverless functions
│   ├── index.js           # Main API handler
│   └── langgraph.py       # Python LangGraph service
├── backend/               # Express.js backend
├── src/                   # React frontend
├── dist/                  # Built frontend (auto-generated)
├── vercel.json           # Vercel configuration
├── requirements.txt      # Python dependencies
└── package.json          # Node.js dependencies
```

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Working**
   - Ensure all variables are added in Vercel dashboard
   - Redeploy after adding variables

2. **Database Connection Issues**
   - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
   - Verify connection string format

3. **API Routes Not Working**
   - Check vercel.json routing configuration
   - Ensure API functions are in the `/api` directory

4. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

### Logs and Debugging:
- View function logs in Vercel dashboard
- Use `vercel logs` command for real-time logs
- Check browser network tab for API errors

## Performance Optimization

1. **Frontend**:
   - Static files served via Vercel CDN
   - Automatic code splitting with Vite

2. **Backend**:
   - Serverless functions auto-scale
   - Cold start optimization with keep-alive

3. **Database**:
   - Use MongoDB connection pooling
   - Implement proper indexing

## Security Checklist

- ✅ Environment variables secured
- ✅ CORS properly configured
- ✅ JWT tokens for authentication
- ✅ File upload validation
- ✅ API rate limiting (implement if needed)

## Monitoring

- Use Vercel Analytics for performance monitoring
- Set up error tracking (Sentry recommended)
- Monitor API usage and costs

## Scaling Considerations

- Vercel Pro plan for higher limits
- Consider database connection limits
- Implement caching strategies
- Monitor serverless function execution time

---

**Need Help?** Check Vercel documentation or create an issue in the repository.
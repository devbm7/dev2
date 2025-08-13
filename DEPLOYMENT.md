# Vercel Deployment Guide

This guide will help you deploy your Next.js application with the integrated FastAPI server to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **FastAPI Server**: You'll need to deploy your FastAPI server separately (see options below)

## Deployment Options

### Option 1: Separate FastAPI Server (Recommended)

Since Vercel doesn't support long-running Python processes, you'll need to deploy your FastAPI server separately:

#### A. Deploy FastAPI to Railway/Render/Heroku

1. **Railway** (Recommended):
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Deploy from poc directory
   cd poc
   railway init
   railway up
   ```

2. **Render**:
   - Create a new Web Service
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements_fastapi.txt`
   - Set start command: `python start_fastapi_server.py`
   - Set environment variables

3. **Heroku**:
   ```bash
   # Create Procfile in poc directory
   echo "web: python start_fastapi_server.py" > poc/Procfile
   
   # Deploy to Heroku
   heroku create your-fastapi-app
   git subtree push --prefix poc heroku main
   ```

#### B. Deploy Next.js to Vercel

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     FASTAPI_BASE_URL=https://your-fastapi-server.railway.app
     NEXT_PUBLIC_API_URL=https://your-nextjs-app.vercel.app
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     GEMINI_API_KEY=your_gemini_api_key
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_service_key
     ```

3. **Deploy**:
   - Vercel will automatically detect it's a Next.js project
   - Click "Deploy"

### Option 2: Serverless FastAPI (Alternative)

If you want to keep everything on Vercel, you can convert your FastAPI endpoints to serverless functions:

1. **Create API Routes**: Convert FastAPI endpoints to Next.js API routes
2. **Install Dependencies**: Add Python dependencies to your project
3. **Use Vercel Functions**: Deploy as serverless functions

## Environment Variables Setup

### For FastAPI Server (Railway/Render/Heroku)

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key

# Optional
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_RELOAD=false
```

### For Next.js App (Vercel)

```bash
# Required
FASTAPI_BASE_URL=https://your-fastapi-server.railway.app
NEXT_PUBLIC_API_URL=https://your-nextjs-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

## Testing the Deployment

1. **Test FastAPI Server**:
   ```bash
   curl https://your-fastapi-server.railway.app/health
   ```

2. **Test Next.js App**:
   ```bash
   curl https://your-nextjs-app.vercel.app/api/interview/health
   ```

3. **Test Integration**:
   - Visit your Vercel app URL
   - Try creating an interview session
   - Check if it connects to your FastAPI server

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure your FastAPI server has CORS configured
   - Check that `FASTAPI_BASE_URL` is correct

2. **Environment Variables**:
   - Verify all environment variables are set in Vercel dashboard
   - Check that `NEXT_PUBLIC_` variables are accessible in browser

3. **FastAPI Server Not Responding**:
   - Check your FastAPI server logs
   - Verify the server is running and accessible
   - Test the URL directly in browser

4. **Build Errors**:
   - Check Vercel build logs
   - Ensure all dependencies are properly installed
   - Verify TypeScript compilation

### Debug Commands

```bash
# Test FastAPI server locally
cd poc
python start_fastapi_server.py

# Test Next.js app locally
npm run dev

# Test integration locally
npm run dev:full
```

## Monitoring and Logs

1. **Vercel Logs**: Available in Vercel dashboard under Functions
2. **FastAPI Logs**: Available in your hosting platform (Railway/Render/Heroku)
3. **Application Logs**: Check browser console and network tab

## Performance Optimization

1. **Caching**: Implement caching for static assets
2. **CDN**: Vercel automatically provides CDN
3. **Database**: Use connection pooling for database connections
4. **API Calls**: Implement request caching and rate limiting

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **API Keys**: Use environment variables for all API keys
3. **CORS**: Configure CORS properly for production
4. **HTTPS**: Ensure all communications use HTTPS
5. **Rate Limiting**: Implement rate limiting on your FastAPI server

## Cost Optimization

1. **Vercel**: Free tier includes 100GB bandwidth and 100 serverless function executions
2. **Railway**: Free tier includes $5 credit
3. **Render**: Free tier available for web services
4. **Heroku**: Free tier discontinued, paid plans start at $7/month

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up CI/CD pipeline
4. Implement backup strategies
5. Plan for scaling

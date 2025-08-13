# Quick Start Guide

This guide will help you quickly test the integration between your Next.js app and FastAPI server.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Python** (v3.11 or higher)
3. **pip** (Python package manager)

## Setup

### 1. Install Dependencies

```bash
# Install Next.js dependencies
npm install

# Install FastAPI dependencies
npm run backend:install
```

### 2. Set Environment Variables

Copy the example environment file and update it with your values:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys:

```bash
# Required for testing
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

### 3. Start Both Servers

```bash
# Start both Next.js and FastAPI servers
npm run dev:full
```

This will start:
- Next.js app on http://localhost:3000
- FastAPI server on http://localhost:8000

## Testing

### 1. Test FastAPI Server

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test session creation
curl -X POST http://localhost:8000/session \
  -H "Content-Type: application/json" \
  -d '{"job_description": "Software Engineer"}'
```

### 2. Test Next.js API Proxy

```bash
# Test health endpoint through Next.js
curl http://localhost:3000/api/interview/health

# Test session creation through Next.js
curl -X POST http://localhost:3000/api/interview/session \
  -H "Content-Type: application/json" \
  -d '{"job_description": "Software Engineer"}'
```

### 3. Test Frontend Integration

1. Open http://localhost:3000 in your browser
2. Navigate to the interview setup page
3. Try creating a new interview session
4. Check browser console for any errors

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill processes on ports 3000 and 8000
   lsof -ti:3000 | xargs kill -9
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python Dependencies Missing**:
   ```bash
   # Reinstall Python dependencies
   npm run backend:install
   ```

3. **Environment Variables Not Loaded**:
   ```bash
   # Restart the servers
   npm run dev:full
   ```

4. **CORS Errors**:
   - Check that FastAPI server is running on port 8000
   - Verify CORS configuration in FastAPI

### Debug Commands

```bash
# Check if servers are running
npm run test:api
npm run test:fastapi

# View FastAPI logs
npm run backend:logs

# Clean up
npm run backend:clean
```

## Next Steps

Once local testing is working:

1. **Deploy FastAPI Server**: Follow the deployment guide in `DEPLOYMENT.md`
2. **Deploy Next.js App**: Deploy to Vercel
3. **Update Environment Variables**: Set production URLs
4. **Test Production**: Verify everything works in production

## Development Workflow

1. **Start Development**:
   ```bash
   npm run dev:full
   ```

2. **Make Changes**: Edit your code

3. **Test Changes**: Use the test commands above

4. **Deploy**: Follow the deployment guide

## File Structure

```
├── src/app/api/interview/          # Next.js API routes (proxy)
├── src/lib/interview-client.ts     # Client utility
├── poc/                            # FastAPI server
│   ├── fastapi_pipeline.py         # Main FastAPI app
│   ├── start_fastapi_server.py     # Server startup
│   └── requirements_fastapi.txt    # Python dependencies
├── vercel.json                     # Vercel configuration
└── DEPLOYMENT.md                   # Deployment guide
```

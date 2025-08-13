# Hardcoded Configuration Summary

All environment variables have been hardcoded into the application files. Here's a summary of what was changed:

## Next.js Configuration

### 1. API Routes (`src/app/api/interview/[...path]/route.ts`)
```typescript
const FASTAPI_BASE_URL = 'https://your-fastapi-server.railway.app'; // Replace with your actual FastAPI server URL
```

### 2. Interview Client (`src/lib/interview-client.ts`)
```typescript
const API_BASE_URL = 'https://your-nextjs-app.vercel.app'; // Replace with your actual Vercel app URL
```

### 3. Supabase Client (`src/lib/supabase.ts`)
```typescript
// Hardcoded Supabase configuration
const supabaseUrl = 'https://ibnsjeoemngngkqnnjdz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnNqZW9lbW5nbmdrcW5uamR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDk4MTEsImV4cCI6MjA2OTI4NTgxMX0.iR8d0XxR-UOPPrK74IIV6Z7gVPP2rHS2b1ZCKwGOSqQ'
```

### 4. Supabase Server Client (`src/lib/supabase-server.ts`)
```typescript
// Same hardcoded values as above
```

## FastAPI Configuration

### 1. Supabase Config (`poc/supabase_config.py`)
```python
# Hardcoded values
self.url = "https://ibnsjeoemngngkqnnjdz.supabase.co"
self.key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnNqZW9lbW5nbmdrcW5uamR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDk4MTEsImV4cCI6MjA2OTI4NTgxMX0.iR8d0XxR-UOPPrK74IIV6Z7gVPP2rHS2b1ZCKwGOSqQ"
```

### 2. Gemini API Config (`poc/config.py`)
```python
# Hardcoded Gemini API key
hardcoded_key = "AIzaSyA_lZ78Rf_J9lCBqpu4hFaHSzYopB4CY0Y"
```

### 3. Server Configuration (`poc/start_fastapi_server.py`)
```python
# Hardcoded server settings
host = "0.0.0.0"
port = 8000
reload = False
```

## Vercel Configuration (`vercel.json`)
```json
{
  "env": {
    "FASTAPI_BASE_URL": "https://your-fastapi-server.railway.app"
  }
}
```

## Deployment Instructions

### Step 1: Update URLs
Before deploying, you need to replace the placeholder URLs with your actual deployment URLs:

1. **In `src/app/api/interview/[...path]/route.ts`**:
   - Replace `'https://your-fastapi-server.railway.app'` with your actual FastAPI server URL

2. **In `src/lib/interview-client.ts`**:
   - Replace `'https://your-nextjs-app.vercel.app'` with your actual Vercel app URL

3. **In `vercel.json`**:
   - Replace `"https://your-fastapi-server.railway.app"` with your actual FastAPI server URL

### Step 2: Deploy FastAPI Server
Choose one of these options:

#### Option A: Railway
```bash
cd poc
railway login
railway init
railway up
```

#### Option B: Render
- Create new Web Service
- Set build command: `pip install -r requirements_fastapi.txt`
- Set start command: `python start_fastapi_server.py`

#### Option C: Heroku
```bash
cd poc
heroku create your-fastapi-app
git subtree push --prefix poc heroku main
```

### Step 3: Deploy Next.js to Vercel
1. Push your code to GitHub
2. Connect repository to Vercel
3. Deploy (no environment variables needed since everything is hardcoded)

### Step 4: Update URLs After Deployment
After both servers are deployed, update the URLs in the files mentioned in Step 1 with the actual deployment URLs.

## Security Note
⚠️ **Warning**: Hardcoding sensitive values like API keys in source code is not recommended for production applications. This approach is suitable for development and testing, but for production, consider using environment variables or a secure configuration management system.

## Testing
After deployment, test the integration:
```bash
# Test FastAPI server
curl https://your-fastapi-server.railway.app/health

# Test Next.js proxy
curl https://your-nextjs-app.vercel.app/api/interview/health
```

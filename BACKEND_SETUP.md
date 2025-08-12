# Backend Server Setup with NPM

This project now includes npm scripts to manage the FastAPI backend server alongside the Next.js frontend.

## Quick Start

### 1. Install Dependencies
```bash
# Install Node.js dependencies (frontend)
npm install

# Install Python dependencies (backend)
npm run backend:install
```

### 2. Generate SSL Certificates (for HTTPS)
```bash
npm run backend:ssl
```

### 3. Start Development Servers
```bash
# Start both frontend and backend with HTTP
npm run dev:full

# Start both frontend and backend with HTTPS
npm run dev:https

# Start with managed backend (auto-restart on crash)
npm run dev:managed
```

## Available NPM Scripts

### Backend Management
- `npm run backend:install` - Install Python dependencies
- `npm run backend:dev` - Start FastAPI server (HTTP)
- `npm run backend:https` - Start FastAPI server (HTTPS)
- `npm run backend:ssl` - Generate SSL certificates
- `npm run backend:logs` - View server logs
- `npm run backend:clean` - Clean cache and logs
- `npm run backend:setup` - Install dependencies and generate SSL

### Advanced Backend Management
- `npm run backend:start` - Start server with auto-restart
- `npm run backend:stop` - Stop the server
- `npm run backend:status` - Check server status
- `npm run backend:manager` - Interactive backend manager

### Combined Development
- `npm run dev:full` - Start frontend + backend (HTTP)
- `npm run dev:https` - Start frontend + backend (HTTPS)
- `npm run dev:managed` - Start frontend + managed backend

## Environment Variables

Create a `.env` file in the root directory to configure the backend:

```env
# Server Configuration
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_RELOAD=false

# SSL Configuration
USE_HTTPS=true
SSL_KEYFILE=poc/certificates/server.key
SSL_CERTFILE=poc/certificates/server.crt

# Logging
LOG_LEVEL=info

# Python Configuration
PYTHON_PATH=python
```

## Backend Manager

The backend manager provides advanced process management:

```bash
# Start server with auto-restart
node scripts/backend-manager.js start

# Stop server
node scripts/backend-manager.js stop

# Check status
node scripts/backend-manager.js status

# Install dependencies
node scripts/backend-manager.js install

# Generate SSL certificates
node scripts/backend-manager.js ssl
```

## Features

### Auto-Restart
The managed backend automatically restarts if it crashes (up to 5 times).

### SSL Support
- Automatic SSL certificate generation
- HTTPS support for production
- Self-signed certificates for development

### Process Management
- Graceful shutdown handling
- Proper logging and error handling
- Environment variable management

### Dependency Management
- Automatic Python dependency installation
- Version checking
- Requirements file validation

## Production Deployment

For production deployment:

1. **Set up proper SSL certificates**:
   ```bash
   # Replace self-signed certificates with proper ones
   export SSL_KEYFILE=/path/to/your/private.key
   export SSL_CERTFILE=/path/to/your/certificate.crt
   ```

2. **Configure environment variables**:
   ```bash
   export FASTAPI_HOST=0.0.0.0
   export FASTAPI_PORT=8000
   export USE_HTTPS=true
   export LOG_LEVEL=info
   ```

3. **Start the server**:
   ```bash
   npm run backend:start
   ```

## Troubleshooting

### Common Issues

1. **Python not found**:
   ```bash
   # Install Python 3.8+
   # Make sure 'python' command is available
   python --version
   ```

2. **Dependencies not installed**:
   ```bash
   npm run backend:install
   ```

3. **SSL certificate issues**:
   ```bash
   npm run backend:ssl
   ```

4. **Port already in use**:
   ```bash
   # Change port in .env file
   FASTAPI_PORT=8001
   ```

### Logs

View server logs:
```bash
npm run backend:logs
```

Or check the log file directly:
```bash
tail -f poc/fastapi_server.log
```

## File Structure

```
├── package.json              # NPM scripts and dependencies
├── backend.config.js         # Backend configuration
├── scripts/
│   └── backend-manager.js    # Backend process manager
├── poc/
│   ├── start_fastapi_server.py    # HTTP server startup
│   ├── start_https_server.py      # HTTPS server startup
│   ├── generate_ssl_cert.py       # SSL certificate generator
│   ├── requirements_fastapi.txt   # Python dependencies
│   └── certificates/              # SSL certificates (auto-generated)
└── BACKEND_SETUP.md         # This file
```

## Security Notes

- Self-signed certificates are for development only
- Use proper SSL certificates in production
- Keep private keys secure
- Regularly update dependencies
- Monitor server logs for issues

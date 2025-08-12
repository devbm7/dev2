/**
 * Backend Configuration for FastAPI Server
 */

const path = require('path');

module.exports = {
  // Server configuration
  server: {
    host: process.env.FASTAPI_HOST || '0.0.0.0',
    port: process.env.FASTAPI_PORT || 8000,
    reload: process.env.FASTAPI_RELOAD === 'true',
  },

  // SSL configuration
  ssl: {
    enabled: process.env.USE_HTTPS === 'true',
    keyFile: process.env.SSL_KEYFILE || path.join(__dirname, 'poc/certificates/server.key'),
    certFile: process.env.SSL_CERTFILE || path.join(__dirname, 'poc/certificates/server.crt'),
  },

  // Python environment
  python: {
    path: process.env.PYTHON_PATH || 'python',
    requirements: path.join(__dirname, 'poc/requirements_fastapi.txt'),
    workingDir: path.join(__dirname, 'poc'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: path.join(__dirname, 'poc/fastapi_server.log'),
  },

  // Environment variables to pass to the Python process
  env: {
    FASTAPI_HOST: process.env.FASTAPI_HOST || '0.0.0.0',
    FASTAPI_PORT: process.env.FASTAPI_PORT || '8000',
    FASTAPI_RELOAD: process.env.FASTAPI_RELOAD || 'false',
    SSL_KEYFILE: process.env.SSL_KEYFILE || path.join(__dirname, 'poc/certificates/server.key'),
    SSL_CERTFILE: process.env.SSL_CERTFILE || path.join(__dirname, 'poc/certificates/server.crt'),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  }
};

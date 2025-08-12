#!/usr/bin/env node

/**
 * Backend Manager for FastAPI Server
 * Manages the Python FastAPI server process with proper logging and error handling
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../backend.config');

class BackendManager {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.restartCount = 0;
    this.maxRestarts = 5;
  }

  /**
   * Check if Python and required dependencies are available
   */
  async checkDependencies() {
    console.log('[INFO] Checking dependencies...');
    
    // Check if Python is available
    try {
      await this.runCommand('python', ['--version']);
      console.log('[OK] Python is available');
    } catch (error) {
      console.error('[ERROR] Python is not available. Please install Python 3.8+');
      return false;
    }

    // Check if pip is available
    try {
      await this.runCommand('pip', ['--version']);
      console.log('[OK] pip is available');
    } catch (error) {
      console.error('[ERROR] pip is not available. Please install pip');
      return false;
    }

    // Check if requirements file exists
    if (!fs.existsSync(config.python.requirements)) {
      console.error(`[ERROR] Requirements file not found: ${config.python.requirements}`);
      return false;
    }

    console.log('[OK] All dependencies are available');
    return true;
  }

  /**
   * Install Python dependencies
   */
  async installDependencies() {
    console.log('[INFO] Installing Python dependencies...');
    
    try {
      await this.runCommand('pip', ['install', '-r', config.python.requirements]);
      console.log('[OK] Dependencies installed successfully');
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to install dependencies:', error.message);
      return false;
    }
  }

  /**
   * Generate SSL certificates if needed
   */
  async generateSSL() {
    if (!config.ssl.enabled) {
      console.log('[INFO] SSL disabled, skipping certificate generation');
      return true;
    }

    console.log('[INFO] Checking SSL certificates...');
    
    const certDir = path.dirname(config.ssl.keyFile);
    const keyExists = fs.existsSync(config.ssl.keyFile);
    const certExists = fs.existsSync(config.ssl.certFile);

    if (keyExists && certExists) {
      console.log('[OK] SSL certificates already exist');
      return true;
    }

    console.log('[INFO] Generating SSL certificates...');
    
    try {
      // Create certificates directory
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }

      // Run the certificate generation script
      await this.runCommand('python', ['generate_ssl_cert.py'], { cwd: config.python.workingDir });
      console.log('[OK] SSL certificates generated successfully');
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to generate SSL certificates:', error.message);
      return false;
    }
  }

  /**
   * Start the FastAPI server
   */
  async startServer() {
    if (this.isRunning) {
      console.log('[WARN] Server is already running');
      return;
    }

    console.log('[INFO] Starting FastAPI server...');
    
    const scriptName = config.ssl.enabled ? 'start_https_server.py' : 'start_fastapi_server.py';
    const scriptPath = path.join(config.python.workingDir, scriptName);

    if (!fs.existsSync(scriptPath)) {
      console.error(`[ERROR] Server script not found: ${scriptPath}`);
      return;
    }

    // Set environment variables
    const env = { ...process.env, ...config.env };

    // Start the Python process
    this.process = spawn('python', [scriptPath], {
      cwd: config.python.workingDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.isRunning = true;
    this.restartCount = 0;

    // Handle stdout
    this.process.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    // Handle stderr
    this.process.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      this.isRunning = false;
      console.log(`[Backend] Process exited with code ${code} and signal ${signal}`);
      
      // Auto-restart if not manually stopped
      if (this.restartCount < this.maxRestarts) {
        this.restartCount++;
        console.log(`[Backend] Restarting server (${this.restartCount}/${this.maxRestarts})...`);
        setTimeout(() => this.startServer(), 2000);
      } else {
        console.error('[Backend] Max restart attempts reached. Server stopped.');
      }
    });

    // Handle process errors
    this.process.on('error', (error) => {
      console.error('[Backend] Process error:', error);
      this.isRunning = false;
    });

    console.log(`[OK] FastAPI server started on ${config.server.host}:${config.server.port}`);
    if (config.ssl.enabled) {
      console.log('[INFO] HTTPS enabled');
    }
  }

  /**
   * Stop the FastAPI server
   */
  stopServer() {
    if (!this.isRunning || !this.process) {
      console.log('[INFO] Server is not running');
      return;
    }

    console.log('[INFO] Stopping FastAPI server...');
    this.process.kill('SIGTERM');
    this.isRunning = false;
    this.restartCount = this.maxRestarts; // Prevent auto-restart
  }

  /**
   * Run a command and return a promise
   */
  runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      restartCount: this.restartCount,
      maxRestarts: this.maxRestarts,
      config: {
        host: config.server.host,
        port: config.server.port,
        ssl: config.ssl.enabled
      }
    };
  }
}

// CLI interface
if (require.main === module) {
  const manager = new BackendManager();
  const command = process.argv[2];

  const handleShutdown = () => {
    console.log('\n[INFO] Shutting down...');
    manager.stopServer();
    process.exit(0);
  };

  // Handle graceful shutdown
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  async function main() {
    switch (command) {
      case 'start':
        if (await manager.checkDependencies()) {
          if (await manager.installDependencies()) {
            if (await manager.generateSSL()) {
              await manager.startServer();
            }
          }
        }
        break;

      case 'stop':
        manager.stopServer();
        break;

      case 'status':
        console.log('Server Status:', manager.getStatus());
        break;

      case 'install':
        if (await manager.checkDependencies()) {
          await manager.installDependencies();
        }
        break;

      case 'ssl':
        await manager.generateSSL();
        break;

      default:
        console.log('Usage: node backend-manager.js <command>');
        console.log('Commands:');
        console.log('  start   - Start the FastAPI server');
        console.log('  stop    - Stop the FastAPI server');
        console.log('  status  - Show server status');
        console.log('  install - Install dependencies');
        console.log('  ssl     - Generate SSL certificates');
    }
  }

  main().catch(console.error);
}

module.exports = BackendManager;

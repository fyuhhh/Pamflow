const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Existing initializers
const initializeDB = require('./db');
const { initRecurrenceScheduler } = require('./recurrenceService');
const socketService = require('./src/services/socketService');

// New Routes
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedPatterns = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
      /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging for network diagnostics
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api', routes);

const http = require('http');

// Initialize DB and start server
if (require.main === module) {
  initializeDB().then(pool => {
    const server = http.createServer(app);
    
    server.listen(PORT, '0.0.0.0', () => {
      initRecurrenceScheduler(pool);
      socketService.init(server);
      
      const os = require('os');
      const interfaces = os.networkInterfaces();
      const addresses = [];
      
      for (const name in interfaces) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            addresses.push(`http://${iface.address}:${PORT}`);
          }
        }
      }

      console.log(`\n🚀 PamFlow Backend Modular Server is ready!`);
      console.log(`- Local:   http://localhost:${PORT}`);
      addresses.forEach(addr => console.log(`- Network: ${addr}`));
      console.log(`\nMode: Modular Architecture (Routes, Controllers, Services)\n`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = app;

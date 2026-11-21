import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { initializeDatabase } from './init-db.js';

dotenv.config();

// Prevent any unhandled errors from terminating Node
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception caught safely:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection caught safely:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', apiRouter);

// Health & Ping endpoints for Render Keep-Alive
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Render 24/7 keep-alive ping received',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Serve frontend static build in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Salah App is running. Refreshing...');
    }
  });
});

// Start listening immediately on 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Salah Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  initRenderKeepAlive();
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Render 24/7 Keep-Alive Pinger (pings public URL every 12 minutes so Render free tier never sleeps)
function initRenderKeepAlive() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL || 'https://salah-app-zl1l.onrender.com';
  const PING_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes (Render sleeps after 15 min)

  console.log(`⏱️ Initializing 24/7 Render Keep-Alive Pinger for ${externalUrl} every 12 mins...`);

  setInterval(async () => {
    try {
      const pingUrl = `${externalUrl}/health`;
      const res = await fetch(pingUrl);
      console.log(`[Keep-Alive Ping] ${new Date().toLocaleTimeString()} -> ${pingUrl} (HTTP ${res.status})`);
    } catch (err) {
      console.warn(`[Keep-Alive Ping Notice]`, err?.message || err);
    }
  }, PING_INTERVAL_MS);
}

// Initialize database schema asynchronously
initializeDatabase();

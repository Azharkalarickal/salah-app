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
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
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
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Initialize database schema asynchronously
initializeDatabase();

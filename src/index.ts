import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { config, validateConfig } from './config';
import webhookRouter from './routes/webhook';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';

// Admin panel static files path
const ADMIN_DIST = path.join(__dirname, '../admin-panel/dist');

const app = express();

// Trust proxy (required for Railway/Heroku/etc behind reverse proxy)
app.set('trust proxy', 1);

// Store raw body for webhook signature verification
app.use(express.json({
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

// Session middleware
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const fs = require('fs');
  const adminExists = fs.existsSync(ADMIN_DIST);
  const indexExists = fs.existsSync(path.join(ADMIN_DIST, 'index.html'));
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    adminPanel: {
      path: ADMIN_DIST,
      exists: adminExists,
      indexExists: indexExists,
    },
  });
});

// WhatsApp webhook routes
app.use('/webhook', webhookRouter);

// Auth routes
app.use('/api/auth', authRouter);

// Admin routes
app.use('/api/admin', adminRouter);

// Serve admin panel static files
app.use(express.static(ADMIN_DIST));

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// SPA fallback - serve index.html for non-API routes
app.use((req: Request, res: Response) => {
  // Return 404 for API routes that don't exist
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  // Serve index.html for SPA routes
  res.sendFile(path.join(ADMIN_DIST, 'index.html'));
});

// Start server
function start(): void {
  try {
    validateConfig();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Webhook URL: http://localhost:${config.port}/webhook`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

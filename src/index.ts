import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config, validateConfig } from './config';
import { SupabaseSessionStore } from './db/sessionStore';
import webhookRouter from './routes/webhook';
import authRouter from './routes/auth';
import adminRouter from './routes/admin/index';
import pagesRouter from './routes/pages';

// Rate limiters
const _authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per window (increased for testing)
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // Higher limit for Meta webhooks
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin panel static files path
const ADMIN_DIST = path.join(__dirname, '../admin-panel/dist');

const app = express();

// Trust proxy (required for Railway/Heroku/etc behind reverse proxy)
app.set('trust proxy', 1);

// Store raw body for webhook signature verification
app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Session middleware with PostgreSQL store (persists across server restarts)
app.use(
  session({
    store: new SupabaseSessionStore(),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WhatsApp webhook routes
app.use('/webhook', webhookLimiter, webhookRouter);

// Auth routes (stricter rate limit)
app.use('/api/auth', authRouter); // authLimiter disabled for testing

// Admin routes
app.use('/api/admin', apiLimiter, adminRouter);

// Public pages (dress code, etc.)
app.use(pagesRouter);

// Serve admin panel static files (includes public/images from Vite build)
app.use(express.static(ADMIN_DIST));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const errorId = Date.now().toString(36);
  console.error(`[${errorId}] Unhandled error on ${req.method} ${req.path}:`, err);

  // Don't leak error details in production
  if (config.nodeEnv === 'production') {
    res.status(500).json({ error: 'Internal server error', errorId });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack, errorId });
  }
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

// Process-level error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
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

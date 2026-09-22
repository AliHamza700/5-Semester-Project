require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectionRoutes = require('./routes/connection.routes');
const schemaRoutes = require('./routes/schema.routes');
const queryRoutes = require('./routes/query.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '2mb' }));

// Rate limiter — 200 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
});
app.use(limiter);

// ── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/connection', connectionRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/query', queryRoutes);

// ── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.', code: 'NOT_FOUND' });
});

// ── Global Error Handler ─────────────────────────────────────
app.use(errorMiddleware);

// ── Start Server ─────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SQLSensei backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;

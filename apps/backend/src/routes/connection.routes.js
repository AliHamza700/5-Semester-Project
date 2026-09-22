const express = require('express');
const connectionService = require('../services/connection.service');

const router = express.Router();

// Helper — get session ID from header
function getSessionId(req) {
  const id = req.headers['x-session-id'];
  if (!id) {
    const err = new Error('Missing X-Session-ID header.');
    err.statusCode = 400;
    err.code = 'MISSING_SESSION_ID';
    throw err;
  }
  return id;
}

// ── POST /api/connection/test ───────────────────────────────
router.post('/test', async (req, res, next) => {
  try {
    const { dbType, config } = req.body;
    if (!dbType || !config) {
      return res.status(400).json({ error: 'dbType and config are required.', code: 'MISSING_FIELDS' });
    }
    const version = await connectionService.testConnection(dbType, config);
    res.json({ success: true, version, dbType });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/connection/connect ────────────────────────────
router.post('/connect', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    const { dbType, config } = req.body;
    if (!dbType || !config) {
      return res.status(400).json({ error: 'dbType and config are required.', code: 'MISSING_FIELDS' });
    }
    await connectionService.connect(sessionId, dbType, config);
    res.json({ success: true, dbType });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/connection/disconnect ─────────────────────────
router.post('/disconnect', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    await connectionService.disconnect(sessionId);
    res.json({ success: true, message: 'Disconnected.' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/connection/status ──────────────────────────────
router.get('/status', (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    const connected = connectionService.isConnected(sessionId);
    const dbType = connectionService.getDbType(sessionId);
    res.json({ connected, dbType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

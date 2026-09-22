const express = require('express');
const { validateSQL } = require('../security/sql-validator');
const connectionService = require('../services/connection.service');

const router = express.Router();

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

// ── POST /api/query/validate ─────────────────────────────────
router.post('/validate', (req, res) => {
  const { sql } = req.body;
  const result = validateSQL(sql);
  if (result.valid) {
    res.json({ valid: true, sanitizedSql: result.sanitizedSql });
  } else {
    res.status(400).json({ valid: false, reason: result.reason });
  }
});

// ── POST /api/query/execute ──────────────────────────────────
router.post('/execute', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    const { sql } = req.body;

    // Always validate before execution
    const validation = validateSQL(sql);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason, code: 'SQL_VALIDATION_FAILED' });
    }

    const connector = connectionService.getConnector(sessionId);
    const result = await connector.executeQuery(validation.sanitizedSql);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/query/explain ──────────────────────────────────
router.post('/explain', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    const { sql } = req.body;

    const validation = validateSQL(sql);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason, code: 'SQL_VALIDATION_FAILED' });
    }

    const connector = connectionService.getConnector(sessionId);
    const result = await connector.explainQuery(validation.sanitizedSql);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

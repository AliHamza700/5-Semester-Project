const express = require('express');
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

/**
 * Convert JSON schema to compact text format for AI context injection.
 */
function buildCompactSchema(schema, dbType) {
  let text = `Database Type: ${dbType}\n`;
  for (const [tableName, tableData] of Object.entries(schema)) {
    const rowCount = tableData.estimatedRowCount?.toLocaleString() || '?';
    text += `\nTable: ${tableName} (~${rowCount} rows)\n`;
    for (const col of tableData.columns) {
      let line = `  ${col.name} ${col.type.toUpperCase()}`;
      if (col.isPrimaryKey) line += ' PRIMARY KEY';
      if (!col.nullable) line += ' NOT NULL';
      if (col.foreignKey) line += ` → ${col.foreignKey.referencesTable}.${col.foreignKey.referencesColumn}`;
      text += line + '\n';
    }
  }
  return text.trim();
}

// ── GET /api/schema ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    const connector = connectionService.getConnector(sessionId);
    const schema = await connector.getSchema();
    res.json({ schema, dbType: connector.dbType });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/schema/compact ──────────────────────────────────
router.get('/compact', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    const connector = connectionService.getConnector(sessionId);
    const schema = await connector.getSchema();
    const compactSchema = buildCompactSchema(schema, connector.dbType);
    res.json({ compactSchema, dbType: connector.dbType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

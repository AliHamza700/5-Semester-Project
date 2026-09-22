const PostgresConnector = require('../connectors/postgres.connector');
const MySQLConnector = require('../connectors/mysql.connector');
const SQLiteConnector = require('../connectors/sqlite.connector');

/**
 * ConnectionService — Singleton session registry.
 * Maps sessionId (UUID) → active DB connector instance.
 */
class ConnectionService {
  constructor() {
    /** @type {Map<string, import('../connectors/base.connector')>} */
    this.sessions = new Map();
  }

  _createConnector(dbType, config) {
    switch (dbType) {
      case 'postgresql': return new PostgresConnector(config);
      case 'mysql':      return new MySQLConnector(config);
      case 'sqlite':     return new SQLiteConnector(config);
      default:
        throw new Error(`Unsupported database type: "${dbType}". Use postgresql, mysql, or sqlite.`);
    }
  }

  /**
   * Test a connection without persisting it.
   * @returns {string} version string
   */
  async testConnection(dbType, config) {
    const connector = this._createConnector(dbType, config);
    return await connector.testConnection();
  }

  /**
   * Open a persistent connection and store it for the session.
   */
  async connect(sessionId, dbType, config) {
    // Disconnect existing session if any
    if (this.sessions.has(sessionId)) {
      await this.disconnect(sessionId);
    }
    const connector = this._createConnector(dbType, config);
    await connector.connect();
    this.sessions.set(sessionId, connector);
  }

  /**
   * Close and remove the session's connection.
   */
  async disconnect(sessionId) {
    const connector = this.sessions.get(sessionId);
    if (connector) {
      await connector.disconnect();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get the active connector or throw a clear error.
   * @throws {Error} if no connection exists for this session
   */
  getConnector(sessionId) {
    const connector = this.sessions.get(sessionId);
    if (!connector || !connector.isConnected()) {
      const err = new Error('No active database connection. Please connect first.');
      err.code = 'NOT_CONNECTED';
      err.statusCode = 400;
      throw err;
    }
    return connector;
  }

  isConnected(sessionId) {
    const c = this.sessions.get(sessionId);
    return c ? c.isConnected() : false;
  }

  getDbType(sessionId) {
    const c = this.sessions.get(sessionId);
    return c ? c.dbType : null;
  }
}

// Singleton — one instance for the entire Node.js process
module.exports = new ConnectionService();

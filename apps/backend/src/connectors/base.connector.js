/**
 * BaseConnector — Abstract interface for all database connectors.
 * Every connector (Postgres, MySQL, SQLite) must extend this class
 * and implement all methods below.
 */
class BaseConnector {
  constructor(config) {
    if (new.target === BaseConnector) {
      throw new Error('BaseConnector is abstract and cannot be instantiated directly.');
    }
    this.config = config;
    this._connected = false;
  }

  /** Open the database connection. */
  async connect() {
    throw new Error('connect() must be implemented by subclass.');
  }

  /** Close the database connection. */
  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass.');
  }

  /** Test connection without persisting it. Returns version string. */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass.');
  }

  /**
   * Extract full schema metadata.
   * @returns {Object} { tableName: { columns: [...], estimatedRowCount: N } }
   */
  async getSchema() {
    throw new Error('getSchema() must be implemented by subclass.');
  }

  /**
   * Execute a validated SELECT query.
   * @returns {{ columns, rows, rowCount, executionTimeMs }}
   */
  async executeQuery(sql, options = {}) {
    throw new Error('executeQuery() must be implemented by subclass.');
  }

  /**
   * Get the query execution plan (EXPLAIN).
   * @returns {{ plan, dbType }}
   */
  async explainQuery(sql) {
    throw new Error('explainQuery() must be implemented by subclass.');
  }

  /** @returns {boolean} */
  isConnected() {
    return this._connected;
  }

  /** Returns config without the password field. */
  safeConfig() {
    const { password, ...safe } = this.config;
    return safe;
  }
}

module.exports = BaseConnector;

const mysql = require('mysql2/promise');
const BaseConnector = require('./base.connector');

class MySQLConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pool = null;
    this.dbType = 'mysql';
  }

  async connect() {
    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port || 3306,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? {} : false,
      connectionLimit: 5,
      connectTimeout: 10000,
    });
    // Test the pool
    const conn = await this.pool.getConnection();
    conn.release();
    this._connected = true;
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this._connected = false;
  }

  async testConnection() {
    const tempPool = mysql.createPool({
      host: this.config.host,
      port: this.config.port || 3306,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      connectionLimit: 1,
      connectTimeout: 10000,
    });
    try {
      const [rows] = await tempPool.query('SELECT VERSION() AS version');
      return rows[0].version;
    } finally {
      await tempPool.end();
    }
  }

  async getSchema() {
    const db = this.config.database;
    const schema = {};

    // 1. Tables
    const [tables] = await this.pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [db]
    );

    for (const { TABLE_NAME: table_name } of tables) {
      // 2. Columns
      const [cols] = await this.pool.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [db, table_name]
      );

      // 3. Foreign keys
      const [fks] = await this.pool.query(
        `SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [db, table_name]
      );

      const fkMap = {};
      for (const fk of fks) {
        fkMap[fk.COLUMN_NAME] = {
          referencesTable: fk.REFERENCED_TABLE_NAME,
          referencesColumn: fk.REFERENCED_COLUMN_NAME,
        };
      }

      // 4. Row count estimate
      const [rowCount] = await this.pool.query(
        `SELECT TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [db, table_name]
      );

      schema[table_name] = {
        columns: cols.map((col) => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          isPrimaryKey: col.COLUMN_KEY === 'PRI',
          nullable: col.IS_NULLABLE === 'YES',
          foreignKey: fkMap[col.COLUMN_NAME] || null,
        })),
        estimatedRowCount: Number(rowCount[0]?.TABLE_ROWS || 0),
      };
    }

    return schema;
  }

  async executeQuery(sql, options = {}) {
    const maxRows = options.maxRows || parseInt(process.env.MAX_QUERY_ROWS) || 1000;
    const timeoutMs = options.timeoutMs || parseInt(process.env.QUERY_TIMEOUT_MS) || 30000;

    let safeSql = sql.trim();
    if (!/\bLIMIT\b/i.test(safeSql)) {
      safeSql += ` LIMIT ${maxRows}`;
    }

    const conn = await this.pool.getConnection();
    try {
      await conn.query(`SET SESSION max_execution_time = ${timeoutMs}`);
      const start = Date.now();
      const [rows, fields] = await conn.query(safeSql);
      const executionTimeMs = Date.now() - start;

      return {
        columns: fields.map((f) => f.name),
        rows,
        rowCount: rows.length,
        executionTimeMs,
      };
    } catch (err) {
      throw this._normalise(err);
    } finally {
      conn.release();
    }
  }

  async explainQuery(sql) {
    const [rows] = await this.pool.query(`EXPLAIN FORMAT=JSON ${sql}`);
    return { plan: rows[0], dbType: this.dbType };
  }

  _normalise(err) {
    const map = {
      ECONNREFUSED: 'Cannot reach the MySQL server. Check the host and port.',
      ER_ACCESS_DENIED_ERROR: 'Incorrect username or password.',
      ER_BAD_DB_ERROR: 'Database does not exist.',
      ER_DBACCESS_DENIED_ERROR: 'Permission denied.',
      ETIMEDOUT: 'Connection timed out.',
    };
    const msg = map[err.code] || 'Database connection failed.';
    const out = new Error(msg);
    out.code = err.code;
    return out;
  }
}

module.exports = MySQLConnector;

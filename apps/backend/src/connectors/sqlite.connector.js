// node:sqlite is built into Node.js 22.5+ — no installation needed!
const { DatabaseSync } = require('node:sqlite');
const BaseConnector = require('./base.connector');

class SQLiteConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.db = null;
    this.dbType = 'sqlite';
    // config.filename — path to .db file, or ':memory:'
  }

  async connect() {
    this.db = new DatabaseSync(this.config.filename);
    // Security Note: node:sqlite does not have a built-in readonly flag.
    // Read-only enforcement is guaranteed by the SQL Validator (sql-validator.js)
    // which blocks all non-SELECT statements before they reach this connector.
    this._connected = true;
  }

  async disconnect() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this._connected = false;
  }

  async testConnection() {
    const tempDb = new DatabaseSync(this.config.filename === ':memory:' ? ':memory:' : this.config.filename);
    try {
      const row = tempDb.prepare('SELECT sqlite_version() AS version').get();
      return `SQLite ${row.version}`;
    } finally {
      tempDb.close();
    }
  }

  async getSchema() {
    // 1. All tables (exclude internal sqlite_ tables)
    const tables = this.db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
      .all();

    const schema = {};

    for (const { name: table_name } of tables) {
      // 2. Columns + PK detection via PRAGMA
      const cols = this.db.prepare(`PRAGMA table_info("${table_name}")`).all();

      // 3. Foreign keys
      const fks = this.db.prepare(`PRAGMA foreign_key_list("${table_name}")`).all();
      const fkMap = {};
      for (const fk of fks) {
        fkMap[fk.from] = { referencesTable: fk.table, referencesColumn: fk.to };
      }

      // 4. Exact row count
      const countRow = this.db.prepare(`SELECT COUNT(*) AS n FROM "${table_name}"`).get();

      schema[table_name] = {
        columns: cols.map((col) => ({
          name: col.name,
          type: col.type,
          isPrimaryKey: col.pk > 0,
          nullable: col.notnull === 0,
          foreignKey: fkMap[col.name] || null,
        })),
        estimatedRowCount: Number(countRow.n),
      };
    }

    return schema;
  }

  async executeQuery(sql, options = {}) {
    const maxRows = options.maxRows || parseInt(process.env.MAX_QUERY_ROWS) || 1000;

    let safeSql = sql.trim();
    if (!/\bLIMIT\b/i.test(safeSql)) {
      safeSql += ` LIMIT ${maxRows}`;
    }

    try {
      const start = Date.now();
      const rows = this.db.prepare(safeSql).all();
      const executionTimeMs = Date.now() - start;
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        columns,
        rows,
        rowCount: rows.length,
        executionTimeMs,
      };
    } catch (err) {
      throw this._normalise(err);
    }
  }

  async explainQuery(sql) {
    const rows = this.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
    return { plan: rows, dbType: this.dbType };
  }

  _normalise(err) {
    const msg = err.message || 'SQLite database error.';
    const out = new Error(msg);
    out.code = err.code || 'SQLITE_ERROR';
    return out;
  }
}

module.exports = SQLiteConnector;

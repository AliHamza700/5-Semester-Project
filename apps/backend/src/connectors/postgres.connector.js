const { Pool } = require('pg');
const BaseConnector = require('./base.connector');

class PostgresConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pool = null;
    this.dbType = 'postgresql';
  }

  async connect() {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      connectionTimeoutMillis: 10000,
    });
    // Test the pool immediately
    const client = await this.pool.connect();
    client.release();
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
    const tempPool = new Pool({
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    try {
      const result = await tempPool.query('SELECT version()');
      return result.rows[0].version;
    } finally {
      await tempPool.end();
    }
  }

  async getSchema() {
    const client = await this.pool.connect();
    try {
      // 1. Get all tables
      const tablesResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const schema = {};

      for (const { table_name } of tablesResult.rows) {
        // 2. Columns + primary key detection
        const colsResult = await client.query(`
          SELECT
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name = $1
              AND tc.table_schema = 'public'
          ) pk ON c.column_name = pk.column_name
          WHERE c.table_name = $1 AND c.table_schema = 'public'
          ORDER BY c.ordinal_position
        `, [table_name]);

        // 3. Foreign keys
        const fkResult = await client.query(`
          SELECT
            kcu.column_name,
            ccu.table_name AS ref_table,
            ccu.column_name AS ref_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
            AND tc.table_schema = 'public'
        `, [table_name]);

        const fkMap = {};
        for (const fk of fkResult.rows) {
          fkMap[fk.column_name] = { referencesTable: fk.ref_table, referencesColumn: fk.ref_column };
        }

        // 4. Row count estimate
        const rowResult = await client.query(
          `SELECT reltuples::bigint AS row_count FROM pg_class WHERE relname = $1`,
          [table_name]
        );

        schema[table_name] = {
          columns: colsResult.rows.map((col) => ({
            name: col.column_name,
            type: col.data_type,
            isPrimaryKey: col.is_primary_key,
            nullable: col.is_nullable === 'YES',
            foreignKey: fkMap[col.column_name] || null,
          })),
          estimatedRowCount: Number(rowResult.rows[0]?.row_count || 0),
        };
      }

      return schema;
    } finally {
      client.release();
    }
  }

  async executeQuery(sql, options = {}) {
    const maxRows = options.maxRows || parseInt(process.env.MAX_QUERY_ROWS) || 1000;
    const timeoutMs = options.timeoutMs || parseInt(process.env.QUERY_TIMEOUT_MS) || 30000;

    // Append LIMIT if not present
    let safeSql = sql.trim();
    if (!/\bLIMIT\b/i.test(safeSql)) {
      safeSql += ` LIMIT ${maxRows}`;
    }

    const client = await this.pool.connect();
    try {
      await client.query(`SET statement_timeout = ${timeoutMs}`);
      const start = Date.now();
      const result = await client.query(safeSql);
      const executionTimeMs = Date.now() - start;

      return {
        columns: result.fields.map((f) => f.name),
        rows: result.rows,
        rowCount: result.rowCount,
        executionTimeMs,
      };
    } catch (err) {
      throw this._normalise(err);
    } finally {
      client.release();
    }
  }

  async explainQuery(sql) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`EXPLAIN (FORMAT JSON, ANALYZE false, VERBOSE false) ${sql}`);
      return { plan: result.rows[0]['QUERY PLAN'], dbType: this.dbType };
    } finally {
      client.release();
    }
  }

  _normalise(err) {
    const map = {
      ECONNREFUSED: 'Cannot reach the PostgreSQL server. Check the host and port.',
      '28P01': 'Incorrect username or password.',
      '3D000': 'Database does not exist.',
      '42501': 'Permission denied.',
      ETIMEDOUT: 'Connection timed out.',
    };
    const msg = map[err.code] || map[err.errno] || 'Database connection failed.';
    const out = new Error(msg);
    out.code = err.code;
    return out;
  }
}

module.exports = PostgresConnector;

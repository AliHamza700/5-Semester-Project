const SQLiteConnector = require('../src/connectors/sqlite.connector');

describe('SQLite Connector', () => {
  let connector;
  const dbPath = process.env.TEST_SQLITE_DB;

  beforeAll(async () => {
    connector = new SQLiteConnector({ filename: dbPath });
    await connector.connect();
  });

  afterAll(async () => {
    await connector.disconnect();
  });

  // ── Connection ─────────────────────────────────────────────
  describe('Connection', () => {
    test('connects to test.db successfully', () => {
      expect(connector.isConnected()).toBe(true);
    });

    test('testConnection() returns SQLite version string', async () => {
      const tempConnector = new SQLiteConnector({ filename: ':memory:' });
      const version = await tempConnector.testConnection();
      expect(version).toMatch(/^SQLite \d+\.\d+/);
    });

    test('disconnect sets isConnected to false', async () => {
      const tempConnector = new SQLiteConnector({ filename: dbPath });
      await tempConnector.connect();
      await tempConnector.disconnect();
      expect(tempConnector.isConnected()).toBe(false);
    });
  });

  // ── Schema ─────────────────────────────────────────────────
  describe('Schema extraction', () => {
    let schema;

    beforeAll(async () => {
      schema = await connector.getSchema();
    });

    test('detects both tables', () => {
      expect(schema).toHaveProperty('customers');
      expect(schema).toHaveProperty('orders');
    });

    test('extracts columns from customers table', () => {
      const colNames = schema.customers.columns.map((c) => c.name);
      expect(colNames).toContain('id');
      expect(colNames).toContain('name');
      expect(colNames).toContain('country');
    });

    test('identifies primary key on customers.id', () => {
      const idCol = schema.customers.columns.find((c) => c.name === 'id');
      expect(idCol.isPrimaryKey).toBe(true);
    });

    test('detects foreign key on orders.customer_id', () => {
      const fkCol = schema.orders.columns.find((c) => c.name === 'customer_id');
      expect(fkCol.foreignKey).not.toBeNull();
      expect(fkCol.foreignKey.referencesTable).toBe('customers');
    });

    test('row counts are accurate', () => {
      expect(schema.customers.estimatedRowCount).toBe(3);
      expect(schema.orders.estimatedRowCount).toBe(4);
    });
  });

  // ── Query Execution ────────────────────────────────────────
  describe('Query execution', () => {
    test('simple SELECT returns correct columns and rows', async () => {
      const result = await connector.executeQuery('SELECT * FROM customers');
      expect(result.columns).toEqual(expect.arrayContaining(['id', 'name', 'country']));
      expect(result.rows.length).toBe(3);
    });

    test('maxRows option is enforced', async () => {
      const result = await connector.executeQuery('SELECT * FROM customers', { maxRows: 1 });
      expect(result.rows.length).toBe(1);
    });

    test('executionTimeMs is non-negative', async () => {
      const result = await connector.executeQuery('SELECT * FROM customers');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('JOIN query returns correct columns and row count', async () => {
      const result = await connector.executeQuery(
        'SELECT c.name, o.amount FROM customers c JOIN orders o ON c.id = o.customer_id'
      );
      expect(result.columns).toEqual(expect.arrayContaining(['name', 'amount']));
      expect(result.rows.length).toBe(4);
    });

    test('GROUP BY aggregation works correctly', async () => {
      const result = await connector.executeQuery(
        'SELECT customer_id, COUNT(*) AS total FROM orders GROUP BY customer_id'
      );
      expect(result.columns).toEqual(expect.arrayContaining(['customer_id', 'total']));
      expect(result.rows.length).toBe(3);
    });
  });
});

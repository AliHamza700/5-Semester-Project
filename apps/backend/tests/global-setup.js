// Uses Node.js built-in sqlite — no extra package needed
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

/**
 * global-setup.js — Runs ONCE before all tests.
 * Creates the test SQLite database with sample data.
 */
module.exports = async () => {
  const dbPath = path.join(__dirname, 'test.db');

  const db = new DatabaseSync(dbPath);

  db.exec(`
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS customers;

    CREATE TABLE customers (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      name    TEXT    NOT NULL,
      country TEXT
    );

    CREATE TABLE orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      amount      REAL,
      order_date  TEXT
    );

    INSERT INTO customers (name, country) VALUES
      ('Alice', 'USA'),
      ('Bob',   'UK'),
      ('Carol', 'Canada');

    INSERT INTO orders (customer_id, amount, order_date) VALUES
      (1, 99.99,  '2025-01-15'),
      (1, 149.50, '2025-02-20'),
      (2, 75.00,  '2025-03-01'),
      (3, 200.00, '2025-03-10');
  `);

  db.close();

  process.env.TEST_SQLITE_DB = dbPath;
  console.log(`\n[Test Setup] SQLite test DB created at: ${dbPath}`);
};

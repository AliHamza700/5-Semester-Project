const { validateSQL } = require('../src/security/sql-validator');

describe('SQL Validator', () => {

  // ── Valid Queries ──────────────────────────────────────────
  describe('Valid queries (should pass)', () => {
    test('Simple SELECT', () => {
      const result = validateSQL('SELECT * FROM users');
      expect(result.valid).toBe(true);
      expect(result.sanitizedSql).toBe('SELECT * FROM users');
    });

    test('SELECT with WHERE clause', () => {
      const result = validateSQL('SELECT id, name FROM customers WHERE country = "USA"');
      expect(result.valid).toBe(true);
    });

    test('SELECT with JOIN and GROUP BY', () => {
      const result = validateSQL(
        'SELECT c.name, COUNT(o.id) FROM customers c INNER JOIN orders o ON c.id = o.customer_id GROUP BY c.name'
      );
      expect(result.valid).toBe(true);
    });

    test('CTE (WITH clause)', () => {
      const result = validateSQL(
        'WITH ranked AS (SELECT *, ROW_NUMBER() OVER (ORDER BY amount DESC) AS rn FROM orders) SELECT * FROM ranked WHERE rn <= 10'
      );
      expect(result.valid).toBe(true);
    });

    test('Trailing semicolon is stripped', () => {
      const result = validateSQL('SELECT * FROM users;');
      expect(result.valid).toBe(true);
      expect(result.sanitizedSql).toBe('SELECT * FROM users');
    });

    test('Column named "inserted_at" does not trigger INSERT block', () => {
      const result = validateSQL('SELECT inserted_at FROM events');
      expect(result.valid).toBe(true);
    });

    test('Column named "deleted_at" does not trigger DELETE block', () => {
      const result = validateSQL('SELECT deleted_at FROM logs WHERE deleted_at IS NOT NULL');
      expect(result.valid).toBe(true);
    });
  });

  // ── Blocked Queries ────────────────────────────────────────
  describe('Blocked operations (should reject)', () => {
    test('DELETE', () => {
      expect(validateSQL('DELETE FROM users').valid).toBe(false);
    });

    test('DROP TABLE', () => {
      expect(validateSQL('DROP TABLE users').valid).toBe(false);
    });

    test('UPDATE', () => {
      expect(validateSQL("UPDATE users SET name = 'x'").valid).toBe(false);
    });

    test('INSERT', () => {
      expect(validateSQL('INSERT INTO users VALUES (1, "x")').valid).toBe(false);
    });

    test('ALTER TABLE', () => {
      expect(validateSQL('ALTER TABLE users ADD COLUMN x TEXT').valid).toBe(false);
    });

    test('TRUNCATE', () => {
      expect(validateSQL('TRUNCATE TABLE users').valid).toBe(false);
    });

    test('CREATE TABLE', () => {
      expect(validateSQL('CREATE TABLE evil (id INT)').valid).toBe(false);
    });

    test('GRANT', () => {
      expect(validateSQL('GRANT ALL ON users TO hacker').valid).toBe(false);
    });
  });

  // ── Injection Attempts ─────────────────────────────────────
  describe('Injection attempts (should reject)', () => {
    test('Multi-statement: SELECT + DROP', () => {
      expect(validateSQL('SELECT * FROM users; DROP TABLE users').valid).toBe(false);
    });

    test('Inline comment bypass (--)', () => {
      expect(validateSQL('SELECT * FROM users -- WHERE 1=1').valid).toBe(false);
    });

    test('Block comment bypass (/* */)', () => {
      expect(validateSQL('SELECT * FROM users /* bypass */').valid).toBe(false);
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────
  describe('Edge cases', () => {
    test('Empty string', () => {
      expect(validateSQL('').valid).toBe(false);
    });

    test('null input', () => {
      expect(validateSQL(null).valid).toBe(false);
    });

    test('Numeric input', () => {
      expect(validateSQL(42).valid).toBe(false);
    });

    test('SHOW TABLES', () => {
      expect(validateSQL('SHOW TABLES').valid).toBe(false);
    });
  });
});

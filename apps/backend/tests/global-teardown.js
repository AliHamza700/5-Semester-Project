const fs = require('fs');

/**
 * global-teardown.js — Runs ONCE after all tests.
 * Deletes the test SQLite database file.
 */
module.exports = async () => {
  const dbPath = process.env.TEST_SQLITE_DB;
  if (dbPath && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`\n[Test Teardown] SQLite test DB deleted: ${dbPath}`);
  }
};

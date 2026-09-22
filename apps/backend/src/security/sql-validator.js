/**
 * SQL Validator — Critical security component.
 *
 * Every query must pass ALL 5 checks before execution.
 * This validator is INDEPENDENT of the AI model — it cannot be bypassed by any prompt.
 *
 * Blocked operations: INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE,
 *                     GRANT, REVOKE, REPLACE, MERGE, UPSERT, EXECUTE, EXEC,
 *                     CALL, LOAD, COPY, IMPORT, ATTACH, DETACH
 */

const BLOCKED_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE',
  'GRANT', 'REVOKE', 'REPLACE', 'MERGE', 'UPSERT', 'EXECUTE', 'EXEC',
  'CALL', 'LOAD', 'COPY', 'IMPORT', 'ATTACH', 'DETACH',
];

/**
 * Validate a SQL string for safety.
 * @param {*} sql
 * @returns {{ valid: boolean, sanitizedSql?: string, reason?: string }}
 */
function validateSQL(sql) {
  // Check 1: Must be a non-empty string
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    return { valid: false, reason: 'SQL query must be a non-empty string.' };
  }

  const trimmed = sql.trim();

  // Check 2: No SQL comments (used in injection bypass techniques)
  if (/--/.test(trimmed) || /\/\*/.test(trimmed)) {
    return { valid: false, reason: 'SQL comments are not permitted.' };
  }

  // Check 3: No multiple statements (semicolon injection)
  // Allow trailing semicolon but block multiple statements
  const withoutTrailingSemi = trimmed.replace(/;$/, '');
  if (/;/.test(withoutTrailingSemi)) {
    return { valid: false, reason: 'Multiple SQL statements are not permitted.' };
  }

  // Check 4: Must start with SELECT or WITH (CTEs)
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    return { valid: false, reason: 'Only SELECT queries are permitted.' };
  }

  // Check 5: No blocked keywords (word boundary — avoids false positives on column names)
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(trimmed)) {
      return {
        valid: false,
        reason: `Query contains a disallowed operation: ${keyword}.`,
      };
    }
  }

  return { valid: true, sanitizedSql: trimmed.replace(/;$/, '') };
}

module.exports = { validateSQL };

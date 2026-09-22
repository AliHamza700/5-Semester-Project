# SQLSensei — Week 1 Documentation
## Problem Definition & Toolchain Setup

---

> **Project:** AI-Powered Natural Language SQL Assistant  
> **Phase:** Week 1 — Foundation  
> **Team:** sqlsensei-dev  
> **Repository:** github.com/sqlsensei-dev/sqlsensei  
> **Date:** September 2025  
> **Semester:** 5th Semester — Software Engineering

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Definition](#2-problem-definition)
3. [Finalized Project Requirements](#3-finalized-project-requirements)
4. [Technology Stack & Justification](#4-technology-stack--justification)
5. [System Architecture](#5-system-architecture)
6. [Repository Setup](#6-repository-setup)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Module Implementation](#8-module-implementation)
9. [Database Connectors](#9-database-connectors)
10. [Security Layer Design](#10-security-layer-design)
11. [REST API Design](#11-rest-api-design)
12. [Project File Structure](#12-project-file-structure)
13. [Setup & Installation Guide](#13-setup--installation-guide)
14. [Testing Plan & Results](#14-testing-plan--results)
15. [Week 1 Deliverables Checklist](#15-week-1-deliverables-checklist)
16. [Challenges & Solutions](#16-challenges--solutions)
17. [Week 2 Preview](#17-week-2-preview)

---

## 1. Executive Summary

SQLSensei is an AI-powered desktop and web application that allows users to query any relational database using plain English instead of SQL. The target audience includes non-technical product managers, marketing analysts, and business users who cannot write SQL but need data access.

Week 1 focused on three goals:

| Goal | Description | Status |
|------|-------------|--------|
| Problem Definition | Finalize all functional and non-functional requirements | ✅ Done |
| Toolchain Setup | Choose and configure the full development stack | ✅ Done |
| Base Initialization | Set up monorepo, CI pipeline, and all connectors | ✅ Done |

By the end of Week 1, a user can connect to a PostgreSQL, MySQL, or SQLite database, inspect its full schema, and execute safe read-only SQL queries through a validated API.

---

## 2. Problem Definition

### 2.1 Background

Relational databases store some of the most valuable business data in any organization. However, accessing that data typically requires writing SQL — a skill that most business users do not have. This creates a bottleneck where non-technical employees depend on engineers or data analysts for even simple data requests such as:

- "How many orders did we get this month?"
- "Which customers have not ordered in 90 days?"
- "What are our top 10 products by revenue?"

Each of these questions can be answered with a simple SQL query, but writing that query correctly — especially across multiple joined tables — is a barrier for most users.

### 2.2 Pain Points Identified

The following pain points were identified through project analysis:

**For Non-Technical Users:**
- Cannot write SQL involving JOINs, GROUP BY, or subqueries
- Must request data from engineers, causing delays
- Cannot explore data independently
- No visibility into query results or performance

**For Junior Developers:**
- Struggle with complex query optimization
- Do not understand EXPLAIN plans or index strategies
- Write inefficient queries without knowing it
- Miss relationships between tables

**For Organizations:**
- Engineering time wasted on simple data requests
- Data analysis bottlenecked by technical knowledge
- No self-service data access for business teams

### 2.3 Proposed Solution

SQLSensei bridges this gap by:

1. Accepting a natural language question as input
2. Inspecting the real database schema as context
3. Generating valid SQL using an AI model (Gemini)
4. Validating the SQL for safety before execution
5. Executing only read-only queries
6. Displaying results with charts and explanations
7. Providing query plan analysis in plain language

### 2.4 Scope & Boundaries

**In Scope (v1.0):**
- PostgreSQL, MySQL, and SQLite database support
- Natural language to SQL conversion
- Read-only query execution only
- Schema browser and metadata extraction
- Query result visualization (tables and charts)
- EXPLAIN / query plan analysis
- Query optimization suggestions

**Out of Scope (v1.0):**
- Data insertion, updates, or deletions
- User authentication and multi-user support
- Cloud database hosting
- NoSQL databases (MongoDB, Redis, etc.)
- Real-time data streaming
- Scheduled / automated queries

---

## 3. Finalized Project Requirements

### 3.1 Functional Requirements

#### FR-01 — Database Connection
- The system must support connections to PostgreSQL (port 5432), MySQL (port 3306), and SQLite (file path)
- The system must test a connection before saving it
- The system must handle connection errors with clear, user-friendly messages (not raw error codes)
- The system must never expose database passwords in API responses or frontend logs

#### FR-02 — Schema Extraction
- After connecting, the system must automatically inspect and extract:
  - Table names
  - Column names and data types
  - Primary key columns
  - Foreign key relationships
  - Estimated row counts
- The system must format schema as compact text for AI context injection

#### FR-03 — Natural Language Interface (Week 2)
- The system must accept a plain English question from the user
- The system must convert the question to SQL using the Gemini AI API
- The AI must receive the full schema as context

#### FR-04 — SQL Validation (Week 1)
- Every generated or manually written SQL query must pass a server-side validator before execution
- The validator must reject all non-SELECT statements
- The validator must reject multiple statements (semicolon injection)
- The validator must reject SQL comments used for injection bypass

#### FR-05 — Query Execution
- Only validated, read-only SQL queries may reach the database
- The system must apply a configurable row limit (default: 1,000 rows)
- The system must apply a configurable query timeout (default: 30 seconds)
- Results must be returned as structured JSON: `{ columns, rows, rowCount, executionTimeMs }`

#### FR-06 — Result Dashboard (Month 3)
- Results must be displayed in a sortable, paginated data table
- A suitable chart must be auto-generated from results using Chart.js
- Execution time and row count must be displayed

#### FR-07 — EXPLAIN Analysis (Month 4)
- The system must run EXPLAIN on the generated SQL
- The plan must be displayed in human-readable language
- Optimization suggestions must be provided

#### FR-08 — Query History (Month 3)
- The system must maintain a local history of executed queries
- History must include: question, SQL, timestamp, execution time, success/failure

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-01 | Security | No destructive SQL may execute under any circumstance |
| NFR-02 | Performance | SQL generation < 5 seconds; query execution < timeout |
| NFR-03 | Usability | Non-technical users can query without reading documentation |
| NFR-04 | Reliability | Connection errors handled gracefully without crashing |
| NFR-05 | Portability | Runs as web app (Next.js) and desktop app (Electron) |
| NFR-06 | Maintainability | DB connectors are modular and independently replaceable |
| NFR-07 | Extensibility | New database types can be added with a new connector file |
| NFR-08 | Confidentiality | API keys and DB passwords never reach the frontend |

### 3.3 Security Requirements

| ID | Requirement |
|----|-------------|
| SEC-01 | Gemini API key stored on backend only, never exposed to client |
| SEC-02 | Database passwords never returned in API responses |
| SEC-03 | AI-generated SQL treated as untrusted input at all times |
| SEC-04 | Server-side SQL validation independent of AI prompt restrictions |
| SEC-05 | Read-only database connections enforced at connector level |
| SEC-06 | Rate limiting applied to all API endpoints |
| SEC-07 | Query row limits prevent memory exhaustion from large results |
| SEC-08 | Query timeouts prevent long-running queries from blocking the server |

---

## 4. Technology Stack & Justification

### 4.1 Technology Decisions

| Layer | Chosen Technology | Reason |
|-------|-------------------|--------|
| Frontend | Next.js 14 (App Router) | Industry standard React framework; SSR + static export for Electron; large ecosystem |
| Desktop | Electron 28 | Wraps Next.js as a native desktop app; cross-platform (Windows, macOS, Linux) |
| Backend | Node.js + Express | Same language as frontend (JavaScript); fast I/O; large ecosystem for DB drivers |
| Package Manager | pnpm 8 | Faster installs than npm/yarn; native monorepo workspace support; disk-efficient |
| Monorepo | pnpm workspaces | Manages frontend, backend, and desktop in a single repository |
| PostgreSQL Driver | pg (node-postgres) | Official and most widely used PostgreSQL driver for Node.js |
| MySQL Driver | mysql2 | Promise-based; faster than the original mysql package; supports prepared statements |
| SQLite Driver | better-sqlite3 | Synchronous API; faster than sqlite3; used by many production tools |
| Styling | Tailwind CSS | Utility-first; no runtime overhead; consistent design tokens |
| CI/CD | GitHub Actions | Free for public repos; integrates directly with GitHub; supports Docker services |
| AI Model | Gemini API (Week 2) | Gemini 1.5 Pro has strong SQL generation capabilities; large context window for schema injection |
| Charts | Chart.js (Month 3) | Lightweight; well-documented; supports all required chart types |
| Testing | Jest | Standard Node.js test runner; built-in mocking; CI-friendly |

### 4.2 Why pnpm Workspaces?

A monorepo with pnpm workspaces was chosen over three separate repositories because:

- All three apps (frontend, backend, desktop) share the same codebase and must be versioned together
- Single `pnpm install` sets up the entire project
- Shared scripts (`pnpm dev`, `pnpm test`) run across all apps
- CI pipeline runs in a single workflow file
- `pnpm` uses hard links for packages — installs are 2-3x faster than npm and use ~60% less disk space

### 4.3 Why Electron + Next.js?

Rather than building a separate Electron app from scratch, the Electron app wraps the Next.js web app:

- In development: Electron loads `http://localhost:3000` (Next.js dev server)
- In production: Next.js is built as a static export, and Electron loads the HTML files directly
- This means the same codebase works as both a web app and a desktop app
- No duplicate UI code

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│              Next.js (Web)  │  Electron (Desktop)              │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP / REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                             │
│                    Node.js + Express                           │
│   ┌─────────────────────────────────────────────────────┐     │
│   │               Rate Limiter (express-rate-limit)      │     │
│   └──────────────────────────┬──────────────────────────┘     │
│                              │                                  │
│   ┌──────────────┐   ┌───────┴────────┐   ┌────────────────┐  │
│   │  /connection │   │   /schema      │   │   /query       │  │
│   └──────┬───────┘   └───────┬────────┘   └───────┬────────┘  │
│          │                   │                     │            │
│          └───────────────────┼─────────────────────┘            │
│                              │                                  │
│   ┌──────────────────────────▼──────────────────────────────┐  │
│   │               Connection Service                        │  │
│   │           (Session Map: sessionId → Connector)         │  │
│   └──────────────────────────┬──────────────────────────────┘  │
│                              │                                  │
│                    ┌─────────▼──────────┐                      │
│                    │   SQL VALIDATOR    │  ← Security Layer     │
│                    │ (blocks non-SELECT) │                      │
│                    └─────────┬──────────┘                      │
│                              │                                  │
│   ┌──────────────────────────▼──────────────────────────────┐  │
│   │                  DB CONNECTORS                          │  │
│   │   ┌───────────┐  ┌───────────┐  ┌────────────────┐    │  │
│   │   │ Postgres  │  │   MySQL   │  │    SQLite      │    │  │
│   │   │ Connector │  │ Connector │  │   Connector    │    │  │
│   │   └─────┬─────┘  └─────┬─────┘  └───────┬────────┘    │  │
│   └─────────┼──────────────┼────────────────┼──────────────┘  │
└─────────────┼──────────────┼────────────────┼──────────────────┘
              │              │                │
              ▼              ▼                ▼
        PostgreSQL         MySQL            SQLite
         Database         Database          File
```

### 5.2 Request Lifecycle

```
User types query in frontend
        │
        ▼
Next.js (React)
  api.executeQuery(sql)
        │
        │  POST /api/query/execute
        │  Header: X-Session-ID: <uuid>
        ▼
Express Router
        │
        ▼
Rate Limiter ──► 429 Too Many Requests (if exceeded)
        │
        ▼
SQL Validator
  ├── Is it a SELECT query?         No  ──► 400 Bad Request
  ├── Multiple statements?          Yes ──► 400 Bad Request
  ├── Contains blocked keywords?    Yes ──► 400 Bad Request
  └── Contains SQL comments?        Yes ──► 400 Bad Request
        │ (all checks pass)
        ▼
Connection Service
  └── getConnector(sessionId)
        │
        ▼
DB Connector (Postgres / MySQL / SQLite)
  ├── Apply row LIMIT if missing
  ├── Set statement timeout
  └── Execute query
        │
        ▼
Return { columns, rows, rowCount, executionTimeMs }
        │
        ▼
JSON Response to Frontend
        │
        ▼
Display in Result Table + Chart
```

### 5.3 Connection Session Model

```
Frontend (Browser / Electron)
  │
  │  localStorage: sqlsensei_session_id = "a1b2c3d4-..."
  │
  │  Every API request includes:
  │  Header: X-Session-ID: "a1b2c3d4-..."
  │
  ▼
Backend Connection Service
  │
  │  sessions = Map {
  │    "a1b2c3d4-..." → PostgresConnector { pool, config }
  │    "x9y8z7w6-..." → MySQLConnector    { pool, config }
  │  }
  │
  └── getConnector("a1b2c3d4-...") → PostgresConnector
```

Each browser session gets its own database connection. Sessions are stored in a server-side Map. This is intentionally simple for Week 1 single-user use.

---

## 6. Repository Setup

### 6.1 Monorepo Structure

```
sqlsensei/                          ← Root (pnpm workspace)
├── package.json                    ← Root scripts & prettier config
├── pnpm-workspace.yaml             ← Declares workspace packages
├── .gitignore
├── .env.example
├── README.md
│
├── .github/
│   └── workflows/
│       └── ci.yml                  ← GitHub Actions CI pipeline
│
├── apps/
│   ├── backend/                    ← Node.js + Express API
│   │   ├── package.json
│   │   ├── jest.config.js
│   │   ├── .env.example
│   │   ├── src/
│   │   │   ├── index.js            ← Express app entry point
│   │   │   ├── connectors/
│   │   │   │   ├── base.connector.js
│   │   │   │   ├── postgres.connector.js
│   │   │   │   ├── mysql.connector.js
│   │   │   │   └── sqlite.connector.js
│   │   │   ├── routes/
│   │   │   │   ├── connection.routes.js
│   │   │   │   ├── schema.routes.js
│   │   │   │   └── query.routes.js
│   │   │   ├── services/
│   │   │   │   └── connection.service.js
│   │   │   ├── security/
│   │   │   │   └── sql-validator.js  ← CRITICAL security component
│   │   │   └── middleware/
│   │   │       └── error.middleware.js
│   │   └── tests/
│   │       ├── global-setup.js
│   │       ├── global-teardown.js
│   │       ├── sql-validator.test.js
│   │       └── sqlite.connector.test.js
│   │
│   ├── frontend/                   ← Next.js 14 web app
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.jsx
│   │       │   ├── page.jsx
│   │       │   └── globals.css
│   │       ├── components/
│   │       │   ├── ConnectionPanel.jsx
│   │       │   ├── SchemaViewer.jsx
│   │       │   └── StatusBar.jsx
│   │       └── lib/
│   │           ├── api.js          ← Backend API client
│   │           └── session.js      ← Session ID management
│   │
│   └── desktop/                   ← Electron desktop wrapper
│       ├── package.json
│       └── electron/
│           ├── main.js             ← Electron main process
│           └── preload.js          ← Secure context bridge
│
└── packages/                      ← Shared packages (future use)
```

### 6.2 pnpm Workspace Configuration

**`pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

This tells pnpm that `apps/backend`, `apps/frontend`, and `apps/desktop` are all separate packages within the same monorepo. Running `pnpm install` from the root installs all dependencies for all packages in one command.

### 6.3 Root Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | runs all apps in parallel | Starts backend + frontend simultaneously |
| `pnpm dev:backend` | backend only | Starts Express server on port 3001 |
| `pnpm dev:frontend` | frontend only | Starts Next.js on port 3000 |
| `pnpm dev:desktop` | desktop only | Starts Electron (requires frontend running) |
| `pnpm test` | all apps | Runs Jest across all packages |
| `pnpm build` | backend + frontend | Production build |

### 6.4 Branch Strategy

```
main          ← Production-ready code only
  │
  └── develop ← Integration branch
        │
        ├── feature/week-1-foundation
        ├── feature/week-2-ai-text-to-sql
        ├── feature/month-3-dashboard
        └── feature/month-4-optimization
```

Pull requests must pass the CI pipeline before merging to `main`.

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions Workflow Overview

The CI pipeline runs automatically on every push to `main` or `develop`, and on every pull request targeting `main`.

**File:** `.github/workflows/ci.yml`

### 7.2 Jobs

```
GitHub Actions Trigger
(push to main/develop or PR)
        │
        ├── Job 1: test
        │     ├── Spin up PostgreSQL 15 service container
        │     ├── Spin up MySQL 8.0 service container
        │     ├── Install pnpm
        │     ├── Install Node.js 20
        │     ├── pnpm install --frozen-lockfile
        │     ├── Run backend Jest tests (with DB env vars)
        │     └── Build Next.js frontend
        │
        └── Job 2: security
              ├── Install pnpm
              ├── pnpm install
              └── pnpm audit --audit-level=high
```

### 7.3 Service Containers

The CI pipeline uses Docker service containers to provide real PostgreSQL and MySQL instances for integration testing — no mocking required.

**PostgreSQL:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    ports: ["5432:5432"]
    options: --health-cmd pg_isready
```

**MySQL:**
```yaml
  mysql:
    image: mysql:8.0
    env:
      MYSQL_DATABASE: testdb
      MYSQL_USER: testuser
      MYSQL_PASSWORD: testpass
      MYSQL_ROOT_PASSWORD: rootpass
    ports: ["3306:3306"]
    options: --health-cmd "mysqladmin ping"
```

SQLite does not need a service container — it uses an in-memory database created during `global-setup.js`.

### 7.4 Environment Variables in CI

Test credentials are injected as GitHub Actions environment variables and are only used during the test job:

```
TEST_PG_HOST=localhost
TEST_PG_PORT=5432
TEST_PG_DB=testdb
TEST_PG_USER=testuser
TEST_PG_PASSWORD=testpass
TEST_MYSQL_HOST=localhost
TEST_MYSQL_PORT=3306
TEST_MYSQL_DB=testdb
TEST_MYSQL_USER=testuser
TEST_MYSQL_PASSWORD=testpass
```

These values are hardcoded for the CI environment only. Real production credentials are never committed to the repository.

---

## 8. Module Implementation

### 8.1 Backend Entry Point (`apps/backend/src/index.js`)

The Express application is configured with:

| Middleware | Purpose |
|-----------|---------|
| `cors` | Allows requests from `localhost:3000` (frontend) |
| `express.json` | Parses incoming JSON request bodies (max 2MB) |
| `express-rate-limit` | 200 requests per 15 minutes per IP — prevents abuse |
| Error middleware | Catches all unhandled errors and returns safe, structured JSON |

**API Endpoints registered:**

| Prefix | Router File | Purpose |
|--------|-------------|---------|
| `GET /health` | inline | Health check — returns version and timestamp |
| `/api/connection` | connection.routes.js | Test, connect, disconnect, status |
| `/api/schema` | schema.routes.js | Full schema, compact AI schema |
| `/api/query` | query.routes.js | Validate, execute, explain |

### 8.2 Connection Service (`src/services/connection.service.js`)

The Connection Service is a **singleton** that manages active database connections per user session.

**Design Pattern: Registry / Session Map**

```javascript
// Internal structure
sessions = Map {
  "session-uuid-1" → PostgresConnector instance,
  "session-uuid-2" → SQLiteConnector instance,
}
```

**Key Methods:**

| Method | Description |
|--------|-------------|
| `testConnection(dbType, config)` | Creates a temp connector, tests, and destroys it. Never saves to the Map |
| `connect(sessionId, dbType, config)` | Creates + connects a connector; saves it to the Map |
| `disconnect(sessionId)` | Closes the connector and removes it from the Map |
| `getConnector(sessionId)` | Returns the active connector or throws a clear error |
| `isConnected(sessionId)` | Returns true/false |
| `getDbType(sessionId)` | Returns the database type string (e.g., "postgresql") |

**Why a singleton?** The backend is a single Node.js process. Using a module-level singleton ensures only one Connection Service instance exists across all requests. This is appropriate for a single-user tool.

### 8.3 Error Middleware (`src/middleware/error.middleware.js`)

All unhandled errors flow to the global error handler. It:

1. Logs the error to the console (server side only)
2. **Redacts** anything that looks like a password or API key from the log
3. Returns a structured JSON response to the client
4. Never exposes stack traces, internal paths, or credentials

```
{ error: "User-friendly message", code: "ERROR_CODE" }
```

---

## 9. Database Connectors

### 9.1 Base Connector Design

All three connectors extend `BaseConnector`, which defines the interface every connector must implement:

```javascript
class BaseConnector {
  async connect()          // Open connection
  async disconnect()       // Close connection
  async testConnection()   // Probe without persisting
  async getSchema()        // Extract table/column metadata
  async executeQuery(sql)  // Run a validated query
  async explainQuery(sql)  // Get query plan
  isConnected()            // Boolean status
  safeConfig()             // Config without password field
}
```

This design means the rest of the backend code — Connection Service, routes — only talks to `BaseConnector`. Swapping PostgreSQL for a new database only requires adding one new connector file.

### 9.2 PostgreSQL Connector

**Library:** `pg` (node-postgres)  
**Connection Strategy:** Connection Pool (max 5 connections)

**Schema extraction queries used:**

```sql
-- 1. Get all tables in the public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. Get columns + primary key detection
SELECT c.column_name, c.data_type, c.is_nullable, c.column_default,
       CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
FROM information_schema.columns c
LEFT JOIN ( ... PRIMARY KEY constraint query ... ) pk ON c.column_name = pk.column_name
WHERE c.table_name = $1 AND c.table_schema = 'public';

-- 3. Get foreign keys
SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ...
JOIN information_schema.constraint_column_usage ccu ...
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;

-- 4. Fast row count estimate (uses planner stats, not full scan)
SELECT reltuples::bigint AS row_count FROM pg_class WHERE relname = $1;

-- 5. EXPLAIN plan
EXPLAIN (FORMAT JSON, ANALYZE false, VERBOSE false) <sql>;
```

**Timeout:** Set per-connection using `SET statement_timeout = <ms>` before each query.

**Error Normalization:** PostgreSQL error codes mapped to human-readable messages:

| Error Code | User Message |
|-----------|-------------|
| `ECONNREFUSED` | Cannot reach the PostgreSQL server. Check the host and port. |
| `28P01` | Incorrect username or password. |
| `3D000` | Database does not exist. |
| `42501` | Permission denied. |
| `ETIMEDOUT` | Connection timed out. |

### 9.3 MySQL Connector

**Library:** `mysql2/promise`  
**Connection Strategy:** Connection Pool (max 5 connections)

**Schema extraction uses `information_schema`:**

```sql
-- Tables
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE';

-- Columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?;

-- Foreign Keys
SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Row count estimate
SELECT TABLE_ROWS FROM information_schema.TABLES
WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?;

-- EXPLAIN plan
EXPLAIN FORMAT=JSON <sql>;
```

**Timeout:** `SET SESSION max_execution_time = <ms>` per connection.

### 9.4 SQLite Connector

**Library:** `better-sqlite3`  
**Connection Strategy:** Single file connection (synchronous API)

**Key Design Decision:** SQLite connector always opens in `readonly: true` mode. This enforces read-only access at the driver level, not just at the SQL validation layer. It is a second independent safety guarantee.

```javascript
this.db = new BetterSQLite(filename, {
  readonly: true,   // File-level read-only enforcement
  timeout: 10_000,
});
```

**Schema extraction uses SQLite PRAGMAs:**

```sql
-- Tables
SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';

-- Columns + PK detection
PRAGMA table_info("<tableName>");

-- Foreign keys
PRAGMA foreign_key_list("<tableName>");

-- Row count (exact, not estimated)
SELECT COUNT(*) AS n FROM "<tableName>";

-- EXPLAIN plan
EXPLAIN QUERY PLAN <sql>;
```

**Note:** `better-sqlite3` is synchronous, but all connector methods are declared `async` to maintain a uniform interface with the other connectors. Synchronous code inside an `async` function is valid JavaScript.

### 9.5 Schema Output Format

All three connectors return schema in the same format:

```json
{
  "customers": {
    "columns": [
      { "name": "id",         "type": "integer", "isPrimaryKey": true,  "nullable": false, "foreignKey": null     },
      { "name": "name",       "type": "varchar", "isPrimaryKey": false, "nullable": false, "foreignKey": null     },
      { "name": "country",    "type": "varchar", "isPrimaryKey": false, "nullable": true,  "foreignKey": null     }
    ],
    "estimatedRowCount": 1200
  },
  "orders": {
    "columns": [
      { "name": "id",          "type": "integer", "isPrimaryKey": true,  "nullable": false, "foreignKey": null                                       },
      { "name": "customer_id", "type": "integer", "isPrimaryKey": false, "nullable": false, "foreignKey": { "referencesTable": "customers", "referencesColumn": "id" } },
      { "name": "amount",      "type": "decimal", "isPrimaryKey": false, "nullable": true,  "foreignKey": null                                       },
      { "name": "order_date",  "type": "date",    "isPrimaryKey": false, "nullable": true,  "foreignKey": null                                       }
    ],
    "estimatedRowCount": 48291
  }
}
```

### 9.6 Compact Schema for AI (Week 2 Preparation)

The `/api/schema/compact` endpoint converts the JSON schema into a compact text format for injection into the Gemini prompt:

```
Database Type: postgresql

Table: customers (~1,200 rows)
  id INTEGER PRIMARY KEY
  name VARCHAR NOT NULL
  country VARCHAR

Table: orders (~48,291 rows)
  id INTEGER PRIMARY KEY
  customer_id INTEGER NOT NULL → customers.id
  amount DECIMAL
  order_date DATE
```

This format is designed to be token-efficient while giving the AI everything it needs to generate correct SQL.

---

## 10. Security Layer Design

### 10.1 Security Philosophy

> **The AI model's prompt restrictions are NOT the security boundary. The backend validator IS.**

Even if the AI is instructed "only generate SELECT queries," a malicious or malfunctioning AI response could still produce destructive SQL. The backend validator operates completely independently of the AI and cannot be bypassed by any prompt.

### 10.2 SQL Validator Implementation

**File:** `apps/backend/src/security/sql-validator.js`

The validator performs five checks in order:

```
Input SQL
    │
    ├── Check 1: Is it a string? Is it non-empty?
    │                              No → Reject
    │
    ├── Check 2: Does it contain SQL comments? (-- or /*)
    │                              Yes → Reject
    │         (Comments are used in injection bypass techniques)
    │
    ├── Check 3: Multiple statements? (semicolons)
    │                              Yes → Reject
    │
    ├── Check 4: Does it start with SELECT or WITH?
    │                              No → Reject
    │
    ├── Check 5: Does it contain any blocked keyword?
    │                              Yes → Reject
    │
    └── All checks pass → Return { valid: true, sanitizedSql }
```

**Blocked Keywords:**

```
INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE,
GRANT, REVOKE, REPLACE, MERGE, UPSERT, EXECUTE, EXEC,
CALL, LOAD, COPY, IMPORT, ATTACH, DETACH
```

**Word Boundary Matching:** Keywords are matched using `\bKEYWORD\b` regex. This prevents false positives on column names like `inserted_at` or `customer_id`.

### 10.3 Defence in Depth

SQLSensei uses multiple independent security layers:

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| AI Prompt | "Only generate SELECT" instruction | Accidental destructive generation |
| Backend Validator | Keyword + statement analysis | Any non-SELECT query |
| SQLite Connector | `readonly: true` flag | Any write at driver level |
| PostgreSQL/MySQL | `SET statement_timeout` | Long-running / DoS queries |
| Rate Limiter | 200 req/15 min | Brute-force and abuse |
| Row Limit | `LIMIT 1000` appended | Memory exhaustion from large results |

### 10.4 What Cannot Be Exploited

| Attack Vector | Protection |
|--------------|------------|
| `DELETE FROM users` | Blocked by validator (DELETE keyword) |
| `SELECT 1; DROP TABLE users` | Blocked by multi-statement check |
| `SELECT * FROM users -- WHERE id = 1` | Blocked by comment check |
| `SELECT * FROM users WHERE id = 0 UNION INSERT ...` | Blocked by INSERT keyword check |
| `ATTACH DATABASE '/etc/passwd' AS evil` | Blocked by ATTACH keyword (SQLite) |
| Giant result sets | Row limit (default 1,000 rows) |
| Long-running queries | Query timeout (default 30 seconds) |

---

## 11. REST API Design

### 11.1 Base URL

```
Development : http://localhost:3001
Production  : Configurable via FRONTEND_URL env var
```

### 11.2 Authentication / Session

All API requests must include the session header:

```
X-Session-ID: <uuid v4>
```

The frontend generates a UUID on first visit and stores it in `localStorage`. All subsequent requests use the same ID. This links API calls to a specific database connection on the backend.

### 11.3 Connection Endpoints

#### `POST /api/connection/test`
Test a connection without persisting it.

**Request:**
```json
{
  "dbType": "postgresql",
  "config": {
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "user": "admin",
    "password": "secret",
    "ssl": false
  }
}
```

**Response (success):**
```json
{
  "success": true,
  "version": "PostgreSQL 15.3 on x86_64-pc-linux-gnu",
  "dbType": "postgresql"
}
```

**Response (failure):**
```json
{
  "error": "Incorrect username or password.",
  "code": "28P01"
}
```

#### `POST /api/connection/connect`
Open a persistent connection for the session.

**Request:** Same as `/test`

**Response:**
```json
{ "success": true, "dbType": "postgresql" }
```

#### `POST /api/connection/disconnect`
Close the session's connection.

**Response:**
```json
{ "success": true, "message": "Disconnected." }
```

#### `GET /api/connection/status`
Check if the session has an active connection.

**Response:**
```json
{ "connected": true, "dbType": "mysql" }
```

### 11.4 Schema Endpoints

#### `GET /api/schema`
Return full schema object for all tables.

**Response:**
```json
{
  "schema": {
    "customers": {
      "columns": [...],
      "estimatedRowCount": 1200
    }
  },
  "dbType": "postgresql"
}
```

#### `GET /api/schema/compact`
Return schema as compact text for AI context.

**Response:**
```json
{
  "compactSchema": "Database Type: postgresql\n\nTable: customers (~1,200 rows)\n  id INTEGER PRIMARY KEY\n...",
  "dbType": "postgresql"
}
```

### 11.5 Query Endpoints

#### `POST /api/query/validate`
Check SQL safety without executing.

**Request:**
```json
{ "sql": "SELECT * FROM users" }
```

**Response (valid):**
```json
{ "valid": true, "sanitizedSql": "SELECT * FROM users" }
```

**Response (invalid):**
```json
{ "valid": false, "reason": "Query contains a disallowed operation: DELETE." }
```

#### `POST /api/query/execute`
Validate and execute a SQL query.

**Request:**
```json
{ "sql": "SELECT country, COUNT(*) AS total FROM customers GROUP BY country" }
```

**Response:**
```json
{
  "columns": ["country", "total"],
  "rows": [
    { "country": "USA", "total": 450 },
    { "country": "UK",  "total": 310 }
  ],
  "rowCount": 2,
  "executionTimeMs": 12
}
```

#### `POST /api/query/explain`
Get the query execution plan.

**Request:**
```json
{ "sql": "SELECT * FROM orders WHERE customer_id = 5" }
```

**Response (PostgreSQL):**
```json
{
  "plan": [ { "Plan": { "Node Type": "Index Scan", "Index Name": "orders_customer_id_idx", ... } } ],
  "dbType": "postgresql"
}
```

### 11.6 Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE_STRING"
}
```

HTTP status codes used:

| Status | When |
|--------|------|
| 200 | Success |
| 400 | Validation error, blocked SQL, missing fields |
| 429 | Rate limit exceeded |
| 500 | Server error (never exposes internal details) |

---

## 12. Project File Structure

### 12.1 Backend (`apps/backend`)

| File | Purpose |
|------|---------|
| `src/index.js` | Express app, middleware, and route registration |
| `src/connectors/base.connector.js` | Abstract interface for all connectors |
| `src/connectors/postgres.connector.js` | PostgreSQL implementation using `pg` |
| `src/connectors/mysql.connector.js` | MySQL implementation using `mysql2` |
| `src/connectors/sqlite.connector.js` | SQLite implementation using `better-sqlite3` |
| `src/services/connection.service.js` | Session-based connection registry (singleton) |
| `src/routes/connection.routes.js` | `/api/connection/*` route handlers |
| `src/routes/schema.routes.js` | `/api/schema/*` route handlers |
| `src/routes/query.routes.js` | `/api/query/*` route handlers |
| `src/security/sql-validator.js` | SQL safety validation (critical security component) |
| `src/middleware/error.middleware.js` | Global error handler — sanitizes output |
| `tests/global-setup.js` | Creates SQLite test database before tests |
| `tests/global-teardown.js` | Deletes SQLite test database after tests |
| `tests/sql-validator.test.js` | Unit tests for all validation rules |
| `tests/sqlite.connector.test.js` | Integration tests for SQLite connector |

### 12.2 Frontend (`apps/frontend`)

| File | Purpose |
|------|---------|
| `src/app/layout.jsx` | Root HTML layout with metadata |
| `src/app/page.jsx` | Main application page (three-panel layout) |
| `src/app/globals.css` | Tailwind imports + custom CSS variables |
| `src/components/ConnectionPanel.jsx` | Database connection form (left sidebar) |
| `src/components/SchemaViewer.jsx` | Schema tree browser (left sidebar) |
| `src/components/StatusBar.jsx` | Bottom status bar (connection status, row count) |
| `src/lib/api.js` | All backend API calls centralized |
| `src/lib/session.js` | UUID session ID management via localStorage |
| `tailwind.config.js` | Custom color tokens and font families |

### 12.3 Desktop (`apps/desktop`)

| File | Purpose |
|------|---------|
| `electron/main.js` | Electron main process — creates the browser window |
| `electron/preload.js` | Secure context bridge — exposes safe APIs to renderer |
| `package.json` | Electron + electron-builder config |

---

## 13. Setup & Installation Guide

### 13.1 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| pnpm | 8.x | `npm install -g pnpm@8` |
| Git | any | [git-scm.com](https://git-scm.com) |

Optional (for testing database connectors locally):
- PostgreSQL 15+ running on `localhost:5432`
- MySQL 8.0+ running on `localhost:3306`

### 13.2 First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/sqlsensei-dev/sqlsensei.git
cd sqlsensei

# 2. Install all dependencies (backend + frontend + desktop)
pnpm install

# 3. Configure backend environment
cd apps/backend
cp .env.example .env
# Edit .env if needed (defaults work for local development)
cd ../..
```

### 13.3 Running in Development

**Option A — Run everything at once:**
```bash
pnpm dev
```
This runs backend (port 3001) and frontend (port 3000) in parallel.

**Option B — Run individually:**
```bash
# Terminal 1
pnpm dev:backend
# → Server: http://localhost:3001

# Terminal 2
pnpm dev:frontend
# → App: http://localhost:3000

# Terminal 3 (optional desktop)
pnpm dev:desktop
# → Opens Electron window loading http://localhost:3000
```

### 13.4 Environment Variables

**`apps/backend/.env`**

```bash
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Query Safety Limits
MAX_QUERY_ROWS=1000        # Max rows returned per query
QUERY_TIMEOUT_MS=30000     # Query timeout in milliseconds

# Week 2 — Add when ready
# GEMINI_API_KEY=your_key_here

# App DB (local SQLite for query history)
APP_DB_PATH=./data/app.db
```

**`apps/frontend/.env.local`**

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 13.5 Running Tests

```bash
# Run all tests across all packages
pnpm test

# Run backend tests only
cd apps/backend && pnpm test

# Run tests with coverage report
cd apps/backend && pnpm test:coverage
```

### 13.6 Verifying the Setup

After starting, verify the backend is healthy:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-09-01T10:00:00.000Z"
}
```

---

## 14. Testing Plan & Results

### 14.1 Test Strategy

Week 1 testing focuses on two areas:
1. **SQL Validator unit tests** — Test every validation rule with both valid and invalid inputs
2. **SQLite connector integration tests** — Test real schema extraction and query execution

PostgreSQL and MySQL connector tests are configured for CI where real database services run as Docker containers.

### 14.2 SQL Validator Test Cases

**File:** `tests/sql-validator.test.js`

| Category | Test Case | Expected |
|----------|-----------|---------|
| Valid | `SELECT * FROM users` | ✅ Pass |
| Valid | `SELECT id, name FROM customers WHERE country = "USA"` | ✅ Pass |
| Valid | `SELECT ... INNER JOIN ... GROUP BY ...` | ✅ Pass |
| Valid | `WITH ranked AS (...) SELECT * FROM ranked WHERE rn <= 10` | ✅ Pass |
| Blocked | `DELETE FROM users` | ❌ Rejected |
| Blocked | `DROP TABLE users` | ❌ Rejected |
| Blocked | `UPDATE users SET name = 'x'` | ❌ Rejected |
| Blocked | `INSERT INTO users VALUES (...)` | ❌ Rejected |
| Blocked | `ALTER TABLE users ADD COLUMN x TEXT` | ❌ Rejected |
| Blocked | `TRUNCATE TABLE users` | ❌ Rejected |
| Blocked | `CREATE TABLE evil (id INT)` | ❌ Rejected |
| Blocked | `GRANT ALL ON users TO hacker` | ❌ Rejected |
| Injection | `SELECT * FROM users; DROP TABLE users` | ❌ Rejected |
| Injection | `SELECT * FROM users -- WHERE 1=1` | ❌ Rejected |
| Injection | `SELECT * FROM users /* bypass */` | ❌ Rejected |
| Edge | Empty string | ❌ Rejected |
| Edge | `null` input | ❌ Rejected |
| Edge | Numeric input | ❌ Rejected |
| Edge | `SHOW TABLES` | ❌ Rejected |

**Total: 19 test cases — all must pass before deployment.**

### 14.3 SQLite Connector Test Cases

**File:** `tests/sqlite.connector.test.js`

The test database (`tests/test.db`) is created by `global-setup.js` with:
- `customers` table (3 rows: Alice, Bob, Carol)
- `orders` table (4 rows linked via `customer_id`)
- Foreign key: `orders.customer_id → customers.id`

| Category | Test Case | Expected |
|----------|-----------|---------|
| Connection | Connect to test.db | Success |
| Connection | Disconnect | `isConnected()` returns false |
| Connection | `testConnection()` on `:memory:` | Returns SQLite version string |
| Schema | Detect both tables | `customers` and `orders` in schema |
| Schema | Extract columns from `customers` | `id`, `name`, `country` detected |
| Schema | Identify primary key | `customers.id` → `isPrimaryKey: true` |
| Schema | Detect foreign key | `orders.customer_id` → `{ referencesTable: "customers" }` |
| Schema | Row count accuracy | customers: 3, orders: 4 |
| Query | Simple SELECT | Returns 3 columns, 3 rows |
| Query | LIMIT enforcement | `maxRows: 1` returns 1 row |
| Query | Execution time | `executionTimeMs >= 0` |
| Query | JOIN query | Returns `name` and `amount` columns, 4 rows |
| Query | GROUP BY aggregation | Returns `customer_id` and `total` columns |

**Total: 13 test cases**

### 14.4 Test Setup Mechanism

```javascript
// tests/global-setup.js — runs ONCE before all tests
module.exports = async () => {
  const db = new BetterSQLite('tests/test.db'); // writable for setup
  db.exec(`
    CREATE TABLE customers ( id INTEGER PRIMARY KEY AUTOINCREMENT, ... );
    CREATE TABLE orders    ( id INTEGER PRIMARY KEY AUTOINCREMENT, ... );
    INSERT INTO customers ...;
    INSERT INTO orders ...;
  `);
  db.close();
  process.env.TEST_SQLITE_DB = 'tests/test.db';
};

// tests/global-teardown.js — runs ONCE after all tests
module.exports = async () => {
  fs.unlinkSync('tests/test.db');
};
```

The actual tests use the **read-only** SQLiteConnector against this pre-built database.

### 14.5 Running Tests

```bash
cd apps/backend
pnpm test

# Expected output:
# PASS tests/sql-validator.test.js (19 tests)
# PASS tests/sqlite.connector.test.js (13 tests)
# Tests: 32 passed, 0 failed
```

---

## 15. Week 1 Deliverables Checklist

### Project Setup

- [x] pnpm monorepo initialized with workspace configuration
- [x] Three packages: `backend`, `frontend`, `desktop`
- [x] Root scripts: `pnpm dev`, `pnpm test`, `pnpm build`
- [x] `.gitignore` configured (ignores node_modules, .env, *.db, builds)
- [x] `README.md` with setup instructions
- [x] Prettier configuration for consistent code formatting

### CI/CD

- [x] GitHub Actions workflow created (`.github/workflows/ci.yml`)
- [x] CI runs on push to `main`/`develop` and on pull requests
- [x] PostgreSQL 15 service container configured for tests
- [x] MySQL 8.0 service container configured for tests
- [x] `pnpm install --frozen-lockfile` used (ensures consistent installs)
- [x] Frontend build step included in CI
- [x] `pnpm audit` security check included

### Database Connectors

- [x] `BaseConnector` abstract class defined
- [x] PostgreSQL connector (`pg` library, connection pool)
- [x] MySQL connector (`mysql2/promise`, connection pool)
- [x] SQLite connector (`better-sqlite3`, always read-only)
- [x] All connectors implement: `connect`, `disconnect`, `testConnection`, `getSchema`, `executeQuery`, `explainQuery`
- [x] Error normalization (no raw error codes to client)
- [x] Row limit enforcement in all connectors
- [x] Query timeout support

### Schema Extraction

- [x] Table names detected (all three databases)
- [x] Column names and types detected
- [x] Primary keys detected
- [x] Foreign key relationships detected
- [x] Estimated row counts included
- [x] Compact schema format for AI context (Week 2 ready)

### Security

- [x] SQL Validator implemented (server-side, independent of AI)
- [x] SELECT/WITH whitelist enforced
- [x] All destructive keywords blocked
- [x] Multi-statement injection blocked
- [x] SQL comment injection blocked
- [x] SQLite opened in read-only mode at driver level
- [x] Rate limiter applied to all API endpoints
- [x] Passwords never returned in API responses
- [x] Error messages sanitized (no credentials in logs)

### REST API

- [x] `POST /api/connection/test`
- [x] `POST /api/connection/connect`
- [x] `POST /api/connection/disconnect`
- [x] `GET /api/connection/status`
- [x] `GET /api/schema`
- [x] `GET /api/schema/compact`
- [x] `POST /api/query/validate`
- [x] `POST /api/query/execute`
- [x] `POST /api/query/explain`
- [x] Global error handler

### Frontend (Next.js)

- [x] Next.js 14 initialized with App Router
- [x] Tailwind CSS configured with custom design tokens
- [x] Custom color palette (navy + cyan — distinct from generic templates)
- [x] Google Fonts: Inter (UI) + JetBrains Mono (code)
- [x] Three-panel IDE-style layout
- [x] `ConnectionPanel` component (database form, test + connect buttons)
- [x] `SchemaViewer` component (table and column tree)
- [x] `StatusBar` component (connection indicator, row count)
- [x] Session ID management via localStorage
- [x] Centralized API client (`src/lib/api.js`)

### Desktop (Electron)

- [x] Electron 28 initialized
- [x] Loads `http://localhost:3000` in development
- [x] Loads static Next.js export in production
- [x] `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
- [x] Secure `preload.js` with minimal `contextBridge` exposure
- [x] External links open in system browser (not Electron)
- [x] Custom application menu
- [x] `electron-builder` configured for Windows, macOS, and Linux builds

### Testing

- [x] Jest configured with `globalSetup` and `globalTeardown`
- [x] SQLite test database created programmatically (no manual setup needed)
- [x] 19 SQL Validator test cases
- [x] 13 SQLite connector integration test cases
- [x] CI environment variables configured for PostgreSQL + MySQL tests

---

## 16. Challenges & Solutions

### Challenge 1: SQLite Read-Only + Schema Setup in Tests

**Problem:** The SQLite connector is always opened in `readonly: true` mode (a security requirement). However, test setup needs to create tables and insert data.

**Solution:** The `global-setup.js` file uses a separate, writable `BetterSQLite` connection to create and populate the test database file. The actual connector tests then use the read-only connector against the pre-built file. The writable connection is only used for test setup and is never part of the production code path.

### Challenge 2: Uniform Async Interface with Synchronous Driver

**Problem:** `better-sqlite3` is a synchronous library (by design — for performance). All other connectors use `async/await`. Mixing sync and async code breaks the uniform interface.

**Solution:** All SQLite connector methods are declared `async` even though they call synchronous `better-sqlite3` methods internally. In JavaScript, a synchronous function inside an `async` function is perfectly valid. The caller can `await` it and it behaves correctly. The return value is automatically wrapped in a resolved Promise.

### Challenge 3: False Positives in SQL Keyword Detection

**Problem:** Simple substring matching for blocked keywords would cause false positives. For example, a column named `inserted_at` or `customer_id` would incorrectly match "INSERT" or "DELETE" in "deleted_at".

**Solution:** All keyword matching uses `\b` word boundary anchors in regex: `new RegExp(\`\\b${keyword}\\b\`, 'i')`. This ensures `DELETE` matches the word "DELETE" but not "deleted_at" or "undelete".

### Challenge 4: Session Management Without Authentication

**Problem:** The backend needs to associate API requests with the correct database connection. Traditional session management uses cookies or JWT tokens, but Week 1 is a single-user tool without authentication.

**Solution:** The frontend generates a UUID v4 on first visit using `crypto.randomUUID()` and stores it in `localStorage`. Every API request includes this UUID in the `X-Session-ID` header. The backend uses this as a key in the connection Map. This is simple, secure for a single-user tool, and can be replaced with proper JWT authentication later.

### Challenge 5: Error Message Safety

**Problem:** Raw database errors often contain connection details, server paths, or internal information that should never reach the client.

**Solution:** Every connector implements a `_normalise(err)` method that maps known error codes to user-friendly messages. The global error middleware additionally scrubs log output of password patterns. If an error code is unknown, a generic safe message is returned ("Database connection failed") — never the raw error string.

---

## 17. Week 2 Preview

Week 2 focuses on integrating the Gemini AI API to convert natural language questions into SQL.

### What will be built in Week 2:

1. **Gemini API Integration**
   - Configure `@google/generative-ai` SDK on the backend
   - API key stored securely in `.env` — never exposed to frontend

2. **Prompt Engineering**
   - Design a system prompt that instructs Gemini to:
     - Use only supplied schema tables and columns
     - Generate read-only SQL
     - Respect database-specific syntax
     - Return structured output only
   - Inject compact schema text from `/api/schema/compact`

3. **New API Endpoint:** `POST /api/ai/generate`
   - Accepts: `{ question: "Show total sales by month for 2024" }`
   - Calls Gemini with schema + question
   - Passes returned SQL through `SQLValidator`
   - Returns: `{ sql, validationResult }`

4. **Frontend — Natural Language Input**
   - Text area for entering the question
   - "Generate SQL" button
   - SQL viewer (read-only code display)
   - "Execute" button

5. **Error Handling**
   - Gemini API unavailable
   - Gemini returns invalid SQL
   - Generated SQL fails validator
   - SQL references non-existent table/column

### Week 2 requires:

- A **Gemini API key** (free tier available at [ai.google.dev](https://ai.google.dev))
- The Week 1 backend and database connectors (completed ✅)

---

*End of Week 1 Documentation*

---

**Document Information**

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Created | September 2025 |
| Authors | sqlsensei-dev |
| Project | SQLSensei — 5th Semester Project |
| Status | Final — Week 1 Complete |

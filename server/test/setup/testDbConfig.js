/**
 * Shared connection info for the dedicated test database, used by both
 * `globalSetup.js` (creates/schemas it once per test run) and `testEnv.js`
 * (points each test file's `AppService` at it). Kept in one place so the two
 * can never disagree on what database they mean.
 *
 * Host/port/user/password come from the developer's own `server/.env` -
 * reused as-is since it's already pointed at a real local Postgres (see
 * docker-compose.yml). Only the database name is overridden, so tests never
 * touch real dev/demo data. In CI, these are just real environment variables
 * set before Node starts (see .github/workflows/test.yml) - dotenv.config()
 * never overrides a variable that's already set, so this still resolves
 * correctly there without reading any .env file at all.
 */
const dotenv = require("dotenv");
const path = require("path");

function getTestDbConfig() {
    dotenv.config({path: path.join(__dirname, "..", "..", ".env")});

    return {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.TEST_DB_NAME || "vaultisse_test",
    };
}

module.exports = {getTestDbConfig};

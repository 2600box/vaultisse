/**
 * Runs once before the whole test run (Jest `globalSetup`, a separate
 * process from any test file): drops and recreates the dedicated test
 * database from scratch, then loads the real schema (including its seed
 * data - languages, formats, i18n labels) from `assets/db/databaseSchema.sql`,
 * the same file a fresh production deploy runs.
 *
 * A full drop+recreate per run (rather than truncating tables) keeps this
 * immune to schema drift between runs and matches how a fresh install
 * actually gets its database - if this ever stops working, so would a new
 * deployment.
 */
const {Client} = require("pg");
const fs = require("fs");
const path = require("path");
const {getTestDbConfig} = require("./testDbConfig");

module.exports = async function globalSetup() {
    const config = getTestDbConfig();

    const admin = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: "postgres",
    });
    await admin.connect();

    // In case a previous run's server process didn't shut down cleanly and
    // left connections open - DROP DATABASE fails while any exist.
    await admin.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
        [config.database]
    );
    await admin.query(`DROP DATABASE IF EXISTS "${config.database}"`);
    await admin.query(`CREATE DATABASE "${config.database}"`);
    await admin.end();

    const schemaPath = path.join(__dirname, "..", "..", "..", "assets", "db", "databaseSchema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    const db = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
    });
    await db.connect();
    await db.query(schemaSql);
    await db.end();
};

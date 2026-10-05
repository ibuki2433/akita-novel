import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";

// Source must be the latest backup from the live instance, not merely an old Git copy.
const sourcePath = path.resolve(process.env.MIGRATION_SOURCE || "data/novel.db");
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN privately first");
if (!fs.existsSync(sourcePath)) throw new Error("Member database backup not found");
const backupDirectory = process.env.MIGRATION_WORK_DIR || path.resolve(".test-work", "migration-backups");
fs.mkdirSync(backupDirectory, { recursive: true });
const snapshotPath = path.join(backupDirectory, `novel-${Date.now()}.db`);
const source = new Database(sourcePath, { readonly: true });
await source.backup(snapshotPath);
source.close();
const snapshot = new Database(snapshotPath, { readonly: true });
snapshot.defaultSafeIntegers(true);
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const tables = ["users", "user_bookmarks", "user_reading_history"];
let transaction;
try {
  transaction = await client.transaction("write");
  for (const table of tables) {
    const schema = snapshot.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
    if (!schema) throw new Error(`Missing source table: ${table}`);
    await transaction.execute(schema.sql.replace(/^CREATE TABLE /i, "CREATE TABLE IF NOT EXISTS "));
    const count = await transaction.execute(`SELECT COUNT(*) AS total FROM "${table}"`);
    if (Number(count.rows[0].total) !== 0) throw new Error("Destination already contains member data; refusing to overwrite it");
  }
  for (const table of tables) {
    const columns = snapshot.prepare(`PRAGMA table_info("${table}")`).all().map(column => column.name);
    const sql = `INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
    const rows = snapshot.prepare(`SELECT * FROM "${table}"`).all();
    for (let offset = 0; offset < rows.length; offset += 100) {
      await transaction.batch(rows.slice(offset, offset + 100).map(row => ({ sql, args: columns.map(column => row[column]) })));
    }
    const verified = await transaction.execute(`SELECT COUNT(*) AS total FROM "${table}"`);
    if (Number(verified.rows[0].total) !== rows.length) throw new Error("Migration row count mismatch");
    console.log(`${table}: ${rows.length} records verified`);
  }
  await transaction.commit();
  console.log("Migration committed. Source database was preserved. Keep the private snapshot backup.");
} catch (error) {
  if (transaction && !transaction.closed) await transaction.rollback();
  throw error;
} finally {
  transaction?.close(); client.close(); snapshot.close();
}

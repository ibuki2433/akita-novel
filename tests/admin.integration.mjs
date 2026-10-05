import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const root = process.cwd();
const testRoot = process.env.TEST_WORK_DIR || path.join(root, ".test-work");
fs.mkdirSync(testRoot, { recursive: true });
const dataDir = fs.mkdtempSync(path.join(testRoot, "admin-"));
const socket = net.createServer();
await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://localhost:${port}`;
const initialPassword = "Test-admin-initial-572!";
const env = { ...process.env, DATA_DIR: dataDir, ADMIN_PASSWORD: initialPassword, ADMIN_USERNAME: "Ibuki", ADMIN_EMAIL: "admin@example.test", NODE_ENV: "production", TURSO_DATABASE_URL: process.env.TEST_USE_LIBSQL ? `file:${path.join(dataDir, "novel.db").replaceAll("\\", "/")}` : "", TURSO_AUTH_TOKEN: process.env.TEST_USE_LIBSQL ? "test-only" : "", RENDER: "", JWT_SECRET: "" };
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
server.stdout.on("data", chunk => { logs += chunk; });
server.stderr.on("data", chunk => { logs += chunk; });
let db;
async function request(url, { cookie, method = "GET", body } = {}) {
  return fetch(base + url, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json", Origin: base } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: "manual" });
}
async function login(identifier, password) {
  const response = await request("/api/auth/login", { method: "POST", body: { identifier, password } });
  assert.equal(response.status, 200, await response.clone().text());
  return response.headers.get("set-cookie").split(";")[0];
}
try {
  for (let count = 0; count < 100; count++) {
    try { if ((await request("/login")).status === 200) break; } catch {}
    if (count === 99) throw new Error(`Test server did not start: ${logs}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal((await request("/api/admin/users")).status, 401);
  assert.equal((await request("/admin")).status, 307);
  const adminCookie = await login("Ibuki", initialPassword);
  const registered = await request("/api/auth/register", { method: "POST", body: { username: "reader-test", email: "reader@example.test", password: "Reader-password-123!", displayName: "นักอ่านทดสอบ", role: "admin" } });
  assert.equal(registered.status, 200);
  assert.equal((await registered.clone().json()).user.role, "reader");
  const readerCookie = registered.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/admin/users", { cookie: readerCookie })).status, 403);
  assert.match(await (await request("/admin", { cookie: readerCookie })).text(), /ไม่มีสิทธิ์เข้าถึง/);
  const forged = jwt.sign({ id: 1, role: "admin" }, "novel-reader-secret-key-akita-2026-safe");
  assert.equal((await request("/api/admin/users", { cookie: `novel_auth_token=${forged}` })).status, 401);
  let response = await request("/api/admin/users?q=reader", { cookie: adminCookie });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  let result = await response.json();
  assert.equal(result.total, 1);
  assert.equal(result.users[0].email, "reader@example.test");
  assert.ok(!JSON.stringify(result).includes("password"));
  db = new Database(path.join(dataDir, "novel.db"));
  const hash = await bcrypt.hash("Unused-fixture-password", 4);
  for (let index = 0; index < 27; index++) db.prepare("INSERT INTO users (username, email, display_name, password_hash) VALUES (?, ?, ?, ?)").run(`fixture-${index}`, `fixture-${index}@example.test`, `สมาชิก ${index}`, hash);
  response = await request("/api/admin/users", { cookie: adminCookie });
  result = await response.json();
  assert.equal(result.total, 29); assert.equal(result.users.length, 25);
  result = await (await request("/api/admin/users?page=2", { cookie: adminCookie })).json();
  assert.equal(result.users.length, 4);
  result = await (await request("/api/admin/users?q=%25", { cookie: adminCookie })).json();
  assert.equal(result.total, 0);
  result = await (await request("/api/admin/users?q=%27%20OR%201%3D1--", { cookie: adminCookie })).json();
  assert.equal(result.total, 0);
  // A legacy default password must never unlock member information.
  db.prepare("UPDATE users SET password_hash = ? WHERE username = 'Ibuki'").run(await bcrypt.hash("2003", 4));
  const legacyCookie = await login("Ibuki", "2003");
  response = await request("/api/admin/users", { cookie: legacyCookie });
  assert.equal(response.status, 403); assert.equal((await response.json()).code, "CHANGE_PASSWORD");
  response = await request("/api/admin/password", { cookie: legacyCookie, method: "POST", body: { currentPassword: "2003", newPassword: "A-new-secure-password-942!" } });
  assert.equal(response.status, 200, await response.clone().text());
  const newCookie = response.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/admin/users", { cookie: legacyCookie })).status, 401);
  assert.equal((await request("/api/admin/users", { cookie: newCookie })).status, 200);
  assert.equal((await request("/api/admin/password", { cookie: readerCookie, method: "POST", body: { currentPassword: "x", newPassword: "A-new-secure-password-942!" } })).status, 403);
  const migrationEnv = { ...process.env, MIGRATION_SOURCE: path.join(dataDir, "novel.db"), MIGRATION_WORK_DIR: path.join(dataDir, "backups"), TURSO_DATABASE_URL: `file:${path.join(dataDir, "migrated.db").replaceAll("\\", "/")}`, TURSO_AUTH_TOKEN: "test-only" };
  let migration = spawnSync(process.execPath, ["scripts/migrate-members.mjs"], { cwd: root, env: migrationEnv, encoding: "utf8" });
  assert.equal(migration.status, 0, migration.stderr);
  const migrated = new Database(path.join(dataDir, "migrated.db"), { readonly: true });
  assert.equal(migrated.prepare("SELECT COUNT(*) AS total FROM users").get().total, 29);
  assert.deepEqual(migrated.prepare("SELECT id, password_hash FROM users ORDER BY id").all(), db.prepare("SELECT id, password_hash FROM users ORDER BY id").all());
  migration = spawnSync(process.execPath, ["scripts/migrate-members.mjs"], { cwd: root, env: migrationEnv, encoding: "utf8" });
  assert.notEqual(migration.status, 0);
  assert.match(migration.stderr, /refusing to overwrite/);
  assert.equal(migrated.prepare("SELECT COUNT(*) AS total FROM users").get().total, 29);
  migrated.close();
  console.log("PASS: admin access, reader denial, forged tokens, safe fields, search, pagination and password rotation");
  console.log("PASS: database migration preserves IDs and password hashes; nonempty destination rejected");
} finally {
  db?.close();
  server.kill();
  await new Promise(resolve => server.once("exit", resolve));
  // Keep isolated test data out of the real member database.
  console.log(`Isolated test database: ${dataDir}`);
}

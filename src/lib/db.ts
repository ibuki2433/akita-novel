import { AppDatabase } from "./database-adapter";
import bcrypt from "bcryptjs";

let databasePromise: Promise<AppDatabase> | null = null;

export function getDatabase(): Promise<AppDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = new AppDatabase();
      await initTables(db);
      return db;
    })().catch(error => { databasePromise = null; throw error; });
  }
  return databasePromise;
}

async function initTables(db: AppDatabase) {
  // 1. Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'reader',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS user_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_slug TEXT NOT NULL,
      volume_id TEXT NOT NULL,
      scroll_y INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, volume_id)
    );

    CREATE TABLE IF NOT EXISTS user_reading_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_slug TEXT NOT NULL,
      volume_id TEXT NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_history_user ON user_reading_history(user_id);
  `);

  await db.exec(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  // Seed only from private environment configuration; never reset existing passwords.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    if (adminPassword.length < 12 || Buffer.byteLength(adminPassword, "utf8") > 72) {
      throw new Error("ADMIN_PASSWORD must be 12 characters or longer and at most 72 UTF-8 bytes");
    }
    const username = process.env.ADMIN_USERNAME || "Ibuki";
    const exists = await db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)").get(username);
    if (!exists) {
      await db.prepare(`INSERT OR IGNORE INTO users (username, email, password_hash, display_name, role)
        VALUES (?, ?, ?, ?, 'admin')`).run(username, process.env.ADMIN_EMAIL || "admin@akita.local", await bcrypt.hash(adminPassword, 12), username);
    }
  }
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar: string;
  role: string;
  created_at: string;
  last_login_at?: string;
}

export interface UserSafe {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  role: string;
  createdAt: string;
}

export function toSafeUser(row: UserRow): UserSafe {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    avatar: row.avatar,
    role: row.role,
    createdAt: row.created_at,
  };
}

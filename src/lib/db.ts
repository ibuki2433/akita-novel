import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "novel.db");

// Singleton connection
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: Database.Database) {
  // 1. Users table
  db.exec(`
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

  // Ensure Admin account 'Ibuki' (password: 2003) exists
  try {
    const adminHash = "$2b$10$P6qZzznGENgvXBuNEy3J1u7ah.t7sQR4/iB0vqEczpeWfBNRq2tea";
    const existingAdmin = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'ibuki'").get() as { id: number } | undefined;
    if (!existingAdmin) {
      db.prepare(`
        INSERT INTO users (username, email, password_hash, display_name, role)
        VALUES ('Ibuki', 'ibuki@akita.com', ?, 'Ibuki (Admin)', 'admin')
      `).run(adminHash);
    } else {
      db.prepare(`
        UPDATE users 
        SET role = 'admin', password_hash = ?
        WHERE id = ?
      `).run(adminHash, existingAdmin.id);
    }
  } catch (seedErr) {
    console.error("Admin seed error:", seedErr);
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

import Database from "better-sqlite3";
import { createClient, type Client, type InValue } from "@libsql/client";
import fs from "fs";
import path from "path";

export type SqlValue = InValue;
export class AppDatabase {
  private local?: Database.Database;
  private remote?: Client;
  constructor() {
    if (process.env.TURSO_DATABASE_URL) {
      if (!process.env.TURSO_AUTH_TOKEN) throw new Error("TURSO_AUTH_TOKEN is required");
      this.remote = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    } else {
      if (process.env.RENDER) throw new Error("Configure Turso before using member accounts on Render");
      const directory = process.env.DATA_DIR || path.join(process.cwd(), "data");
      fs.mkdirSync(directory, { recursive: true });
      this.local = new Database(path.join(directory, "novel.db"));
      this.local.pragma("journal_mode = WAL");
      this.local.pragma("foreign_keys = ON");
    }
  }
  async exec(sql: string) {
    if (this.remote) await this.remote.executeMultiple(sql);
    else this.local!.exec(sql);
  }
  prepare(sql: string) {
    return {
      get: async (...args: SqlValue[]): Promise<unknown> => {
        if (this.remote) return (await this.remote.execute({ sql, args })).rows[0];
        return this.local!.prepare(sql).get(...args);
      },
      all: async (...args: SqlValue[]): Promise<unknown[]> => {
        if (this.remote) return (await this.remote.execute({ sql, args })).rows;
        return this.local!.prepare(sql).all(...args);
      },
      run: async (...args: SqlValue[]) => {
        if (this.remote) {
          const result = await this.remote.execute({ sql, args });
          return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid ?? 0n };
        }
        return this.local!.prepare(sql).run(...args);
      },
    };
  }
}

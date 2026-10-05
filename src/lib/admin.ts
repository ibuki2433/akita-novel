import bcrypt from "bcryptjs";
import { getDatabase } from "./db";

export async function needsAdminPasswordChange(id: number) {
  const db = await getDatabase();
  const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(id) as { password_hash: string } | undefined;
  return !row || await bcrypt.compare("2003", row.password_hash);
}

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDatabase, UserRow, UserSafe, toSafeUser } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "novel-reader-secret-key-akita-2026-safe";
const TOKEN_COOKIE = "novel_auth_token";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: UserSafe): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getSessionUser(): UserSafe | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.id) return null;

    const db = getDatabase();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id) as UserRow | undefined;
    if (!user) return null;

    return toSafeUser(user);
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

export { TOKEN_COOKIE };

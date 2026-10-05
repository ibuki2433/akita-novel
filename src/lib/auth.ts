import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { getDatabase, UserRow, UserSafe, toSafeUser } from "./db";

async function getJwtSecret(): Promise<string> {
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
    return process.env.JWT_SECRET;
  }
  const db = await getDatabase();
  await db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('jwt_secret', ?)").run(randomBytes(48).toString("hex"));
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = 'jwt_secret'").get() as { value: string };
  return row.value;
}

function passwordVersion(hash: string): string {
  return createHash("sha256").update(hash).digest("hex");
}
const TOKEN_COOKIE = "novel_auth_token";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: UserSafe): Promise<string> {
  const db = await getDatabase();
  const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      passwordVersion: passwordVersion(row.password_hash),
    },
    await getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export async function verifyToken(token: string): Promise<jwt.JwtPayload | null> {
  try {
    const result = jwt.verify(token, await getJwtSecret(), { algorithms: ["HS256"] });
    return typeof result === "string" ? null : result;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<UserSafe | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !Number.isSafeInteger(payload.id) || payload.id < 1) return null;

    const db = await getDatabase();
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id) as UserRow | undefined;
    if (!user) return null;
    if (payload.passwordVersion !== passwordVersion(user.password_hash)) return null;

    return toSafeUser(user);
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

export { TOKEN_COOKIE };

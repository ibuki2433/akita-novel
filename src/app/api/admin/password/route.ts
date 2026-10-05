import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken, getSessionUser, hashPassword, TOKEN_COOKIE } from "../../../../lib/auth";
import { getDatabase } from "../../../../lib/db";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  try {
    const { currentPassword, newPassword } = await request.json();
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 12 || Buffer.byteLength(newPassword, "utf8") > 72 || newPassword === currentPassword) {
      return NextResponse.json({ error: "รหัสใหม่ต้องยาวอย่างน้อย 12 ตัวอักษร ไม่เกิน 72 ไบต์ และต่างจากรหัสเดิม" }, { status: 400 });
    }
    const db = await getDatabase();
    const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (!await comparePassword(currentPassword, row.password_hash)) return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
    const changed = await db.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?").run(await hashPassword(newPassword), user.id, row.password_hash);
    if (changed.changes !== 1) return NextResponse.json({ error: "บัญชีถูกเปลี่ยนระหว่างบันทึก กรุณาเข้าสู่ระบบใหม่" }, { status: 409 });
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(TOKEN_COOKIE, await generateToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
    return response;
  } catch (error) {
    console.error("Admin password change error", error);
    return NextResponse.json({ error: "เปลี่ยนรหัสผ่านไม่สำเร็จ" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { getDatabase } from "../../../../lib/db";
import { needsAdminPasswordChange } from "../../../../lib/admin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401, headers });
    if (user.role !== "admin") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403, headers });
    if (await needsAdminPasswordChange(user.id)) return NextResponse.json({ error: "กรุณาเปลี่ยนรหัสผ่านแอดมินก่อนดูข้อมูลสมาชิก", code: "CHANGE_PASSWORD" }, { status: 403, headers });
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Math.min(1000000, Number.parseInt(params.get("page") || "1", 10) || 1));
    const search = (params.get("q") || "").trim().slice(0, 100);
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    const where = search ? "WHERE username LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\'" : "";
    const args = search ? [pattern, pattern, pattern] : [];
    const db = await getDatabase();
    const count = await db.prepare(`SELECT COUNT(*) AS total FROM users ${where}`).get(...args) as { total: number };
    const users = await db.prepare(`SELECT id, username, email, display_name AS displayName, role, created_at AS createdAt, last_login_at AS lastLoginAt FROM users ${where} ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET ?`).all(...args, (page - 1) * 25);
    return NextResponse.json({ users, total: Number(count.total), page, pageSize: 25 }, { headers });
  } catch (error) {
    console.error("Admin members error", error);
    return NextResponse.json({ error: "โหลดรายชื่อสมาชิกไม่สำเร็จ กรุณาลองใหม่" }, { status: 500, headers });
  }
}

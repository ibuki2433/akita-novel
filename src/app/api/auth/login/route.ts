import { NextRequest, NextResponse } from "next/server";
import { getDatabase, toSafeUser, UserRow } from "../../../../lib/db";
import { comparePassword, generateToken, TOKEN_COOKIE } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const db = getDatabase();

    // Query user by username or email (case-insensitive)
    const user = db
      .prepare("SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?")
      .get(cleanIdentifier, cleanIdentifier) as UserRow | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" },
        { status: 401 }
      );
    }

    // Update last login
    db.prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

    const safeUser = toSafeUser(user);
    const token = generateToken(safeUser);

    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ!",
      user: safeUser,
    });

    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" },
      { status: 500 }
    );
  }
}

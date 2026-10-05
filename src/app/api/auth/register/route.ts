import { NextRequest, NextResponse } from "next/server";
import { getDatabase, toSafeUser, UserRow } from "../../../../lib/db";
import { hashPassword, generateToken, TOKEN_COOKIE } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, displayName } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อผู้ใช้, อีเมล, รหัสผ่าน)" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName?.trim() || username.trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check existing username
    const existingUsername = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(cleanUsername);
    if (existingUsername) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น" },
        { status: 409 }
      );
    }

    // Check existing email
    const existingEmail = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const insert = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, 'reader')
    `);
    const result = insert.run(cleanUsername, cleanEmail, passwordHash, cleanDisplayName);

    const newUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(result.lastInsertRowid) as UserRow;

    const safeUser = toSafeUser(newUser);
    const token = generateToken(safeUser);

    const response = NextResponse.json({
      success: true,
      message: "สมัครสมาชิกสำเร็จเรียบร้อยแล้ว!",
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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}

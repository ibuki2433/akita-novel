import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "../../../../lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "ออกจากระบบเรียบร้อยแล้ว",
  });

  response.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}

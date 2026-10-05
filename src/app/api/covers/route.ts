import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "../../../lib/auth";

const COVERS_FILE = path.join(process.cwd(), "data", "covers.json");
const COVERS_PUBLIC_DIR = path.join(process.cwd(), "public", "covers");

export async function GET() {
  try {
    if (fs.existsSync(COVERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(COVERS_FILE, "utf8"));
      return NextResponse.json(data);
    }
  } catch {}
  return NextResponse.json({ special: null, part1: null });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน (Admin: Ibuki) ก่อนเปลี่ยนรูปภาพปก" },
        { status: 401 }
      );
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "สิทธิ์ไม่เพียงพอ: เฉพาะแอดมิน Ibuki เท่านั้นที่สามารถเปลี่ยนรูปภาพปกได้" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const volume = (formData.get("volume") as string) || "special";
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพที่อัปโหลด" }, { status: 400 });
    }

    if (!fs.existsSync(COVERS_PUBLIC_DIR)) {
      fs.mkdirSync(COVERS_PUBLIC_DIR, { recursive: true });
    }

    // Determine extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const allowedExts = ["png", "jpg", "jpeg", "webp", "gif"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG, WEBP, GIF)" }, { status: 400 });
    }

    const fileName = `${volume}-cover-${Date.now()}.${ext}`;
    const filePath = path.join(COVERS_PUBLIC_DIR, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const coverUrl = `/covers/${fileName}`;

    // Update data/covers.json
    let covers: Record<string, string | null> = { special: null, part1: null };
    try {
      if (fs.existsSync(COVERS_FILE)) {
        covers = JSON.parse(fs.readFileSync(COVERS_FILE, "utf8"));
      }
    } catch {}

    covers[volume] = coverUrl;
    fs.writeFileSync(COVERS_FILE, JSON.stringify(covers, null, 2), "utf8");

    try {
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `อัปเดตรูปภาพปกของ ${volume === "special" ? "ภาคพิเศษ" : "ภาค 1"} สำเร็จแล้ว!`,
      coverUrl,
      volume,
    });
  } catch (error: any) {
    console.error("Cover upload error:", error);
    return NextResponse.json({ error: error?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "เฉพาะแอดมิน Ibuki เท่านั้นที่สามารถลบรูปปกได้" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const volume = searchParams.get("volume") || "special";

    let covers: Record<string, string | null> = { special: null, part1: null };
    try {
      if (fs.existsSync(COVERS_FILE)) {
        covers = JSON.parse(fs.readFileSync(COVERS_FILE, "utf8"));
      }
    } catch {}

    covers[volume] = null;
    fs.writeFileSync(COVERS_FILE, JSON.stringify(covers, null, 2), "utf8");

    try {
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `ลบรูปภาพปกของ ${volume === "special" ? "ภาคพิเศษ" : "ภาค 1"} เรียบร้อยแล้ว`,
      volume,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

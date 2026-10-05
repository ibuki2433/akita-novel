import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "../../../lib/auth";

const CHAPTERS_DIRECTORY = path.join(process.cwd(), "content", "chapters");

export async function POST(request: NextRequest) {
  try {
    // Authorization Check: Only Admin (Ibuki) can publish/upload chapters
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          error: "กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin: Ibuki) ก่อนจึงจะสามารถอัปเดตหรือเพิ่มตอนใหม่ได้",
          code: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    const isAdmin = currentUser.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "สิทธิ์ไม่เพียงพอ: บัญชีของคุณไม่ใช่ผู้ดูแลระบบ เฉพาะแอดมิน (Ibuki) เท่านั้นที่สามารถเพิ่มหรือแก้ไขตอนนิยายได้",
          code: "FORBIDDEN"
        },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    let volume = "part1";
    let order = 1;
    let title = "";
    let synopsis = "";
    let author = "อาคิตะ เวิลด์";
    let content = "";
    let customSlug = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      volume = (formData.get("volume") as string) || "part1";
      order = parseInt((formData.get("order") as string) || "1", 10);
      title = (formData.get("title") as string) || "";
      synopsis = (formData.get("synopsis") as string) || "";
      author = (formData.get("author") as string) || "อาคิตะ เวิลด์";
      customSlug = (formData.get("customSlug") as string) || "";

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        const text = await file.text();
        content = text;
      } else {
        content = (formData.get("content") as string) || "";
      }
    } else {
      const json = await request.json();
      volume = json.volume || "part1";
      order = Number(json.order) || 1;
      title = json.title || "";
      synopsis = json.synopsis || "";
      author = json.author || "อาคิตะ เวิลด์";
      content = json.content || "";
      customSlug = json.customSlug || "";
    }

    if (!title.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อตอน" }, { status: 400 });
    }
    if (!content.trim()) {
      return NextResponse.json({ error: "กรุณาใส่เนื้อหานิยาย หรืออัปโหลดไฟล์" }, { status: 400 });
    }

    // Determine slug
    let slug = customSlug.trim();
    if (!slug) {
      if (order === 0) {
        slug = `${volume}-prologue`;
      } else {
        slug = `${volume}-ch${String(order).padStart(2, "0")}`;
      }
    }

    // If already exists and not overwrite, make unique
    let filePath = path.join(CHAPTERS_DIRECTORY, `${slug}.md`);
    if (fs.existsSync(filePath) && !customSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
      filePath = path.join(CHAPTERS_DIRECTORY, `${slug}.md`);
    }

    const novelTitle =
      volume === "special"
        ? "อาคิตะ ภาคปฐมบทจตุรสงคราม"
        : "อาคิตะ ภาค 1: สงครามของผู้ใช้อาคิตะ";

    const today = new Date().toISOString().split("T")[0];

    // Check if content already contains frontmatter
    let fileBody = "";
    if (content.startsWith("---")) {
      fileBody = content;
    } else {
      fileBody = `---
volume: "${volume}"
order: ${order}
title: "${title.replace(/"/g, '\\"')}"
novelTitle: "${novelTitle}"
author: "${author.replace(/"/g, '\\"')}"
updatedAt: "${today}"
synopsis: "${synopsis.replace(/"/g, '\\"')}"
---

${content}
`;
    }

    if (!fs.existsSync(CHAPTERS_DIRECTORY)) {
      fs.mkdirSync(CHAPTERS_DIRECTORY, { recursive: true });
    }

    fs.writeFileSync(filePath, fileBody, "utf8");

    // Revalidate paths so Next.js renders the new chapter immediately
    try {
      revalidatePath("/");
      revalidatePath(`/chapter/${slug}`);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "อัปโหลดและเผยแพร่ตอนใหม่สำเร็จ!",
      slug,
      title,
      order,
      volume,
    });
  } catch (error: any) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการบันทึกตอนนิยาย" },
      { status: 500 }
    );
  }
}

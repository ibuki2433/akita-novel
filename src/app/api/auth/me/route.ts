import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function GET() {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const db = getDatabase();
  const bookmarks = db
    .prepare("SELECT * FROM user_bookmarks WHERE user_id = ? ORDER BY updated_at DESC")
    .all(user.id);

  const history = db
    .prepare("SELECT * FROM user_reading_history WHERE user_id = ? ORDER BY read_at DESC LIMIT 10")
    .all(user.id);

  return NextResponse.json({
    authenticated: true,
    user,
    bookmarks,
    history,
  });
}

// Update bookmark or record reading history
export async function POST(request: NextRequest) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { chapterSlug, volumeId, scrollY } = body;

    if (!chapterSlug || !volumeId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const db = getDatabase();

    // Upsert bookmark
    db.prepare(`
      INSERT INTO user_bookmarks (user_id, chapter_slug, volume_id, scroll_y, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, volume_id) DO UPDATE SET
        chapter_slug = excluded.chapter_slug,
        scroll_y = excluded.scroll_y,
        updated_at = CURRENT_TIMESTAMP
    `).run(user.id, chapterSlug, volumeId, scrollY || 0);

    // Record reading history
    db.prepare(`
      INSERT INTO user_reading_history (user_id, chapter_slug, volume_id)
      VALUES (?, ?, ?)
    `).run(user.id, chapterSlug, volumeId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save bookmark error:", error);
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}

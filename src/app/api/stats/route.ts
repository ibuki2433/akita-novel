import { NextRequest, NextResponse } from "next/server";
import { getStats, recordView } from "../../../lib/stats";

export async function GET(request: NextRequest) {
  const visitorId = request.nextUrl.searchParams.get("visitorId") || undefined;
  const stats = getStats(visitorId);
  return NextResponse.json(stats);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, volume, visitorId, action } = body;

    // Heartbeat ping only (to maintain active presence)
    if (action === "ping" || (!slug && visitorId)) {
      const stats = getStats(visitorId);
      return NextResponse.json({
        success: true,
        stats: {
          totalViews: stats.totalViews,
          activeReaders: stats.activeReaders,
          uniqueVisitors: stats.uniqueVisitors,
        },
      });
    }

    if (!slug) {
      return NextResponse.json({ error: "Missing chapter slug" }, { status: 400 });
    }

    const vol = volume === "special" ? "special" : "part1";
    const updated = recordView(slug, vol, visitorId);

    return NextResponse.json({
      success: true,
      stats: {
        totalViews: updated.totalViews,
        activeReaders: updated.activeReaders,
        uniqueVisitors: updated.uniqueVisitors,
        chapterViews: updated.chapters[slug]?.views || 1,
        volumeViews: updated.volumes[vol] || 1,
      },
    });
  } catch (error: any) {
    console.error("POST /api/stats error:", error);
    return NextResponse.json({ error: error?.message || "Failed to record view" }, { status: 500 });
  }
}

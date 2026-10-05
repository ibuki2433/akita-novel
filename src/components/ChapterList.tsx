"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, Clock, CheckCircle2, ChevronRight, BookMarked, Eye, Lock } from "lucide-react";
import { ChapterMeta } from "../types/novel";
import { useReader } from "../context/ReaderContext";
import { useAuth } from "../context/AuthContext";

export default function ChapterList({
  chapters,
  statsMap,
}: {
  chapters: ChapterMeta[];
  statsMap?: Record<string, { views: number }>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [liveStats, setLiveStats] = useState<Record<string, { views: number }>>(statsMap || {});
  const { readChapters, lastRead } = useReader();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.chapters) {
          setLiveStats(data.chapters);
        }
      })
      .catch(() => {});
  }, []);

  const filteredChapters = chapters
    .filter(
      (c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.synopsis && c.synopsis.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => (sortAsc ? a.order - b.order : b.order - a.order));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="ค้นหาตอน หรือคำสำคัญ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Sort button */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold hover:border-blue-500 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortAsc ? "เรียงจากตอนแรก -> ล่าสุด" : "เรียงจากล่าสุด -> ตอนแรก"}</span>
        </button>
      </div>

      {/* Unauthenticated Reader Notice */}
      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 text-xs shadow-sm">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-medium">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">บทนิยายเปิดให้อ่านสำหรับสมาชิก</p>
              <p className="text-[var(--text-muted)] text-xs">
                กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเข้าอ่าน เพื่อบันทึกประวัติและอ่านได้ครบทุกตอน
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Link
              href="/login"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl border border-blue-500/30 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/5 transition-all"
            >
              สมัครสมาชิกฟรี
            </Link>
          </div>
        </div>
      )}

      {/* Chapters list */}
      <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)] overflow-hidden shadow-sm">
        {filteredChapters.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)]">
            <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">ไม่พบบทนิยายที่ตรงกับคำค้นหา</p>
          </div>
        ) : (
          filteredChapters.map((chapter) => {
            const isRead = readChapters.includes(chapter.slug);
            const isCurrentLastRead = lastRead?.slug === chapter.slug;
            const chapterViews = liveStats[chapter.slug]?.views || 0;

            return (
              <Link
                key={chapter.slug}
                href={`/chapter/${chapter.slug}`}
                className="group block p-4 sm:p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {chapter.order === 0 ? "บทนำ" : `ตอนที่ ${chapter.order}`}
                      </span>
                      {!isAuthenticated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Lock className="w-3 h-3" />
                          สมาชิก
                        </span>
                      )}
                      {isCurrentLastRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          อ่านล่าสุด
                        </span>
                      )}
                      {isRead && !isCurrentLastRead && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          อ่านแล้ว
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {chapter.title}
                    </h3>
                    {chapter.synopsis && (
                      <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {chapter.synopsis}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Eye className="w-3 h-3" />
                        {chapterViews.toLocaleString()} วิว
                      </span>
                      {chapter.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {chapter.readTime}
                        </span>
                      )}
                      {chapter.updatedAt && <span>อัปเดต: {chapter.updatedAt}</span>}
                    </div>
                  </div>

                  <div className="pt-2 text-[var(--text-muted)] group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

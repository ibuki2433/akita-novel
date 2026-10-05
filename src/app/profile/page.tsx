"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Bookmark,
  Clock,
  LogOut,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

interface BookmarkItem {
  id: number;
  chapter_slug: string;
  volume_id: string;
  scroll_y: number;
  updated_at: string;
}

interface HistoryItem {
  id: number;
  chapter_slug: string;
  volume_id: string;
  read_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.bookmarks) setBookmarks(data.bookmarks);
          if (data.history) setHistory(data.history);
        })
        .catch(() => {});
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile Card Header */}
        <section className="p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/25">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black">{user.displayName}</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {user.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิกนักอ่าน"}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">@{user.username}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    สมาชิกตั้งแต่ {new Date(user.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </section>

        {/* Bookmarks Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold">ที่คั่นหนังสือและตอนที่อ่านค้างไว้ (Bookmarks)</h2>
          </div>

          {bookmarks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center text-xs text-[var(--text-muted)]">
              ยังไม่มีการบันทึกตอนที่อ่านค้างไว้ เมื่อคุณเปิดอ่านนิยาย ระบบจะจดจำให้อัตโนมัติ
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between gap-4 hover:border-blue-500/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 block w-fit">
                      {bm.volume_id === "special" ? "ภาคพิเศษ" : "ภาค 1"}
                    </span>
                    <h4 className="font-bold text-sm truncate">{bm.chapter_slug}</h4>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      อ่านค้างไว้เมื่อ: {new Date(bm.updated_at).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <Link
                    href={`/chapter/${bm.chapter_slug}`}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
                    title="อ่านต่อ"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reading History Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold">ประวัติการอ่านล่าสุด</h2>
          </div>

          {history.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center text-xs text-[var(--text-muted)]">
              ยังไม่มีประวัติการอ่าน
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)] overflow-hidden">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/chapter/${h.chapter_slug}`}
                  className="p-4 flex items-center justify-between text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-semibold block">{h.chapter_slug}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {h.volume_id === "special" ? "ภาคพิเศษ: ปฐมบทจตุรสงคราม" : "ภาค 1"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(h.read_at).toLocaleDateString("th-TH")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

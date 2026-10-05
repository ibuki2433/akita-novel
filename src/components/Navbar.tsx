"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Moon, Sun, Coffee, PenSquare, Eye, User, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { useReader, Theme } from "../context/ReaderContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { theme, setTheme } = useReader();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [activeReaders, setActiveReaders] = useState<number>(0);

  // Real-time tracking starting from 0: send visitor heartbeat & fetch live stats
  useEffect(() => {
    let visitorId = "";
    try {
      visitorId = localStorage.getItem("novel_visitor_id") || "";
      if (!visitorId) {
        visitorId = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now();
        localStorage.setItem("novel_visitor_id", visitorId);
      }
    } catch {}

    const pingAndFetch = () => {
      fetch(`/api/stats?visitorId=${encodeURIComponent(visitorId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.totalViews !== undefined) {
            setTotalViews(data.totalViews);
          }
          if (data.activeReaders !== undefined) {
            setActiveReaders(data.activeReaders);
          }
        })
        .catch(() => {});
    };

    pingAndFetch();
    const interval = setInterval(pingAndFetch, 10000); // Live heartbeat every 10s

    return () => clearInterval(interval);
  }, []);

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "สว่าง", icon: <Sun className="w-4 h-4" /> },
    { id: "dark", label: "มืด", icon: <Moon className="w-4 h-4" /> },
    { id: "sepia", label: "ถนอมสายตา", icon: <Coffee className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 border-[var(--border-color)] bg-[var(--bg-card)]/90">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight block leading-tight">
              จักรวาลอาคิตะ
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block">
              เว็บอ่านนิยาย • 2 ภาค
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Reader Counter Badge (เรียลเทียม) */}
          {totalViews !== null && (
            <div className="hidden md:flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20"
                title="จำนวนผู้อ่านที่กำลังออนไลน์อยู่ในขณะนี้"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{activeReaders} คนกำลังอ่าน</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20"
                title="จำนวนยอดการเข้าอ่านทั้งหมดแบบเรียลไทม์"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span>{totalViews.toLocaleString()} ยอดอ่าน</span>
              </div>
            </div>
          )}

          {/* Add New Chapter Button - ONLY visible to Admin (Ibuki) */}
          {!isLoading && isAuthenticated && (user?.role === "admin") && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/25 transition-all hover:scale-[1.02]"
              title="รายชื่อสมาชิกและจัดการเว็บ"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">จัดการเว็บ (Admin)</span>
              <span className="sm:hidden">แอดมิน</span>
            </Link>
          )}

          {/* User Auth Buttons or Profile Menu */}
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1 pl-2 sm:pr-3 rounded-xl border border-[var(--border-color)] hover:border-blue-500 bg-[var(--bg-primary)] transition-all group"
                  title="ดูโปรไฟล์และประวัติการอ่าน"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
                    {user.displayName}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-blue-500 text-xs font-semibold transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                  <Link
                    href="/register"
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>สมัคร</span>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Theme switcher */}
          <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/10 border border-[var(--border-color)]">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`เปลี่ยนเป็นธีม${t.label}`}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                  theme === t.id
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t.icon}
                <span className="hidden xl:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

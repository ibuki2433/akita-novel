"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Settings,
  Sun,
  Moon,
  Coffee,
  List,
  Type,
  AlignLeft,
  X,
  BookOpen,
  Layers,
} from "lucide-react";
import { useReader, Theme, FontFamily } from "../context/ReaderContext";
import { ChapterMeta } from "../types/novel";

interface ReaderToolbarProps {
  currentChapter: ChapterMeta;
  allChapters: ChapterMeta[];
}

export default function ReaderToolbar({ currentChapter, allChapters }: ReaderToolbarProps) {
  const {
    theme,
    setTheme,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
  } = useReader();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Group chapters by volume
  const part1Chapters = allChapters.filter((c) => c.volume === "part1");
  const specialChapters = allChapters.filter((c) => c.volume === "special");

  // Calculate reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "โหมดสว่าง", icon: <Sun className="w-4 h-4" /> },
    { id: "sepia", label: "ถนอมสายตา (Sepia)", icon: <Coffee className="w-4 h-4" /> },
    { id: "dark", label: "โหมดมืด", icon: <Moon className="w-4 h-4" /> },
  ];

  const fonts: { id: FontFamily; label: string }[] = [
    { id: "sarabun", label: "สารบรรณ (Sarabun)" },
    { id: "sans", label: "Sans-Serif" },
    { id: "serif", label: "Serif (คลาสสิก)" },
  ];

  const lineHeights: { id: "normal" | "relaxed" | "loose"; label: string }[] = [
    { id: "normal", label: "ปกติ" },
    { id: "relaxed", label: "สบายตา" },
    { id: "loose", label: "กว้าง" },
  ];

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Fixed Top Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-md transition-colors duration-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              title="กลับหน้ารายละเอียดนิยาย"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">หน้าแรก</span>
            </Link>

            <span className="text-[var(--border-color)] hidden sm:inline">|</span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white ${
                currentChapter.volume === "special" ? "bg-indigo-600" : "bg-blue-600"
              }`}
            >
              {currentChapter.volume === "special" ? "ภาคพิเศษ" : "ภาค 1"}
            </span>

            <span className="text-xs sm:text-sm font-semibold truncate">
              {currentChapter.title}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Chapter Drawer Trigger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="สารบัญตอนทั้งหมด"
            >
              <List className="w-5 h-5" />
            </button>

            {/* Quick Theme Switcher */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/10 border border-[var(--border-color)]">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  className={`p-1.5 rounded-md transition-all ${
                    theme === t.id
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t.icon}
                </button>
              ))}
            </div>

            {/* Reader Settings Toggle */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-xl transition-colors ${
                settingsOpen
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              title="การตั้งค่าการอ่าน (ขนาดตัวอักษร, ธีม, ฟอนต์)"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal / Dropdown */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:pr-8 pointer-events-none">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-xs pointer-events-auto"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-5 space-y-5 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm">การตั้งค่ามุมมองการอ่าน</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Font Size (A- / A+) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center justify-between">
                <span>ขนาดตัวอักษร</span>
                <span className="font-mono text-xs">{fontSize}px</span>
              </label>
              <div className="grid grid-cols-4 gap-2 items-center">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 14}
                  className="py-2 rounded-xl border border-[var(--border-color)] hover:border-blue-500 font-bold text-sm disabled:opacity-40 transition-colors"
                  title="ลดขนาดตัวอักษร"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize(18)}
                  className="py-2 rounded-xl border border-[var(--border-color)] hover:border-blue-500 text-xs font-medium transition-colors"
                >
                  รีเซ็ต
                </button>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= 32}
                  className="col-span-2 py-2 rounded-xl border border-[var(--border-color)] hover:border-blue-500 font-bold text-sm disabled:opacity-40 transition-colors"
                  title="เพิ่มขนาดตัวอักษร"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Themes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">ธีมสีพื้นหลัง</label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      theme === t.id
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                        : "border-[var(--border-color)] hover:border-blue-400 text-[var(--text-muted)]"
                    }`}
                  >
                    {t.icon}
                    <span>{t.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">รูปแบบฟอนต์</label>
              <div className="grid grid-cols-3 gap-2">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontFamily(f.id)}
                    className={`py-2 px-2 text-xs rounded-xl border transition-all text-center ${
                      fontFamily === f.id
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                        : "border-[var(--border-color)] hover:border-blue-400 text-[var(--text-muted)]"
                    }`}
                  >
                    {f.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">ระยะห่างบรรทัด</label>
              <div className="grid grid-cols-3 gap-2">
                {lineHeights.map((lh) => (
                  <button
                    key={lh.id}
                    onClick={() => setLineHeight(lh.id)}
                    className={`py-2 px-2 text-xs rounded-xl border transition-all text-center ${
                      lineHeight === lh.id
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                        : "border-[var(--border-color)] hover:border-blue-400 text-[var(--text-muted)]"
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapters Sidebar Drawer (Grouped by Volume) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-full max-w-xs sm:max-w-sm bg-[var(--bg-card)] border-r border-[var(--border-color)] h-full z-10 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">สารบัญตอนทั้งหมด</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Group 1: ภาคพิเศษ */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>ภาคพิเศษ: ปฐมบทจตุรสงคราม</span>
                </div>
                <div className="space-y-1">
                  {specialChapters.map((ch) => {
                    const isCurrent = ch.slug === currentChapter.slug;
                    return (
                      <Link
                        key={ch.slug}
                        href={`/chapter/${ch.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className={`block p-2.5 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
                            : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)]"
                        }`}
                      >
                        <span
                          className={`text-[10px] block mb-0.5 ${
                            isCurrent ? "text-indigo-100" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {ch.order === 0 ? "บทนำ" : `ตอนที่ ${ch.order}`}
                        </span>
                        <span className="text-xs sm:text-sm line-clamp-1">{ch.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: ภาค 1 */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>ภาค 1: สงครามของผู้ใช้อาคิตะ</span>
                </div>
                <div className="space-y-1">
                  {part1Chapters.map((ch) => {
                    const isCurrent = ch.slug === currentChapter.slug;
                    return (
                      <Link
                        key={ch.slug}
                        href={`/chapter/${ch.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className={`block p-2.5 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                            : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)]"
                        }`}
                      >
                        <span
                          className={`text-[10px] block mb-0.5 ${
                            isCurrent ? "text-blue-100" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {ch.order === 0 ? "บทนำ" : `ตอนที่ ${ch.order}`}
                        </span>
                        <span className="text-xs sm:text-sm line-clamp-1">{ch.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

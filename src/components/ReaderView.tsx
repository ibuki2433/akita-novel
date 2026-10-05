"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowUp,
  BookmarkCheck,
  Clock,
  Calendar,
  Eye,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { ChapterData, ChapterMeta } from "@/types/novel";
import { useReader } from "@/context/ReaderContext";
import { useAuth } from "@/context/AuthContext";
import ReaderToolbar from "./ReaderToolbar";

interface ReaderViewProps {
  chapter: ChapterData;
  allChapters: ChapterMeta[];
}

export default function ReaderView({ chapter, allChapters }: ReaderViewProps) {
  const { fontSize, fontFamily, lineHeight, saveLastRead, lastRead } = useReader();
  const { user, isAuthenticated, isLoading, saveBookmark } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasScrolledToResume, setHasScrolledToResume] = useState(false);
  const [chapterViews, setChapterViews] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isSpecial = chapter.volume === "special";
  const volumeLabel = isSpecial ? "ภาคพิเศษ: ปฐมบทจตุรสงคราม" : "ภาค 1: สงครามของผู้ใช้อาคิตะ";
  const otherVolumeSlug = isSpecial ? "part1-prologue" : "special-prologue";
  const otherVolumeTitle = isSpecial ? "ภาค 1: สงครามของผู้ใช้อาคิตะ" : "ภาคพิเศษ: ปฐมบทจตุรสงคราม";

  // Record real view on mount & get updated view counter
  useEffect(() => {
    let visitorId = "";
    try {
      visitorId = localStorage.getItem("novel_visitor_id") || "";
      if (!visitorId) {
        visitorId = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now();
        localStorage.setItem("novel_visitor_id", visitorId);
      }
    } catch {}

    if (isAuthenticated) {
      fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: chapter.slug,
          volume: chapter.volume,
          visitorId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.stats?.chapterViews !== undefined) {
            setChapterViews(data.stats.chapterViews);
          }
        })
        .catch(() => {});
    } else {
      fetch(`/api/stats?visitorId=${encodeURIComponent(visitorId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.chapters?.[chapter.slug]?.views !== undefined) {
            setChapterViews(data.chapters[chapter.slug].views);
          } else {
            setChapterViews(0);
          }
        })
        .catch(() => setChapterViews(0));
    }
  }, [isAuthenticated, chapter.slug, chapter.volume]);

  // Save last read info on mount & mark chapter as read (and sync with DB if logged in)
  useEffect(() => {
    if (!isAuthenticated) return;

    saveLastRead({
      slug: chapter.slug,
      title: chapter.title,
      order: chapter.order,
      updatedAt: chapter.updatedAt,
      scrollY: window.scrollY,
    });
    saveBookmark(chapter.volume, chapter.slug, window.scrollY);
    // Scroll to top on chapter change unless resuming
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [isAuthenticated, chapter.slug, chapter.volume]);

  // Track scroll position to update reading progress & toggle back-to-top button
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;

    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveLastRead({
          slug: chapter.slug,
          title: chapter.title,
          order: chapter.order,
          updatedAt: chapter.updatedAt,
          scrollY: window.scrollY,
        });
      }, 500);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, chapter, saveLastRead]);

  // Restore scroll position if previously reading this chapter
  useEffect(() => {
    if (
      isAuthenticated &&
      !hasScrolledToResume &&
      lastRead?.slug === chapter.slug &&
      lastRead.scrollY &&
      lastRead.scrollY > 150
    ) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: lastRead.scrollY, behavior: "smooth" });
        setHasScrolledToResume(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasScrolledToResume, lastRead, chapter.slug]);

  // Font family styles mapping
  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case "serif":
        return "font-serif";
      case "sans":
        return "font-sans";
      case "sarabun":
      default:
        return "font-sarabun";
    }
  };

  // Line height styles mapping
  const getLineHeightClass = () => {
    switch (lineHeight) {
      case "normal":
        return "leading-normal";
      case "loose":
        return "leading-loose";
      case "relaxed":
      default:
        return "leading-relaxed";
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${getFontFamilyClass()}`}>
        <ReaderToolbar currentChapter={chapter} allChapters={allChapters} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">
            กำลังตรวจสอบสิทธิ์การเข้าอ่าน...
          </p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${getFontFamilyClass()}`}>
        {/* Sticky Reader Toolbar */}
        <ReaderToolbar currentChapter={chapter} allChapters={allChapters} />

        {/* Main Chapter Content Container */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Chapter Header */}
          <header className="mb-8 pb-6 border-b border-[var(--border-color)] text-center space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs ${
                  isSpecial ? "bg-indigo-600" : "bg-blue-600"
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                {chapter.order === 0 ? "บทนำ" : `ตอนที่ ${chapter.order}`}
              </span>
              <Link
                href="/"
                className="text-xs text-[var(--text-muted)] hover:text-blue-600 transition-colors font-medium"
              >
                {volumeLabel}
              </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              {chapter.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-muted)] pt-2">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                <Eye className="w-3.5 h-3.5" />
                <span>{(chapterViews || 0).toLocaleString()} ยอดอ่าน</span>
              </span>
              {chapter.author && <span>ผู้แต่ง: {chapter.author}</span>}
              {chapter.updatedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {chapter.updatedAt}
                </span>
              )}
              {chapter.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {chapter.readTime}
                </span>
              )}
            </div>
          </header>

          {/* Teaser Preview with Blurred Gradient Fade */}
          <div className="relative mb-8 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
            <div className="space-y-3 opacity-60 select-none filter blur-[1.5px] pointer-events-none">
              <p className="text-base sm:text-lg leading-relaxed text-[var(--text-primary)]">
                {chapter.synopsis || "สายลมยามค่ำคืนพัดพาความหนาวเหน็บผ่านซอกอาคาร แสงจันทร์ส่องกระทบผิวน้ำสะท้อนเงาของพลังเวทที่กำลังปะทุขึ้นในความเงียบสงบ..."}
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-[var(--text-primary)]">
                พลังงานอาคิตะที่หลับใหลอยู่ภายในร่างเริ่มส่งเสียงสะท้อน ราวกับกำลังรอคอยช่วงเวลาแห่งการปะทะครั้งประวัติศาสตร์ที่ไม่เคยมีใครคาดคิดมาก่อน...
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-[var(--text-primary)]">
                "ถ้าหากเลือกที่จะก้าวเดินต่อไปในเส้นทางนี้... เจ้าก็ไม่อาจหันหลังกลับได้อีกแล้วนะ"
              </p>
            </div>

            {/* Gradient overlay on blur */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-card)]/70 to-[var(--bg-card)] flex flex-col items-center justify-end pb-4" />
          </div>

          {/* Auth Gate Locked Card */}
          <div className="relative overflow-hidden p-6 sm:p-10 rounded-3xl border-2 border-dashed border-blue-500/30 bg-gradient-to-b from-blue-500/5 via-[var(--bg-card)] to-[var(--bg-card)] shadow-2xl text-center space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Lock className="w-8 h-8" />
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                บทความนี้สำหรับสมาชิกเท่านั้น
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเข้าอ่าน
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                เพื่อเข้าอ่านเนื้อหาตอน «{chapter.title}» และบันทึกประวัติการอ่านของคุณ กรุณาเข้าสู่ระบบ หรือหากยังไม่มีบัญชีสามารถสมัครสมาชิกได้ฟรีทันที!
              </p>
            </div>

            {/* Value props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-[var(--text-primary)] font-medium">อ่านฟรีครบทุกตอน ทุกภาค</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-[var(--text-primary)] font-medium">บันทึกประวัติการอ่านอัตโนมัติ</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-[var(--text-primary)] font-medium">ไฮไลท์เสียงตัวละครสมบูรณ์แบบ</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/chapter/${chapter.slug}`)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบเพื่ออ่าน</span>
              </Link>
              <Link
                href={`/register?redirect=${encodeURIComponent(`/chapter/${chapter.slug}`)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-600/30 hover:border-blue-600 bg-white/50 dark:bg-black/20 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold text-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>สมัครสมาชิกฟรี</span>
              </Link>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-[var(--text-muted)] hover:text-blue-600 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>กลับสู่หน้าแรกนิยาย</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${getFontFamilyClass()}`}>
      {/* Sticky Reader Toolbar */}
      <ReaderToolbar currentChapter={chapter} allChapters={allChapters} />

      {/* Main Chapter Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Chapter Header */}
        <header className="mb-8 pb-6 border-b border-[var(--border-color)] text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs ${
                isSpecial ? "bg-indigo-600" : "bg-blue-600"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              {chapter.order === 0 ? "บทนำ" : `ตอนที่ ${chapter.order}`}
            </span>
            <Link
              href="/"
              className="text-xs text-[var(--text-muted)] hover:text-blue-600 transition-colors font-medium"
            >
              {volumeLabel}
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            {chapter.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-muted)] pt-2">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full">
              <Eye className="w-3.5 h-3.5" />
              <span>{(chapterViews || 0).toLocaleString()} ยอดอ่าน</span>
            </span>
            {chapter.author && <span>ผู้แต่ง: {chapter.author}</span>}
            {chapter.updatedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {chapter.updatedAt}
              </span>
            )}
            {chapter.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {chapter.readTime}
              </span>
            )}
          </div>
        </header>

        {/* Chapter Body with user chosen font size and line height */}
        <article
          ref={contentRef}
          className={`reader-body text-[var(--text-primary)] transition-all ${getLineHeightClass()}`}
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: chapter.contentHtml }}
        />

        {/* Chapter End Divider */}
        <div className="my-12 text-center text-sm text-[var(--text-muted)] flex items-center justify-center gap-4">
          <div className="h-px bg-[var(--border-color)] flex-1" />
          <span className="font-medium px-2">
            จบ{chapter.order === 0 ? "บทนำ" : `บทที่ ${chapter.order}`}
          </span>
          <div className="h-px bg-[var(--border-color)] flex-1" />
        </div>

        {/* Reader Navigation Footer */}
        <nav className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Previous Chapter */}
            {chapter.prevChapter ? (
              <Link
                href={`/chapter/${chapter.prevChapter.slug}`}
                className="flex items-center justify-start gap-3 p-3.5 rounded-xl border border-[var(--border-color)] hover:border-blue-500 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group"
              >
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <div className="text-left overflow-hidden">
                  <span className="text-xs text-[var(--text-muted)] block">ตอนก่อนหน้า</span>
                  <span className="text-sm font-semibold truncate block">
                    {chapter.prevChapter.title}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-start gap-3 p-3.5 rounded-xl border border-dashed border-[var(--border-color)] opacity-50 cursor-not-allowed">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs block">ตอนก่อนหน้า</span>
                  <span className="text-sm font-medium">นี่คือตอนแรกของภาคนี้</span>
                </div>
              </div>
            )}

            {/* Next Chapter */}
            {chapter.nextChapter ? (
              <Link
                href={`/chapter/${chapter.nextChapter.slug}`}
                className={`flex items-center justify-between sm:justify-end gap-3 p-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all group text-right ${
                  isSpecial
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                }`}
              >
                <div className="text-left sm:text-right overflow-hidden flex-1">
                  <span className="text-xs text-white/80 block">ตอนถัดไป</span>
                  <span className="text-sm font-semibold truncate block">
                    {chapter.nextChapter.title}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <Link
                href={`/chapter/${otherVolumeSlug}`}
                className="flex items-center justify-between sm:justify-end gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md transition-all group text-right"
              >
                <div className="text-left sm:text-right overflow-hidden flex-1">
                  <span className="text-xs text-emerald-100 block">จบบทสุดท้ายของภาคนี้แล้ว</span>
                  <span className="text-sm font-semibold truncate block">
                    คลิกเพื่ออ่าน {otherVolumeTitle}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white group-hover:text-emerald-700 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
              </Link>
            )}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-blue-600 font-medium transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าแรกและเลือกภาคทั้งหมด</span>
            </Link>
          </div>
        </nav>
      </main>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl text-[var(--text-primary)] hover:border-blue-500 hover:text-blue-600 transition-all z-30 group"
          title="เลื่อนกลับด้านบนสุด"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Play, Bookmark, ArrowRight } from "lucide-react";
import { useReader } from "@/context/ReaderContext";
import { ChapterMeta } from "@/types/novel";

export default function ResumeButton({
  chapters,
  themeColor = "blue",
}: {
  chapters: ChapterMeta[];
  themeColor?: "blue" | "indigo" | "purple" | "amber";
}) {
  const { lastRead } = useReader();

  const firstChapter = chapters[0];
  const matchingLastRead =
    lastRead && chapters.some((c) => c.slug === lastRead.slug)
      ? chapters.find((c) => c.slug === lastRead.slug)
      : null;

  if (!firstChapter) return null;

  const isResuming = Boolean(matchingLastRead);
  const targetChapter = matchingLastRead || firstChapter;

  const colorStyles = {
    blue: {
      bg: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25",
      banner: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
      accent: "bg-blue-600",
    },
    indigo: {
      bg: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25",
      banner: "bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400",
      accent: "bg-indigo-600",
    },
    purple: {
      bg: "bg-purple-600 hover:bg-purple-700 shadow-purple-600/25",
      banner: "bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400",
      accent: "bg-purple-600",
    },
    amber: {
      bg: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25",
      banner: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
      accent: "bg-amber-600",
    },
  }[themeColor] || {
    bg: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25",
    banner: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
    accent: "bg-blue-600",
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {isResuming ? (
        <div
          className={`w-full border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${colorStyles.banner}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${colorStyles.accent} text-white flex items-center justify-center shrink-0 shadow-sm`}
            >
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block">
                อ่านค้างไว้ล่าสุดในภาคนี้
              </span>
              <h4 className="font-bold text-sm sm:text-base line-clamp-1 text-[var(--text-primary)]">
                {targetChapter.title}
              </h4>
            </div>
          </div>
          <Link
            href={`/chapter/${targetChapter.slug}`}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl ${colorStyles.bg} text-white font-medium text-sm transition-all shadow-md shrink-0`}
          >
            <span>อ่านต่อทันที</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <Link
          href={`/chapter/${firstChapter.slug}`}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl ${colorStyles.bg} text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>เริ่มอ่าน {firstChapter.title}</span>
        </Link>
      )}
    </div>
  );
}

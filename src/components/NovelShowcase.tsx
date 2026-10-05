"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  User,
  Layers,
  Tag,
  CheckCircle,
  Eye,
  ChevronRight,
  PenSquare,
  Users,
  ShieldCheck,
  Upload,
  Trash2,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { VolumeInfo, ChapterMeta } from "../types/novel";
import { NovelStats } from "../lib/stats";
import { useAuth } from "../context/AuthContext";
import ResumeButton from "./ResumeButton";
import ChapterList from "./ChapterList";

interface NovelShowcaseProps {
  volumes: VolumeInfo[];
  allChapters: ChapterMeta[];
}

export default function NovelShowcase({ volumes, allChapters }: NovelShowcaseProps) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isAdmin = Boolean(
    !isAuthLoading &&
      isAuthenticated &&
      user &&
      (user.role === "admin" || user.username.toLowerCase() === "ibuki")
  );

  const [selectedVolumeId, setSelectedVolumeId] = useState<string>("special");
  const [stats, setStats] = useState<NovelStats | null>(null);
  const [customCovers, setCustomCovers] = useState<Record<string, string | null>>({
    special: null,
    part1: null,
  });
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverMessage, setCoverMessage] = useState<string | null>(null);

  // Fetch real statistics & covers with live polling
  useEffect(() => {
    let visitorId = "";
    try {
      visitorId = localStorage.getItem("novel_visitor_id") || "";
    } catch {}

    const fetchStats = () => {
      fetch(`/api/stats${visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : ""}`)
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
        })
        .catch(() => {});
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    fetch("/api/covers")
      .then((res) => res.json())
      .then((data) => {
        if (data) setCustomCovers(data);
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const handleCoverUpload = async (volumeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setCoverMessage(null);
    const formData = new FormData();
    formData.append("volume", volumeId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/covers", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.coverUrl) {
        setCustomCovers((prev) => ({ ...prev, [volumeId]: data.coverUrl }));
        setCoverMessage(`อัปเดตภาพปกของ ${volumeId === "special" ? "ภาคพิเศษ" : "ภาค 1"} สำเร็จ!`);
        setTimeout(() => setCoverMessage(null), 3000);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleRemoveCover = async (volumeId: string) => {
    if (!confirm(`คุณต้องการลบรูปภาพปกของ ${volumeId === "special" ? "ภาคพิเศษ" : "ภาค 1"} ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/covers?volume=${volumeId}`, { method: "DELETE" });
      if (res.ok) {
        setCustomCovers((prev) => ({ ...prev, [volumeId]: null }));
        setCoverMessage(`ลบรูปภาพปกเรียบร้อยแล้ว`);
        setTimeout(() => setCoverMessage(null), 3000);
      }
    } catch {}
  };

  const currentVolume = volumes.find((v) => v.id === selectedVolumeId) || volumes[0];
  const volumeChapters = allChapters.filter((c) => c.volume === currentVolume.id);
  const currentVolumeViews = stats?.volumes?.[currentVolume.id] || 0;

  const renderCover = (vol: VolumeInfo, isLarge: boolean = false) => {
    const activeCover = customCovers[vol.id] || vol.coverImage;

    if (activeCover) {
      return (
        <img
          src={activeCover}
          alt={vol.name}
          className="w-full h-full object-cover"
        />
      );
    }

    // Modern book cover placeholder (when image is removed)
    const isSpecial = vol.id === "special";
    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-3.5 sm:p-5 text-white relative overflow-hidden select-none ${
          isSpecial
            ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950"
            : "bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950"
        }`}
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between text-[10px] text-white/70 relative z-10">
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded backdrop-blur-xs font-bold uppercase tracking-wider">
            {vol.shortName}
          </span>
          <BookOpen className="w-3.5 h-3.5 opacity-60" />
        </div>

        <div className="my-auto text-center space-y-1.5 relative z-10">
          <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-blue-400 font-extrabold">
            AKITA UNIVERSE
          </div>
          <h3
            className={`font-black tracking-tight leading-snug drop-shadow ${
              isLarge ? "text-lg sm:text-xl md:text-2xl" : "text-xs sm:text-sm"
            }`}
          >
            {vol.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-white/70 line-clamp-1">
            {vol.subtitle}
          </p>
        </div>

        <div className="text-center pt-2 border-t border-white/10 relative z-10 flex items-center justify-between text-[9px] text-white/50">
          <span>{vol.author}</span>
          <span className="text-amber-400/80 font-medium">รออัปโหลดปก</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* 1. Volume Selector Tabs with Visual Previews */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight">เลือกภาคที่ต้องการอ่าน</h2>
          </div>
          {stats && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                <Users className="w-3.5 h-3.5" />
                {stats.uniqueVisitors.toLocaleString()} ผู้อ่าน
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {stats.totalViews.toLocaleString()} วิวรวม
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {volumes.map((vol) => {
            const isSelected = vol.id === currentVolume.id;
            const volChapterCount = allChapters.filter((c) => c.volume === vol.id).length;
            const volViews = stats?.volumes?.[vol.id] || 0;

            return (
              <button
                key={vol.id}
                onClick={() => setSelectedVolumeId(vol.id)}
                className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group flex items-center gap-4 ${
                  isSelected
                    ? vol.id === "special"
                      ? "border-indigo-600 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30"
                      : "border-blue-600 bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                    : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-blue-400/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                }`}
              >
                {/* Mini cover thumbnail */}
                <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0 border border-black/10 dark:border-white/10 shadow-md relative bg-slate-900 group-hover:scale-105 transition-transform duration-200">
                  {renderCover(vol, false)}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md z-20">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Volume Meta */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        vol.id === "special"
                          ? "bg-indigo-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {vol.badge}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {volChapterCount} ตอน
                    </span>
                    {volViews > 0 && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {volViews.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base sm:text-lg tracking-tight line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {vol.name}
                  </h3>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {vol.tagline}
                  </p>

                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1">
                    <span>{isSelected ? "กำลังเลือกอ่านภาคนี้" : "คลิกเพื่อสลับมาอ่านภาคนี้"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Selected Volume Hero Showcase */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-sm">
        {/* Glow ambient background */}
        <div
          className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
            currentVolume.id === "special" ? "bg-indigo-500" : "bg-blue-500"
          }`}
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Book Cover Illustration */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="w-60 sm:w-68 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 relative group hover:scale-[1.02] transition-transform duration-300 bg-slate-950">
              {renderCover(currentVolume, true)}

              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 drop-shadow z-20">
                <span className="font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs text-[10px]">
                  {currentVolume.shortName}
                </span>
                <span className="bg-indigo-600/90 px-2 py-0.5 rounded-md backdrop-blur-xs text-[10px] font-bold">
                  {currentVolume.themeColor === "indigo" ? "AKIRA & IRIS" : "ITSUKI"}
                </span>
              </div>
            </div>

            {/* Admin Cover Upload & Management Controls */}
            {isAdmin && (
              <div className="mt-4 w-full max-w-[270px] space-y-2">
                <label className="w-full cursor-pointer py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold text-center shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isUploadingCover
                      ? "กำลังอัปโหลด..."
                      : (customCovers[currentVolume.id] || currentVolume.coverImage)
                      ? "เปลี่ยนรูปภาพปก (Admin Ibuki)"
                      : "อัปโหลดภาพปก (Admin Ibuki)"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingCover}
                    onChange={(e) => handleCoverUpload(currentVolume.id, e)}
                  />
                </label>

                {(customCovers[currentVolume.id] || currentVolume.coverImage) && (
                  <button
                    onClick={() => handleRemoveCover(currentVolume.id)}
                    className="w-full py-1.5 px-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรูปภาพปกออก</span>
                  </button>
                )}

                {coverMessage && (
                  <p className="text-[11px] text-center text-emerald-500 font-semibold animate-fade-in">
                    ✓ {coverMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Volume Synopsis & Information */}
          <div className="md:col-span-8 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs ${
                    currentVolume.id === "part1" ? "bg-blue-600" : "bg-indigo-600"
                  }`}
                >
                  {currentVolume.badge}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/10 text-[var(--text-muted)]">
                  {currentVolume.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{(currentVolumeViews || 0).toLocaleString()} ยอดอ่านในภาคนี้</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                {currentVolume.name}
              </h1>

              <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {currentVolume.subtitle}
              </p>

              {/* Character Intro Card */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-[var(--text-primary)] block">
                    ตัวละครหลัก: {currentVolume.characterMain}
                  </span>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    {currentVolume.characterDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <Tag className="w-3.5 h-3.5 text-[var(--text-muted)] mr-1" />
              {currentVolume.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-lg text-xs bg-black/5 dark:bg-white/10 text-[var(--text-muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
              <h3 className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider">
                เรื่องย่อประจำภาค
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed opacity-90">
                {currentVolume.synopsis}
              </p>
            </div>

            {/* Action Buttons: Resume or Read First Chapter + Add Chapter Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <ResumeButton
                  chapters={volumeChapters}
                  themeColor={currentVolume.themeColor}
                />
              </div>

              {isAdmin && (
                <Link
                  href="/publish"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-sm transition-all shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>+ เพิ่มตอนใหม่ (Admin)</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Table of Contents for Current Volume */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                สารบัญ: {currentVolume.shortName}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                บทนำและรายชื่อตอนทั้งหมดของ {currentVolume.name} ({volumeChapters.length} ตอน)
              </p>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/publish"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>เขียนตอนเพิ่ม (Admin)</span>
            </Link>
          )}
        </div>

        <ChapterList chapters={volumeChapters} statsMap={stats?.chapters} />
      </section>
    </div>
  );
}

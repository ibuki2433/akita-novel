"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  PenTool,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Send,
  Palette,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  KeyRound,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

const CHARACTER_PALETTE = [
  { name: "อิสึกิ", color: "ฟ้า", cls: "speech-itsuki", sample: "อิสึกิ : \"...\"" },
  { name: "ยูโตะ", color: "ส้ม", cls: "speech-yuto", sample: "ยูโตะ : \"...\"" },
  { name: "ไอร่า", color: "เขียว", cls: "speech-aira", sample: "ไอร่า : \"...\"" },
  { name: "ฮิซากิ", color: "ทอง", cls: "speech-hisaki", sample: "ฮิซากิ : \"...\"" },
  { name: "อาคิระ", color: "ฟ้าอ่อน", cls: "speech-akira", sample: "อาคิระ : \"...\"" },
  { name: "อิซานา", color: "ฟ้า", cls: "speech-izana", sample: "อิซานา : \"...\"" },
  { name: "ซาเอกิ", color: "เขียวแก่", cls: "speech-saeki", sample: "ซาเอกิ : \"...\"" },
  { name: "คายะ", color: "แดง", cls: "speech-kaya", sample: "คายะ : \"...\"" },
  { name: "เซริ", color: "ม่วงเข้ม", cls: "speech-seri", sample: "เซริ : \"...\"" },
  { name: "คุโรยะ", color: "ฟ้า", cls: "speech-kuroya", sample: "คุโรยะ : \"...\"" },
  { name: "โทริ / ลุงโทริ", color: "น้ำเงิน", cls: "speech-tori", sample: "โทริ : \"...\"" },
  { name: "คานาเมะ", color: "แดงเลือดหมู", cls: "speech-kaname", sample: "คานาเมะ : \"...\"" },
  { name: "มิโคโตะ", color: "แดง", cls: "speech-mikoto", sample: "มิโคโตะ : \"...\"" },
  { name: "เซียงเจียว", color: "ทอง", cls: "speech-xiangjiao", sample: "เซียงเจียว : \"...\"" },
  { name: "หลิงโหว", color: "เขียวอ่อน", cls: "speech-linghou", sample: "หลิงโหว : \"...\"" },
  { name: "อาชิ", color: "ชมพู", cls: "speech-ashi", sample: "อาชิ : \"...\"" },
  { name: "อิบุกิ", color: "ม่วง", cls: "speech-ibuki", sample: "อิบุกิ : \"...\"" },
  { name: "ดรีม", color: "ฟ้าอมม่วงชวนฝัน", cls: "speech-dream", sample: "ดรีม : \"...\"" },
  { name: "ริโนะ", color: "ดำม่วง", cls: "speech-rino", sample: "ริโนะ : \"...\"" },
  { name: "ฮิโนะ", color: "เขียวมรกต", cls: "speech-hino", sample: "ฮิโนะ : \"...\"" },
  { name: "มิโอะ", color: "ม่วงดำ", cls: "speech-mio", sample: "มิโอะ : \"...\"" },
  { name: "แบล็คเคน", color: "แดง", cls: "speech-blackken", sample: "แบล็คเคน : \"...\"" },
  { name: "เก็นริว / เก็งริว", color: "ดำเทา", cls: "speech-genryu", sample: "เก็นริว : \"...\"" },
  { name: "ไอริส", color: "น้ำเงิน", cls: "speech-iris", sample: "ไอริส : \"...\"" },
  { name: "เซน่อน", color: "ฟ้าอมเขียว", cls: "speech-xenon", sample: "เซน่อน : \"...\"" },
  { name: "ยูรางิ", color: "ม่วง", cls: "speech-yuragi", sample: "ยูรางิ : \"...\"" },
];

export default function PublishPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login } = useAuth();

  const isAdmin = Boolean(
    isAuthenticated &&
      user &&
      (user.role === "admin" || user.username.toLowerCase() === "ibuki")
  );

  // Admin Login form states for locked view
  const [adminUsername, setAdminUsername] = useState("Ibuki");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError("");
    const res = await login(adminUsername.trim(), adminPassword);
    setAdminLoginLoading(false);
    if (!res.success) {
      setAdminLoginError(res.error || "ชื่อผู้ใช้หรือรหัสผ่านแอดมินไม่ถูกต้อง");
    }
  };

  const [volume, setVolume] = useState<"part1" | "special">("part1");
  const [order, setOrder] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [author, setAuthor] = useState("อาคิตะ เวิลด์");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showColorGuide, setShowColorGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
    slug?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload (.txt or .md)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      const cleanName = file.name.replace(/\.(md|txt)$/i, "");
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setContent(result);
        setStatusMessage({
          type: "success",
          text: `โหลดเนื้อหาจากไฟล์ "${file.name}" เรียบร้อยแล้ว`,
        });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "กรุณาระบุชื่อตอน" });
      return;
    }
    if (!content.trim()) {
      setStatusMessage({ type: "error", text: "กรุณาใส่เนื้อหานิยาย หรืออัปโหลดไฟล์" });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volume,
          order,
          title,
          synopsis,
          author,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเผยแพร่");
      }

      setStatusMessage({
        type: "success",
        text: "เผยแพร่ตอนใหม่สำเร็จเรียบร้อยแล้ว!",
        slug: data.slug,
      });

      setTimeout(() => {
        router.push(`/chapter/${data.slug}`);
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview renderer that matches character highlights
  const renderPreviewParagraph = (para: string, idx: number) => {
    const trimmed = para.trim();
    for (const char of CHARACTER_PALETTE) {
      const regex = new RegExp(`^(${char.name}\\s*[:：].*)$`, "i");
      if (regex.test(trimmed)) {
        return (
          <p key={idx} className="speech-wrap">
            <span className={`speech-bubble ${char.cls}`}>{trimmed}</span>
          </p>
        );
      }
    }
    return <p key={idx}>{trimmed}</p>;
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 160));

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-12 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">พื้นที่เฉพาะผู้ดูแลระบบ</h1>
            <p className="text-sm text-[var(--text-muted)]">
              ระบบอัปเดตและเผยแพร่ตอนใหม่ สงวนสิทธิ์เฉพาะบัญชีแอดมิน <strong className="text-purple-600 dark:text-purple-400">Ibuki</strong> เท่านั้น
            </p>
          </div>

          {isAuthenticated && user && !isAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs space-y-1">
              <p className="font-semibold">⚠️ บัญชีปัจจุบันของคุณ ({user.displayName || user.username}) ไม่มีสิทธิ์แอดมิน</p>
              <p>กรุณาลงชื่อเข้าใช้ด้วยบัญชีผู้ดูแลระบบด้านล่างเพื่อดำเนินการต่อ</p>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)] text-purple-600 dark:text-purple-400 font-bold text-sm">
              <KeyRound className="w-4 h-4" />
              <span>เข้าสู่ระบบแอดมิน (Admin Login)</span>
            </div>

            {adminLoginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                {adminLoginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-muted)]">
                  ชื่อผู้ใช้แอดมิน (Admin Username)
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  placeholder="Ibuki"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-muted)]">
                  รหัสผ่านแอดมิน (Password)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoginLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md shadow-purple-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {adminLoginLoading ? (
                  <span>กำลังตรวจสอบ...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>เข้าสู่ระบบเพื่อจัดการเนื้อหา</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าหลักสำหรับผู้อ่าน</span>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ระบบจัดการเนื้อหาสำหรับผู้ดูแลระบบ (Admin Studio)</span>
          </div>
        </div>

        {/* Admin Verified Banner */}
        <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>เข้าสู่ระบบในฐานะผู้ดูแลระบบ: <strong className="text-purple-700 dark:text-purple-200">Ibuki</strong></span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-200 text-[11px] font-bold">
            🛡️ Admin Verified
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            เขียน / อัปโหลดตอนนิยายใหม่
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            พิมพ์เนื้อหาลงในช่อง หรือลากไฟล์ .txt / .md มาวางเพื่อเผยแพร่ออนไลน์ได้ทันที
          </p>
        </div>

        {/* Character Color Guide Accordion */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowColorGuide(!showColorGuide)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-sm">
                🎨 ดูสีไฮไลท์บทพูดของตัวละคร (22 ตัวละคร)
              </span>
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                ระบบจะไฮไลท์ให้อัตโนมัติเมื่อขึ้นต้นด้วย ชื่อตัวละคร : "..."
              </span>
            </div>
            {showColorGuide ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </button>

          {showColorGuide && (
            <div className="p-4 pt-0 border-t border-[var(--border-color)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-3">
                {CHARACTER_PALETTE.map((char) => (
                  <div
                    key={char.name}
                    className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold">{char.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${char.cls}`}>
                      {char.color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            {statusMessage.slug && (
              <Link
                href={`/chapter/${statusMessage.slug}`}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                อ่านตอนนี้ทันที
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Volume & Order Selection */}
          <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>1. เลือกลงในภาคและลำดับตอน</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVolume("part1")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  volume === "part1"
                    ? "border-blue-600 bg-blue-500/10 ring-2 ring-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold"
                    : "border-[var(--border-color)] hover:border-blue-400 text-[var(--text-muted)]"
                }`}
              >
                <div className="text-xs font-bold uppercase">ภาคหลัก</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  ภาค 1: สงครามของผู้ใช้อาคิตะ
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">ตัวเอก: อิสึกิ</div>
              </button>

              <button
                type="button"
                onClick={() => setVolume("special")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  volume === "special"
                    ? "border-indigo-600 bg-indigo-500/10 ring-2 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "border-[var(--border-color)] hover:border-indigo-400 text-[var(--text-muted)]"
                }`}
              >
                <div className="text-xs font-bold uppercase">ภาคพิเศษ (Prequel)</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  ภาคพิเศษ: ปฐมบทจตุรสงคราม
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">ตัวเอก: อาคิระ & ไอริส</div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  ลำดับตอน (Order)
                </label>
                <input
                  type="number"
                  min="0"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm font-mono focus:ring-2 focus:ring-blue-500/40 outline-none"
                  placeholder="เช่น 1 หรือ 0 สำหรับบทนำ"
                />
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                  ใส่ 0 หากเป็นบทนำ หรือ 1, 2, 3 ตามลำดับตอน
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  ผู้แต่ง (Author)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-blue-500/40 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Chapter Title & Synopsis */}
          <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600" />
              <span>2. ชื่อตอนและคำโปรย</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                ชื่อตอน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ตอนที่ 1: ... หรือ บทที่ 1: ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm font-medium focus:ring-2 focus:ring-blue-500/40 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                คำโปรยเรื่องย่อประจำตอน (ไม่บังคับ)
              </label>
              <textarea
                rows={2}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="สรุปเหตุการณ์สำคัญสั้นๆ ประจำตอนนี้ เพื่อดึงดูดผู้อ่าน..."
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-blue-500/40 outline-none"
              />
            </div>
          </div>

          {/* 3. Content Editor & File Upload */}
          <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>3. เนื้อหานิยาย</span>
              </h3>

              {/* Upload File trigger button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>นำเข้าจากไฟล์ในคอม (.txt / .md)</span>
                </button>
              </div>
            </div>

            {/* Tab switch: Edit vs Live Preview */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    activeTab === "edit"
                      ? "bg-blue-600 text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  แก้ไขเนื้อหา
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    activeTab === "preview"
                      ? "bg-blue-600 text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูตัวอย่างการแสดงผล (มีไฮไลท์บทพูด)</span>
                </button>
              </div>

              <div className="text-[var(--text-muted)] flex items-center gap-3">
                <span>{wordCount} คำ</span>
                <span>• ประมาณ {estimatedMinutes} นาทีในการอ่าน</span>
              </div>
            </div>

            {activeTab === "edit" ? (
              <textarea
                required
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="วางเนื้อหานิยายของคุณที่นี่... สามารถแบ่งย่อหน้าด้วยการเว้นบรรทัด สำหรับบทพูดให้ขึ้นต้นด้วย ชื่อตัวละคร : &quot;...&quot; เพื่อให้ระบบใส่สีไฮไลท์ให้อัตโนมัติ"
                className="w-full p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] font-sarabun text-base leading-relaxed focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-[var(--text-muted)]"
              />
            ) : (
              <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] min-h-[300px] reader-body font-sarabun">
                {content.trim() ? (
                  content
                    .split(/\r?\n\r?\n/)
                    .map((para, i) => renderPreviewParagraph(para, i))
                ) : (
                  <p className="text-center text-[var(--text-muted)] italic py-10">
                    ยังไม่มีเนื้อหาให้พรีวิว กรุณาพิมพ์เนื้อหาในแท็บ "แก้ไขเนื้อหา"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/"
              className="px-5 py-3 rounded-xl border border-[var(--border-color)] text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกและเผยแพร่...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>🚀 เผยแพร่ตอนใหม่ทันที</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

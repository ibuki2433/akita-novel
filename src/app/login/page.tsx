"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("/");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("redirect");
      if (r && r.startsWith("/")) {
        setRedirectUrl(r);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await login(identifier, password);
    if (res.success) {
      router.push(redirectUrl);
      router.refresh();
    } else {
      setError(res.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าแรก</span>
          </Link>

          <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl space-y-6 relative overflow-hidden">
            {/* Ambient background blur */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

            <div className="space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
                <LogIn className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">เข้าสู่ระบบ</h1>
              <p className="text-xs text-[var(--text-muted)]">
                เข้าสู่ระบบเพื่อซิงค์ประวัติการอ่านและบุ๊กมาร์กข้ามอุปกรณ์
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  ชื่อผู้ใช้ หรือ อีเมล
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="เช่น user123 หรือ your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
              <span>ยังไม่มีบัญชีใช่ไหม? </span>
              <Link
                href={redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                สมัครสมาชิกที่นี่
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

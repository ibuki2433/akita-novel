import Link from "next/link";
import { BookX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
        <BookX className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold mb-2">ไม่พบตอนที่ระบุ</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-6">
        บทนิยายที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือยังไม่ได้ถูกนำมาวางในโฟลเดอร์ content/chapters
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20"
      >
        <Home className="w-4 h-4" />
        <span>กลับสู่หน้าแรก</span>
      </Link>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import AdminMembers from "../../components/AdminMembers";
import { getSessionUser } from "../../lib/auth";
import { needsAdminPasswordChange } from "../../lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=%2Fadmin");
  if (user.role !== "admin") return <><Navbar /><main className="max-w-5xl mx-auto p-6"><h1 className="text-2xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1><p className="my-4">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p><Link href="/" className="text-blue-600">กลับหน้าหลัก</Link></main></>;
  return <><Navbar /><main className="w-full max-w-5xl mx-auto px-4 py-8"><div className="flex flex-wrap items-center justify-between gap-4 mb-8"><div><h1 className="text-2xl font-bold">สมาชิกที่สมัคร</h1><p className="text-[var(--text-muted)] mt-2">ดูรายชื่อและข้อมูลการสมัครสมาชิก</p></div><Link href="/publish" className="rounded-xl bg-purple-600 text-white px-4 py-2">จัดการตอนนิยาย</Link></div><AdminMembers mustChangePassword={await needsAdminPasswordChange(user.id)} /></main></>;
}

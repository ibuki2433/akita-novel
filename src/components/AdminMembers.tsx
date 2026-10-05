"use client";

import { FormEvent, useEffect, useState } from "react";

type Member = { id: number; username: string; email: string; displayName: string; role: string; createdAt: string; lastLoginAt: string | null };
type MemberList = { users: Member[]; total: number; page: number; pageSize: number };
function date(value: string | null) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
}

export default function AdminMembers({ mustChangePassword }: { mustChangePassword: boolean }) {
  const [changeRequired, setChangeRequired] = useState(mustChangePassword);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<MemberList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (changeRequired) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&page=${page}`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok) {
          if (result.code === "CHANGE_PASSWORD") setChangeRequired(true);
          throw new Error(result.error || "โหลดรายชื่อไม่สำเร็จ");
        }
        if (!controller.signal.aborted) setData(result);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "เชื่อมต่อไม่สำเร็จ");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, page, reload, changeRequired]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPasswordError(""); setPasswordSuccess("");
    if (values.get("newPassword") !== values.get("confirmPassword")) { setPasswordError("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน"); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: values.get("currentPassword"), newPassword: values.get("newPassword") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      form.reset(); setChangeRequired(false); setReload(value => value + 1); setPasswordSuccess("เปลี่ยนรหัสผ่านแล้ว เซสชันเดิมจะใช้ต่อไม่ได้");
    } catch (failure) { setPasswordError(failure instanceof Error ? failure.message : "เชื่อมต่อไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  const inputClass = "w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2";
  return <div className="space-y-6">
    {!changeRequired && <>
      <div className="flex flex-wrap gap-3 items-end"><label className="flex-1 min-w-[200px]">ค้นหาสมาชิก<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="ชื่อผู้ใช้ ชื่อที่แสดง หรืออีเมล" className={`${inputClass} mt-2`} /></label><button onClick={() => setReload(value => value + 1)} className="rounded-xl border border-[var(--border-color)] px-4 py-2">รีเฟรช</button></div>
      <div role="status" aria-live="polite">{loading ? "กำลังโหลดรายชื่อ…" : data ? `พบ ${data.total.toLocaleString("th-TH")} บัญชี${query ? "ตามคำค้น" : "ทั้งหมด"}` : ""}</div>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {data && <><div className="overflow-x-auto rounded-xl border border-[var(--border-color)]"><table className="w-full text-sm text-left"><caption className="sr-only">รายชื่อสมาชิกที่สมัคร เรียงจากใหม่ไปเก่า</caption><thead className="bg-[var(--bg-primary)]"><tr>{["สมาชิก", "อีเมล", "สิทธิ์", "วันสมัคร", "เข้าใช้งานล่าสุด"].map(title => <th key={title} scope="col" className="px-4 py-3 whitespace-nowrap">{title}</th>)}</tr></thead><tbody>{data.users.map(member => <tr key={member.id} className="border-t border-[var(--border-color)]"><td className="px-4 py-3"><p className="font-semibold">{member.displayName}</p><p className="text-[var(--text-muted)]">@{member.username}</p></td><td className="px-4 py-3 break-all">{member.email}</td><td className="px-4 py-3 whitespace-nowrap">{member.role === "admin" ? "ผู้ดูแลระบบ" : "นักอ่าน"}</td><td className="px-4 py-3 whitespace-nowrap">{date(member.createdAt)}</td><td className="px-4 py-3 whitespace-nowrap">{date(member.lastLoginAt)}</td></tr>)}{!data.users.length && <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">{query ? "ไม่พบสมาชิกตามคำค้น" : "ยังไม่มีสมาชิก"}</td></tr>}</tbody></table></div><div className="flex justify-between items-center gap-3"><button disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)} className="border rounded-xl px-4 py-2 disabled:opacity-40">ก่อนหน้า</button><span>หน้า {page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button disabled={page * data.pageSize >= data.total || loading} onClick={() => setPage(value => value + 1)} className="border rounded-xl px-4 py-2 disabled:opacity-40">ถัดไป</button></div></>}
    </>}
    <details open={changeRequired} className="rounded-xl border border-[var(--border-color)] p-5"><summary className="cursor-pointer font-semibold">เปลี่ยนรหัสผ่านแอดมิน</summary>{changeRequired && <p className="my-3 text-amber-700">กรุณาเปลี่ยนรหัสผ่านเริ่มต้นก่อนดูรายชื่อสมาชิก</p>}<form onSubmit={changePassword} className="mt-4 space-y-3 max-w-md">{[{ name: "currentPassword", title: "รหัสผ่านปัจจุบัน", autoComplete: "current-password" }, { name: "newPassword", title: "รหัสผ่านใหม่ (อย่างน้อย 12 ตัวอักษร)", autoComplete: "new-password" }, { name: "confirmPassword", title: "ยืนยันรหัสผ่านใหม่", autoComplete: "new-password" }].map(field => <label key={field.name} className="block">{field.title}<input required type="password" name={field.name} minLength={field.name === "currentPassword" ? 1 : 12} autoComplete={field.autoComplete} className={`${inputClass} mt-1`} /></label>)}{passwordError && <p role="alert" className="text-red-600">{passwordError}</p>}{passwordSuccess && <p role="status" className="text-green-600">{passwordSuccess}</p>}<button disabled={saving} className="bg-blue-600 text-white rounded-xl px-4 py-2 disabled:opacity-50">{saving ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}</button></form></details>
  </div>;
}

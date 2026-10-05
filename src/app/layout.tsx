import type { Metadata } from "next";
import "./globals.css";
import { ReaderProvider } from "@/context/ReaderContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "จักรวาลอาคิตะ (Akita Universe) | เว็บอ่านนิยายออนไลน์",
  description: "เว็บอ่านนิยายออนไลน์ ภาค 1 & ภาคพิเศษ รองรับระบบสมาชิก จดจำตำแหน่งอ่าน และปรับแต่งธีม",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <AuthProvider>
          <ReaderProvider>{children}</ReaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

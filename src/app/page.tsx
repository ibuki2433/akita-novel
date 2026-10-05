import Navbar from "../components/Navbar";
import NovelShowcase from "../components/NovelShowcase";
import { getVolumes, getAllChapters } from "../lib/novel";

export default function HomePage() {
  const volumes = getVolumes();
  const allChapters = getAllChapters();

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <NovelShowcase volumes={volumes} allChapters={allChapters} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--border-color)] py-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)]/50">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-medium">
            จักรวาลอาคิตะ (Akita Universe) • เว็บอ่านนิยายออนไลน์ ภาค 1 & ภาคพิเศษ
          </p>
          <p>
            รองรับการปรับแต่งธีมสว่าง / มืด / ซีเปีย และจำตำแหน่งการอ่านอัตโนมัติ
          </p>
        </div>
      </footer>
    </>
  );
}

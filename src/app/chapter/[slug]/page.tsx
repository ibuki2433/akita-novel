import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllChapters, getChapterBySlug } from "../../../lib/novel";
import ReaderView from "../../../components/ReaderView";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const chapters = getAllChapters();
  return chapters.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const chapter = await getChapterBySlug(params.slug);
  if (!chapter) {
    return {
      title: "ไม่พบบทนิยาย | Novel Reader",
    };
  }

  return {
    title: `${chapter.title} - ${chapter.novelTitle || "ตำนานจอมเวทห้วงดารา"}`,
    description: chapter.synopsis || `อ่าน ${chapter.title} ออนไลน์`,
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const chapter = await getChapterBySlug(params.slug);

  if (!chapter) {
    notFound();
  }

  const allChapters = getAllChapters();

  return <ReaderView chapter={chapter} allChapters={allChapters} />;
}

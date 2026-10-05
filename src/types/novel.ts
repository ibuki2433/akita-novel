export type VolumeId = "special" | "part1";

export interface VolumeInfo {
  id: VolumeId;
  name: string;
  shortName: string;
  subtitle: string;
  tagline: string;
  author: string;
  synopsis: string;
  characterMain: string;
  characterDescription: string;
  coverImage: string;
  badge: string;
  category: string;
  tags: string[];
  themeColor: "amber" | "blue" | "purple" | "indigo";
}

export interface ChapterMeta {
  slug: string;
  volume: VolumeId;
  order: number;
  title: string;
  novelTitle?: string;
  author?: string;
  updatedAt?: string;
  synopsis?: string;
  readTime?: string;
}

export interface ChapterData extends ChapterMeta {
  contentHtml: string;
  rawContent: string;
  prevChapter: { slug: string; title: string; order: number } | null;
  nextChapter: { slug: string; title: string; order: number } | null;
  volumeInfo?: VolumeInfo;
}

export interface NovelInfo {
  title: string;
  author: string;
  synopsis: string;
  volumes: VolumeInfo[];
  totalChapters: number;
}

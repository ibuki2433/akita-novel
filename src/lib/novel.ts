import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { ChapterMeta, ChapterData, VolumeInfo, VolumeId } from "../types/novel";

const CHAPTERS_DIRECTORY = path.join(process.cwd(), "content", "chapters");

export const VOLUMES: VolumeInfo[] = [
  {
    id: "special",
    name: "ภาคพิเศษ: ปฐมบทจตุรสงคราม",
    shortName: "ภาคพิเศษ",
    subtitle: "จุดเริ่มต้นของนัยน์ตาสีฟ้าใส",
    tagline: "เจาะลึกเส้นทางชีวิตของ 'อาคิระ' ก่อนก้าวสู่ 1 ใน 6 จตุรสงครามแห่งยุค และความผูกพันอันลึกซึ้งกับไอริส",
    author: "อาคิตะ เวิลด์",
    synopsis:
      "ท่ามกลางเศษซากอารยธรรมที่พังทลายและหยดเลือดที่ไหลรินในประวัติศาสตร์ โลกใบนี้ไม่เคยขาดแคลนสิ่งที่เรียกว่าสงคราม เรื่องราวภาคแยกที่จะพาไปเจาะลึกเส้นทางชีวิตของ 'อาคิระ' ก่อนที่เธอจะก้าวขึ้นสู่จุดสูงสุดในฐานะ 1 ใน 6 จตุรสงครามแห่งยุค ร่วมกับ 'ไอริส' เพื่อนสนิทคนสำคัญที่เธอรักและสาบานว่าจะปกป้องไว้ด้วยชีวิต",
    characterMain: "อาคิระ & ไอริส (Akira & Iris)",
    characterDescription:
      "อาคิระ เด็กสาวนัยน์ตาสีฟ้าใสผู้มีพลังทำลายล้างสะเทือนฟ้าดิน และไอริส เพื่อนรักผู้เป็นดั่งแสงสว่างเดียวในใจ",
    coverImage: "",
    badge: "ภาคแยกพิเศษ (Spin-off Prequel)",
    category: "มหากาพย์สงคราม / มิตรภาพ / แฟนตาซีดราม่า",
    tags: ["ปฐมบทจตุรสงคราม", "อาคิระ", "ไอริส", "นัยน์ตาสีฟ้าใส", "6 จตุรสงคราม"],
    themeColor: "indigo",
  },
  {
    id: "part1",
    name: "ภาค 1: สงครามของผู้ใช้อาคิตะ",
    shortName: "ภาค 1",
    subtitle: "การตื่นรู้ของอาคิตะพันธะเทพ",
    tagline: "เมื่อเด็กหนุ่มได้ครอบครองพลังที่อันตรายที่สุดในโลกใต้ดิน ณ ลานคอนเทนเนอร์ริมท่าเรือ...",
    author: "อาคิตะ เวิลด์",
    synopsis:
      "ในโลกที่ผู้คนธรรมดาใช้ชีวิตเหมือนเดิมทุกวัน มีพลังหนึ่งที่เปลี่ยนชะตาของบางคนไปตลอดกาล พลังนั้นถูกเรียกว่า 'อาคิตะ' พลังที่ผูกติดกับตัวตนของผู้ใช้ เมื่ออาคิตะตื่นขึ้น โลกใต้ดิน รัฐบาล นักล่าค่าหัว และองค์กรลับต่างเริ่มเคลื่อนไหว ทุกคนต่างต้องการครอบครอง 'อาคิตะพันธะเทพ' และในคืนหนึ่ง ณ ลานคอนเทนเนอร์ริมท่าเรือ เด็กหนุ่มนามว่า 'อิสึกิ' เพิ่งรู้ตัวว่าเขาได้ครอบครองมัน... จุดเริ่มต้นของสงครามที่ไม่มีใครหนีพ้น!",
    characterMain: "อิสึกิ (Itsuki)",
    characterDescription:
      "เด็กหนุ่มธรรมดาผู้ค้นพบว่าตนเองมี 'อาคิตะพันธะเทพ' พลังหายากระดับตำนานที่ถูกตามล่าจากทุกฝ่าย",
    coverImage: "",
    badge: "เนื้อเรื่องหลัก (Main Story)",
    category: "แอ็กชัน / แฟนตาซีโลกมืด / ผจญภัย",
    tags: ["อาคิตะ", "อาคิตะพันธะเทพ", "อิสึกิ", "สงครามโลกใต้ดิน", "พลังพิเศษ"],
    themeColor: "blue",
  },
];

export const CHARACTER_HIGHLIGHT_MAP: { pattern: RegExp; cssClass: string }[] = [
  // 1. อิสึกิ : ฟ้า
  { pattern: /^(อิสึกิ\s*[:：].*)$/i, cssClass: "speech-itsuki" },
  // 2. ยูโตะ : ส้ม
  { pattern: /^(ยูโตะ\s*[:：].*)$/i, cssClass: "speech-yuto" },
  // 3. ไอร่า : เขียว
  { pattern: /^(ไอร่า\s*[:：].*)$/i, cssClass: "speech-aira" },
  // 4. ฮิซากิ : ทอง
  { pattern: /^(ฮิซากิ\s*[:：].*)$/i, cssClass: "speech-hisaki" },
  // 5. อาคิระ : ฟ้าอ่อน
  { pattern: /^(อาคิระ\s*[:：].*)$/i, cssClass: "speech-akira" },
  // 6. อิซานา : ฟ้า
  { pattern: /^(อิซานา\s*[:：].*)$/i, cssClass: "speech-izana" },
  // 7. ซาเอกิ : เขียวแก่
  { pattern: /^(ซาเอกิ\s*[:：].*)$/i, cssClass: "speech-saeki" },
  // 8. คายะ : แดง
  { pattern: /^(คายะ\s*[:：].*)$/i, cssClass: "speech-kaya" },
  // 9. เซริ : ม่วงเข้ม
  { pattern: /^(เซริ\s*[:：].*)$/i, cssClass: "speech-seri" },
  // 10. คุโรยะ : ฟ้า
  { pattern: /^(คุโรยะ\s*[:：].*)$/i, cssClass: "speech-kuroya" },
  // 11. โทริ / ลุงโทริ : น้ำเงิน
  { pattern: /^((?:ลุง)?โทริ\s*[:：].*)$/i, cssClass: "speech-tori" },
  // 12. คานาเมะ : แดงเลือดหมู
  { pattern: /^(คานาเมะ\s*[:：].*)$/i, cssClass: "speech-kaname" },
  // 13. มิโคโตะ : แดง
  { pattern: /^(มิโคโตะ\s*[:：].*)$/i, cssClass: "speech-mikoto" },
  // 14. เซียงเจียว : ทอง
  { pattern: /^(เซียงเจียว\s*[:：].*)$/i, cssClass: "speech-xiangjiao" },
  // 15. หลิงโหว : เขียวอ่อน
  { pattern: /^(หลิงโหว\s*[:：].*)$/i, cssClass: "speech-linghou" },
  // 16. อาชิ : ชมพู
  { pattern: /^(อาชิ\s*[:：].*)$/i, cssClass: "speech-ashi" },
  // 17. อิบุกิ : ม่วง
  { pattern: /^(อิบุกิ\s*[:：].*)$/i, cssClass: "speech-ibuki" },
  // 18. ดรีม : ฟ้าอมม่วงชวนฝัน
  { pattern: /^(ดรีม\s*[:：].*)$/i, cssClass: "speech-dream" },
  // 19. ริโนะ : ดำม่วง
  { pattern: /^(ริโนะ\s*[:：].*)$/i, cssClass: "speech-rino" },
  // 20. ฮิโนะ : เขียวมรกต
  { pattern: /^(ฮิโนะ\s*[:：].*)$/i, cssClass: "speech-hino" },
  // 21. มิโอะ : ม่วงดำ
  { pattern: /^(มิโอะ\s*[:：].*)$/i, cssClass: "speech-mio" },
  // 22. แบล็คเคน : แดง
  { pattern: /^(แบล็คเคน\s*[:：].*)$/i, cssClass: "speech-blackken" },

  // ตัวละครหลักและร่วมฉากที่มีอยู่เดิม
  { pattern: /^(ไอริส\s*[:：].*)$/i, cssClass: "speech-iris" },
  { pattern: /^(เซน่อน\s*[:：].*)$/i, cssClass: "speech-xenon" },
  { pattern: /^(ชายหนุ่มปริศนา\s*[:：].*)$/i, cssClass: "speech-xenon" },
  { pattern: /^(#?\s*(?:ลุง)?ผู้ว่าจ้าง.*[:：].*)$/i, cssClass: "speech-contractor" },
  { pattern: /^(ลุงเจ้าของร้าน\s*[:：].*)$/i, cssClass: "speech-contractor" },
  { pattern: /^(ผู้ช่วย.*[:：].*)$/i, cssClass: "speech-assistant" },
  { pattern: /^(คนขับรถ\s*[:：].*)$/i, cssClass: "speech-assistant" },
  { pattern: /^(ยูรางิ\s*[:：].*)$/i, cssClass: "speech-yuragi" },
  { pattern: /^(หญิงสาว(?:ผมสีม่วง)?\s*[:：].*)$/i, cssClass: "speech-yuragi" },
  { pattern: /^(หญิงปริศนา\s*[:：].*)$/i, cssClass: "speech-yuragi" },
  { pattern: /^(เดียร์\s*[:：].*)$/i, cssClass: "speech-deer" },
  { pattern: /^(อาคิตะกลายพันธุ์\s*[:：].*)$/i, cssClass: "speech-deer" },
  { pattern: /^(เก็[งน]ริว\s*[:：].*)$/i, cssClass: "speech-genryu" },
  { pattern: /^(เฟีย\s*[:：].*)$/i, cssClass: "speech-fia" },
  { pattern: /^((?:เงาปริศนา|ผู้ใช้อาคิตะ(?:ปริศนา)?)\s*[:：].*)$/i, cssClass: "speech-shadow" },
  { pattern: /^(ชายหนุ่ม\s*[:：].*)$/i, cssClass: "speech-kaito" },
  { pattern: /^(รปภ\..*[:：].*)$/i, cssClass: "speech-guard" },
  { pattern: /^(พวกคุโรฮะ\s*[:：].*)$/i, cssClass: "speech-guard" },
  { pattern: /^(หัวหน้าคุโรฮะ\s*[:：].*)$/i, cssClass: "speech-guard" },
  { pattern: /^((?:คนแถวนั้น|คนธรรมดา|ชาวบ้าน).*[:：].*)$/i, cssClass: "speech-crowd" },
  { pattern: /^(นัก(?:รายงาน)?ข่าว.*[:：].*)$/i, cssClass: "speech-crowd" },
];

/**
 * Automatically applies character speech highlight classes to any matching dialogues in HTML
 */
export function applyCharacterHighlights(htmlContent: string): string {
  // 1. Process paragraphs that are not yet wrapped in speech-wrap
  return htmlContent.replace(/<p>([\s\S]*?)<\/p>/g, (match, inner) => {
    // If it already has speech-wrap or speech-bubble inside, recheck/replace class if needed
    if (inner.includes('class="speech-bubble')) {
      for (const item of CHARACTER_HIGHLIGHT_MAP) {
        // Extract raw text inside span
        const cleanText = inner.replace(/<[^>]+>/g, "").trim();
        if (item.pattern.test(cleanText)) {
          return `<p class="speech-wrap"><span class="speech-bubble ${item.cssClass}">${cleanText}</span></p>`;
        }
      }
      return match;
    }

    const trimmed = inner.trim();
    for (const item of CHARACTER_HIGHLIGHT_MAP) {
      if (item.pattern.test(trimmed)) {
        return `<p class="speech-wrap"><span class="speech-bubble ${item.cssClass}">${trimmed}</span></p>`;
      }
    }
    return match;
  });
}

const COVERS_FILE = path.join(process.cwd(), "data", "covers.json");

export function getCustomCovers(): Record<string, string | null> {
  try {
    if (fs.existsSync(COVERS_FILE)) {
      return JSON.parse(fs.readFileSync(COVERS_FILE, "utf8"));
    }
  } catch {}
  return { special: null, part1: null };
}

export function getVolumes(): VolumeInfo[] {
  const covers = getCustomCovers();
  return VOLUMES.map((vol) => ({
    ...vol,
    coverImage: covers[vol.id] || "",
  }));
}

export function getVolumeById(id: string): VolumeInfo {
  const vols = getVolumes();
  return vols.find((v) => v.id === id) || vols[0];
}

function ensureDirectory() {
  if (!fs.existsSync(CHAPTERS_DIRECTORY)) {
    fs.mkdirSync(CHAPTERS_DIRECTORY, { recursive: true });
  }
}

function estimateReadTime(text: string): string {
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 160));
  return `${minutes} นาที`;
}

export function getAllChapters(filterVolume?: VolumeId): ChapterMeta[] {
  ensureDirectory();
  const fileNames = fs.readdirSync(CHAPTERS_DIRECTORY);

  const chapters: ChapterMeta[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".md") && !fileName.endsWith(".txt")) continue;

    const slug = fileName.replace(/\.(md|txt)$/, "");
    const fullPath = path.join(CHAPTERS_DIRECTORY, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    let volume: VolumeId = slug.startsWith("special") ? "special" : "part1";
    let order = 0;
    let title = slug;
    let novelTitle = "อาคิตะ";
    let author = "อาคิตะ เวิลด์";
    let updatedAt = "2026-10-05";
    let synopsis = "";
    let readTime = "";

    const matchOrder = slug.match(/(\d+)/);
    if (matchOrder) {
      order = parseInt(matchOrder[1], 10);
    }
    if (slug.includes("prologue")) {
      order = 0;
    }

    if (fileName.endsWith(".md")) {
      const { data, content } = matter(fileContents);
      if (data.volume === "special" || data.volume === "part1") {
        volume = data.volume;
      }
      order = data.order !== undefined ? Number(data.order) : order;
      title = data.title || title;
      novelTitle = data.novelTitle || novelTitle;
      author = data.author || author;
      updatedAt = data.updatedAt ? String(data.updatedAt) : updatedAt;
      synopsis = data.synopsis || "";
      readTime = data.readTime || estimateReadTime(content);
    }

    chapters.push({
      slug,
      volume,
      order,
      title,
      novelTitle,
      author,
      updatedAt,
      synopsis,
      readTime,
    });
  }

  // Filter if volume specified
  const filtered = filterVolume ? chapters.filter((c) => c.volume === filterVolume) : chapters;

  // Sort ascending by order
  return filtered.sort((a, b) => a.order - b.order);
}

export async function getChapterBySlug(slug: string): Promise<ChapterData | null> {
  ensureDirectory();
  let fullPath = path.join(CHAPTERS_DIRECTORY, `${slug}.md`);
  let isMarkdown = true;

  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(CHAPTERS_DIRECTORY, `${slug}.txt`);
    isMarkdown = false;
    if (!fs.existsSync(fullPath)) {
      return null;
    }
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  let contentHtml = "";
  let rawContent = "";
  let meta: Partial<ChapterMeta> = { slug };

  if (isMarkdown) {
    const { data, content } = matter(fileContents);
    rawContent = content;
    const processedContent = await remark().use(html, { sanitize: false }).process(content);
    contentHtml = applyCharacterHighlights(processedContent.toString());

    meta = {
      slug,
      volume: (data.volume === "special" ? "special" : "part1") as VolumeId,
      order: data.order !== undefined ? Number(data.order) : (slug.includes("prologue") ? 0 : 1),
      title: data.title || slug,
      novelTitle: data.novelTitle || "อาคิตะ",
      author: data.author || "อาคิตะ เวิลด์",
      updatedAt: data.updatedAt ? String(data.updatedAt) : "2026-10-05",
      synopsis: data.synopsis || "",
      readTime: data.readTime || estimateReadTime(content),
    };
  } else {
    rawContent = fileContents;
    const rawParagraphs = fileContents
      .split(/\r?\n\r?\n/)
      .map((p) => `<p>${p.trim().replace(/\r?\n/g, "<br/>")}</p>`)
      .join("");
    contentHtml = applyCharacterHighlights(rawParagraphs);
    meta = {
      slug,
      volume: slug.startsWith("special") ? "special" : "part1",
      order: 1,
      title: slug,
      novelTitle: "อาคิตะ",
      author: "อาคิตะ เวิลด์",
      updatedAt: "2026-10-05",
      synopsis: "",
      readTime: estimateReadTime(fileContents),
    };
  }

  // Get adjacent chapters in the SAME volume
  const volumeChapters = getAllChapters(meta.volume);
  const currentIndex = volumeChapters.findIndex((c) => c.slug === slug);

  const prev = currentIndex > 0 ? volumeChapters[currentIndex - 1] : null;
  const next = currentIndex < volumeChapters.length - 1 ? volumeChapters[currentIndex + 1] : null;
  const volumeInfo = getVolumeById(meta.volume!);

  return {
    slug,
    volume: meta.volume!,
    order: meta.order!,
    title: meta.title!,
    novelTitle: meta.novelTitle,
    author: meta.author,
    updatedAt: meta.updatedAt,
    synopsis: meta.synopsis,
    readTime: meta.readTime,
    contentHtml,
    rawContent,
    prevChapter: prev ? { slug: prev.slug, title: prev.title, order: prev.order } : null,
    nextChapter: next ? { slug: next.slug, title: next.title, order: next.order } : null,
    volumeInfo,
  };
}

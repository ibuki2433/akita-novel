import os, glob, pypdf, re, sys

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

THAI_PUA_MAP = {
    0xF700: '\u0e10', 0xF701: '\u0e34', 0xF702: '\u0e35', 0xF703: '\u0e36',
    0xF704: '\u0e37', 0xF705: '\u0e48', 0xF706: '\u0e49', 0xF707: '\u0e4a',
    0xF708: '\u0e4b', 0xF709: '\u0e4c', 0xF70A: '\u0e48', 0xF70B: '\u0e49',
    0xF70C: '\u0e4a', 0xF70D: '\u0e4b', 0xF70E: '\u0e4c', 0xF70F: '\u0e0d',
    0xF710: '\u0e31', 0xF711: '\u0e34', 0xF712: '\u0e35', 0xF713: '\u0e36',
    0xF714: '\u0e37', 0xF715: '\u0e4e', 0xF716: '\u0e48', 0xF717: '\u0e49',
    0xF718: '\u0e4a', 0xF719: '\u0e4b', 0xF71A: '\u0e4c', 0xF71B: '\u0e38',
    0xF71C: '\u0e39', 0xF71D: '\u0e3a',
}

KNOWN_CHARACTERS = [
    "อิสึกิ", "ยูโตะ", "ไอร่า", "ฮิซากิ", "อาคิระ", "อิซานา", "ซาเอกิ", "คายะ",
    "เซริ", "คุโรยะ", "โทริ", "ลุงโทริ", "คานาเมะ", "มิโคโตะ", "เซียงเจียว", "หลิงโหว",
    "อาชิ", "อิบุกิ", "ดรีม", "ริโนะ", "ฮิโนะ", "มิโอะ", "แบล็คเคน", "เก็นริว", "เก็งริว",
    "ไอริส", "เซน่อน", "ยูรางิ", "เฟีย", "เดียร์", "ไคโตะ", "ลุงไอซ์", "ลุงเจ้าของร้าน",
    "เงาปริศนา", "ผู้ใช้อาคิตะปริศนา", "ผู้ใช้อาคิตะ", "หญิงสาวปริศนา", "ชายหนุ่มปริศนา", "หญิงสาว", "ชายหนุ่ม",
    "หัวหน้าคุโรฮะ", "พวกคุโรฮะ", "รปภ.", "คนขับรถ", "ผู้ช่วย", "นักข่าว", "ประกาศ"
]

char_pattern = "|".join([re.escape(c) for c in sorted(KNOWN_CHARACTERS, key=len, reverse=True)])

# Matches: Speaker : "Speech..." or Speaker: “Speech...”
dialogue_pattern = re.compile(
    rf'(?:^|(?<=[^ก-๙a-zA-Z0-9]))((?:{char_pattern}))\s*[:：]\s*([“"\'\'][^”"\'\n]+[”"\'\'])',
    re.UNICODE
)

def clean_pua(text):
    return ''.join(THAI_PUA_MAP.get(ord(c), c) for c in text)

def normalize_thai(text):
    # Remove space before combining marks / upper vowels / tones / following vowels
    text = re.sub(r'\s+([\u0e30-\u0e3a\u0e47-\u0e4e])', r'\1', text)
    # Remove space after leading vowels
    text = re.sub(r'([\u0e40-\u0e44])\s+', r'\1', text)
    # Clean multiple spaces
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def extract_pdf_paragraphs(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    full_raw = ''
    for p in reader.pages:
        full_raw += (p.extract_text() or '') + '\n'
    
    raw = clean_pua(full_raw)
    lines = [line.rstrip('\r\n') for line in raw.split('\n')]
    
    paragraphs = []
    cur = []
    blank_count = 0
    
    for l in lines:
        if not l.strip():
            blank_count += 1
            if blank_count >= 2:
                if cur:
                    p_text = normalize_thai(''.join(cur))
                    if p_text:
                        paragraphs.append(p_text)
                    cur = []
            elif blank_count == 1:
                cur.append(' ')
        else:
            blank_count = 0
            cur.append(l.strip())
            
    if cur:
        p_text = normalize_thai(''.join(cur))
        if p_text:
            paragraphs.append(p_text)
            
    return paragraphs

def split_dialogues(p):
    p = p.strip()
    if not p:
        return []
        
    pos = 0
    results = []
    matches = list(dialogue_pattern.finditer(p))
    if not matches:
        return [p]
        
    for m in matches:
        start, end = m.span()
        before = p[pos:start].strip()
        if before:
            before = re.sub(r'^[–—\-=_]{3,}\s*', '', before).strip()
            if before:
                results.append(before)
        spk = m.group(1).strip()
        speech = m.group(2).strip()
        results.append(f'{spk} : {speech}')
        pos = end
        
    remaining = p[pos:].strip()
    if remaining:
        if remaining.startswith('“') or remaining.startswith('"'):
            if results and ' : ' in results[-1]:
                results[-1] += f' {remaining}'
            else:
                results.append(remaining)
        else:
            results.append(remaining)
            
    return results

def process_chapter(paragraphs, ch_num):
    processed = []
    
    for p in paragraphs:
        # Check if line is just chapter title header (e.g. ตอนที่ 1 — สิ่งที่อยู่ในตัว)
        if re.match(rf'^ตอนที่\s*{ch_num}\b', p) and len(p) < 80:
            continue
            
        # Check for scene divider
        if re.match(r'^[–—\-=_]{3,}', p):
            sub_parts = re.split(r'^[–—\-=_]{3,}\s*', p)
            processed.append("---")
            if len(sub_parts) > 1 and sub_parts[1].strip():
                # Process the remainder as a paragraph
                for sub in split_dialogues(sub_parts[1].strip()):
                    if sub:
                        processed.append(sub)
            continue
            
        # Check if paragraph has dialogues
        sub_items = split_dialogues(p)
        for sub in sub_items:
            # Also check if it starts with speaker: speech without quotes
            m_noquote = re.match(rf'^((?:{char_pattern}))\s*[:：]\s*(.+)$', sub)
            if m_noquote and not ('"' in sub or '“' in sub):
                spk = m_noquote.group(1).strip()
                speech = m_noquote.group(2).strip()
                processed.append(f'{spk} : "{speech}"')
            else:
                processed.append(sub)
                
    return processed

# Chapter title map
CHAPTER_TITLES = {
    1: "ตอนที่ 1: สิ่งที่อยู่ในตัว",
    2: "ตอนที่ 2: ความยินดี",
    3: "ตอนที่ 3: หญิงสาวในร้านเค้ก",
    4: "ตอนที่ 4: ผู้ไม่ได้มาเยือน",
    5: "ตอนที่ 5: ตาย",
    6: "ตอนที่ 6: ตัวตนที่ไม่รู้จัก",
    7: "ตอนที่ 7: ดอกคิซุเนะ",
    8: "ตอนที่ 8: คืนก่อนงานเทศกาล",
    9: "ตอนที่ 9: คนล่ะชั้น",
    10: "ตอนที่ 10: กระทิง กับ กระต่าย",
    11: "ตอนที่ 11: สิ่งที่น่ากลัวคือ...",
    12: "ตอนที่ 12: สิ่งที่แตกต่าง...",
    13: "ตอนที่ 13: เทศกาลดอกคิซุเนะสีเลือด...",
    14: "ตอนที่ 14: ความบิดเบี้ยวที่กำลังมา",
    15: "ตอนที่ 15: ปิดงานเทศกาลดอกคิซุเนะสีเลือด",
    16: "ตอนที่ 16: ความเศร้าเปลี่ยนเป็นความแค้น",
    17: "ตอนที่ 17: เริ่มต้นใหม่",
    18: "ตอนที่ 18: ยินดีต้อนรับ",
    19: "ตอนที่ 19: จุดเริ่มต้น",
    20: "ตอนที่ 20: การบ้าคอมโบ",
    21: "ตอนที่ 21: แผนลับความมืด",
    22: "ตอนที่ 22: หญิงสาวแปลกหน้า",
    23: "ตอนที่ 23: แปลงเป็นสถานการณ์ Vs แก้สถานการณ์",
    24: "ตอนที่ 24: จนมุม",
    25: "ตอนที่ 25: กินกันไม่ลง",
    26: "ตอนที่ 26: พลังของตัวเอง...",
}

download_dir = r"C:\Users\User\Downloads"
output_dir = r"D:\Bull\เว็บนิยาย\content\chapters"

all_pdf_files = glob.glob(os.path.join(download_dir, "ตอนที่ *.pdf"))

def get_chapter_number(f):
    name = os.path.basename(f)
    m = re.search(r'ตอนที่\s*(\d+)', name)
    return int(m.group(1)) if m else 999

all_pdf_files = sorted(all_pdf_files, key=get_chapter_number)

print(f"Starting conversion of chapters 25 and 26...")

for f in all_pdf_files:
    ch_num = get_chapter_number(f)
    if ch_num > 26:
        continue
        
    title = CHAPTER_TITLES.get(ch_num, f"ตอนที่ {ch_num}")
    md_filename = f"part1-ch{ch_num:02d}.md"
    target_path = os.path.join(output_dir, md_filename)
    
    print(f"Processing Ch {ch_num}: {os.path.basename(f)} -> {md_filename}...")
    
    raw_paragraphs = extract_pdf_paragraphs(f)
    processed = process_chapter(raw_paragraphs, ch_num)
    
    # Generate synopsis from first 1-2 narrative paragraphs (excluding dividers or short headers)
    synopsis_parts = []
    for p in processed:
        if p == "---" or " : " in p or len(p) < 20:
            continue
        synopsis_parts.append(p)
        if len(" ".join(synopsis_parts)) >= 120:
            break
            
    synopsis = " ".join(synopsis_parts)
    if len(synopsis) > 220:
        synopsis = synopsis[:217] + "..."
    if not synopsis:
        synopsis = f"เรื่องราวใน {title} ของ อาคิตะ ภาค 1"
        
    # Read time estimate
    total_chars = sum(len(p) for p in processed)
    est_minutes = max(2, round(total_chars / 1500))
    read_time = f"{est_minutes} นาที"
    
    # Construct Markdown file content
    content_lines = [
        "---",
        'volume: "part1"',
        f'order: {ch_num}',
        f'title: "{title}"',
        'novelTitle: "อาคิตะ ภาค 1: สงครามของผู้ใช้อาคิตะ"',
        'author: "อาคิตะ เวิลด์"',
        'updatedAt: "2026-10-05"',
        f'synopsis: "{synopsis}"',
        f'readTime: "{read_time}"',
        "---",
        ""
    ]
    
    for p in processed:
        content_lines.append(p)
        content_lines.append("")
        
    with open(target_path, "w", encoding="utf-8") as out:
        out.write("\n".join(content_lines))
        
    print(f"  ✓ Saved {md_filename} ({len(processed)} paragraphs, ~{total_chars} chars, {read_time})")

print("\n🎉 ALL 24 CHAPTERS CONVERTED AND SAVED SUCCESSFULLY!")

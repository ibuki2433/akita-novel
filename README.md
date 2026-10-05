# 📖 เว็บแอปพลิเคชันสำหรับอ่านนิยาย (Novel Reader Web)

## Deploy บน Render

- ใช้ Node.js `22.19.0` (dependency `better-sqlite3` ต้องใช้ Node 22 ขึ้นไป)
- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `npm start`
- ตั้ง `NODE_ENV=production` ได้ โดย `.npmrc` จะให้ติดตั้งเครื่องมือ build รวมถึง Tailwind, PostCSS และ TypeScript ด้วย
- `.npmrc` ปิด install scripts เพื่อใช้ native binary ที่มากับ `better-sqlite3` แทน fallback `node-gyp rebuild`; `npm run build` และ `npm start` ยังทำงานตามปกติ หากเพิ่ม dependency ที่ต้องใช้ install script ให้ทบทวนค่านี้ด้วย
- ถ้าสร้าง service ผ่าน Dashboard ให้แก้ Environment `NODE_VERSION` เป็น `22.19.0` และ Build Command ให้ตรงกับข้างบนด้วย เพราะการแก้ `render.yaml` อย่างเดียวอาจไม่เปลี่ยนค่าของ service ที่สร้างไว้แล้ว
- หลัง push การแก้ไข ให้เลือก Clear build cache & deploy ใน Render

เว็บอ่านนิยายออนไลน์โมเดิร์น พัฒนาด้วย **Next.js (App Router)**, **React**, **TypeScript** และ **Tailwind CSS** ออกแบบมาเพื่อประสบการณ์การอ่านที่สบายตา รองรับทั้งบนคอมพิวเตอร์และมือถือ

---

## ✨ ฟีเจอร์เด่น (Key Features)

1. **แหล่งข้อมูลเนื้อหา (Markdown & Text Content)**:
   - ดึงข้อมูลบทนิยายจากไฟล์ในโฟลเดอร์ `./content/chapters`
   - รองรับทั้งไฟล์ `.md` (Markdown พร้อม YAML Frontmatter) และ `.txt` (ข้อความธรรมดา)
   - มี Metadata ครบถ้วน: ชื่อตอน, ลำดับตอน (`order`), วันที่อัปเดต (`updatedAt`), คำโปรยบท (`synopsis`), เวลาที่ใช้ในการอ่าน (`readTime`)

2. **หน้าหลัก (Home Page)**:
   - แสดงหน้าปก/แบนเนอร์นิยาย
   - ข้อมูลเบื้องต้น คำโปรยเรื่องย่อ หมวดหมู่ แท็ก และจำนวนตอน
   - **ระบบจำตำแหน่งการอ่าน (Resume Reading)**: แสดงตอนที่อ่านค้างไว้พร้อมปุ่ม "อ่านต่อทันที" หรือ "เริ่มอ่านตอนแรก"
   - **สารบัญแสดงรายชื่อตอนทั้งหมด**: เรียงตามลำดับตอน สามารถค้นหาตามชื่อตอน หรือสลับลำดับตอนแรก/ตอนล่าสุดได้
   - มี Badge บ่งบอกตอนที่ "อ่านแล้ว" และ "อ่านล่าสุด" อัตโนมัติ

3. **หน้ารีดเดอร์สำหรับอ่านเนื้อหา (Reader View)**:
   - **ระบบนำทาง (Navigation)**: ปุ่ม 'ตอนก่อนหน้า' (Previous) และ 'ตอนถัดไป' (Next) พร้อม drawer สารบัญสำหรับสลับตอนอย่างรวดเร็ว
   - **แถบเครื่องมือปรับแต่ง (Reader Toolbar)**:
     - ปุ่มปรับขนาดตัวอักษร: `A-` / `A+` / รีเซ็ต (14px – 32px)
     - สลับธีมสีพื้นหลัง:
       - ☀️ **Light Mode (โหมดสว่าง)**
       - 📜 **Sepia Mode (โหมดถนอมสายตา สีซีเปียอุ่นตา)**
       - 🌙 **Dark Mode (โหมดมืด สบายตาในที่มืด)**
     - สลับฟอนต์: ฟอนต์สารบรรณ (Sarabun), Sans-Serif, Serif
     - ปรับระยะห่างบรรทัด: ปกติ / สบายตา / กว้าง
   - **แถบความคืบหน้าการอ่าน (Reading Progress Bar)**: แสดง % การเลื่อนอ่านที่ขอบบนของจอแบบเรียลไทม์
   - **จดจำตำแหน่งการอ่าน (LocalStorage)**: บันทึกตอนล่าสุด และเลื่อนกลับไปยังตำแหน่ง scroll ที่อ่านค้างไว้ให้อัตโนมัติ

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
เว็บนิยาย/
├── content/
│   └── chapters/           # โฟลเดอร์เก็บไฟล์นิยาย (.md หรือ .txt)
│       ├── chapter-01.md
│       ├── chapter-02.md
│       └── chapter-03.md
├── src/
│   ├── app/
│   │   ├── chapter/
│   │   │   └── [slug]/
│   │   │       └── page.tsx # หน้ารีดเดอร์สำหรับอ่านแต่ละตอน
│   │   ├── globals.css      # สไตล์หลักและ Typography สำหรับอ่าน
│   │   ├── layout.tsx       # Root layout และ ReaderProvider
│   │   ├── not-found.tsx    # หน้าแจ้งเตือนกรณีไม่พบบทนิยาย
│   │   └── page.tsx         # หน้าหลัก (Home Page)
│   ├── components/
│   │   ├── ChapterList.tsx   # คอมโพเนนต์สารบัญตอน ค้นหา และคัดกรอง
│   │   ├── Navbar.tsx        # แถบนำทางด้านบน
│   │   ├── ReaderToolbar.tsx # แถบเครื่องมือขนาดตัวอักษร / ธีม / สารบัญ
│   │   ├── ReaderView.tsx    # หน้ารีดเดอร์ ระบบจำตำแหน่ง Scroll
│   │   └── ResumeButton.tsx  # ปุ่มอ่านต่อจากตอนล่าสุด
│   ├── context/
│   │   └── ReaderContext.tsx # ระบบจัดการ Theme, Font และ LocalStorage
│   ├── lib/
│   │   └── novel.ts          # ตัวอ่านไฟล์ Markdown/Text และแปลงเป็น HTML
│   └── types/
│       └── novel.ts          # Type Definitions
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 📝 วิธีเพิ่มตอนนิยายใหม่

สร้างไฟล์ `.md` ใหม่ในโฟลเดอร์ `./content/chapters/` เช่น `chapter-04.md` โดยกำหนดข้อมูลส่วนหัว (Frontmatter) ดังนี้:

```markdown
---
order: 4
title: "บทที่ 4: การเดินทางสู่เมืองหลวง"
novelTitle: "ตำนานจอมเวทห้วงดารา"
author: "ศิลานิรันดร์"
updatedAt: "2026-10-06"
synopsis: "เรย์นเตรียมสัมภาระและเริ่มออกเดินทาง..."
readTime: "5 นาที"
---

เนื้อหานิยายย่อหน้าที่หนึ่ง...

เนื้อหานิยายย่อหน้าที่สอง...
```

---

## 🚀 วิธีเปิดใช้งาน (Running the Application)

1. เข้ามาที่โฟลเดอร์ของโปรเจกต์:
   ```bash
   cd D:\Bull\เว็บนิยาย
   ```

2. รัน Local Development Server:
   ```bash
   npm run dev
   ```

3. เปิดเว็บเบราว์เซอร์ไปที่:
   ```
   http://localhost:3000
   ```

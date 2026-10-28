# 00-DOCS.md - Peta Dokumen & Status Proyek vintaagemeew

**Status Proyek:** Fase Inisiasi (PRD Approved & Blueprint Ready)  
**Tanggal Update Terakhir:** 2026-10-27  

---

## 🗺️ Peta Dokumen Repositori

| Berkas Dokumen | Fungsi & Deskripsi |
| :--- | :--- |
| **[AGENTS.md](file:///d:/project%20web/kamera%20pung%20lallang/AGENTS.md)** | Aturan operasional wajib agen AI, Next.js rules, dan standar anti-slop. |
| **[MVP.md](file:///d:/project%20web/kamera%20pung%20lallang/MVP.md)** | Master Blueprint acuan arsitektur e-commerce (ACID, Stepper, S3, Auto-Cancel, model data kamera). |
| **[_build_plan/prd.md](file:///d:/project%20web/kamera%20pung%20lallang/_build_plan/prd.md)** | Product Requirement Document resmi spesifik untuk **vintaagemeew**. |
| **[DESIGN.md](file:///d:/project%20web/kamera%20pung%20lallang/DESIGN.md)** | Panduan visual, palet warna, tipografi, dan komponen Retro Y2K Pastel Digicam. |
| **[DAILY_TASKS.md](file:///d:/project%20web/kamera%20pung%20lallang/DAILY_TASKS.md)** | Log harian pengerjaan tugas, hash commit, dan progres fitur per sesi. |
| **[TASK.md](file:///d:/project%20web/kamera%20pung%20lallang/TASK.md)** | Checklist terstruktur perbaikan bug hasil audit, penyelarasan ambiguitas, dan Milestone 3. |
| **[TASK_UI_UX.md](file:///d:/project%20web/kamera%20pung%20lallang/TASK_UI_UX.md)** | Checklist terpisah khusus perbaikan fungsional UX, styling Y2K Pastel, dan standar Anti-Slop. |
| **[HANDOFF.md](file:///d:/project%20web/kamera%20pung%20lallang/HANDOFF.md)** | Status estafet antar sesi, guardrail terlarang diubah, dan catatan teknis. |
| **[bug-audit/AUDIT.md](file:///d:/project%20web/kamera%20pung%20lallang/bug-audit/AUDIT.md)** | Log pelacakan dan audit bug teknis (open/in-progress/resolved). |
| **[_build_plan/blueprints/](file:///d:/project%20web/kamera%20pung%20lallang/_build_plan/blueprints/)** | Cetak biru teknis: `theme-config.css`, `schema-proposal.ts`, `Dockerfile`, `coolify.json`. |
| **[_build_plan/milestones/](file:///d:/project%20web/kamera%20pung%20lallang/_build_plan/milestones/)** | Pembagian fase pengerjaan (Milestone 1, 2, dan 3). |
| **[data/](file:///d:/project%20web/kamera%20pung%20lallang/data/)** | Dataset scraping 32 kamera, 94 foto high-res, kategori, brand, dan ongkir. |

---

## 🎯 Backlog Prioritas

1. [x] **Milestone 1 (Init Proyek & Database)** - **SELESAI**:
   - Next.js 16 (App Router + React 19 + Turbopack + Tailwind CSS v4).
   - Implementasi token visual Retro Y2K Pastel Digicam (`DESIGN.md` & `app/globals.css`).
   - Setup Drizzle ORM + PostgreSQL: `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`, dan `db/seed.ts` (32 kamera, 94 gambar remote, parsing grade/defects/inclusions).
   - Verifikasi typecheck `npx tsc --noEmit` EXIT=0 & `npm run build` sukses.
2. **Milestone 2 (Core Application)**:
   - Storefront (Hero Carousel, Trust Strip, Quick Search, Kurasi Produk, Testimoni).
   - Katalog Multi-Dimensi (Filter Brand, Kategori, Skor Kondisi, Fitur, Harga IDR).
   - PDP Kamera (Galeri gabungan bodi + sample shots, kondisi terstruktur, kelengkapan, spek).
   - Zustand Persist Cart (tanpa varian, tanpa tier promo).
   - Checkout aman (Server-authoritative, snapshot rekening/QRIS, ongkir dua zona).
   - Invoice & Upload Bukti Bayar ke Object Storage privat (S3/MinIO).
   - Admin Control Plane (Orders, Auto-Cancel `PENDING_PAYMENT` via `/api/cron/auto-cancel`, Stepper Stok dengan Rollback Guard, Telegram Bot).
3. **Milestone 3 (Hardening & Deploy)**:
   - Rate limiter in-memory & dynamic sitemap.
   - Typecheck `tsc --noEmit` EXIT=0.
   - Containerization & Coolify deployment.

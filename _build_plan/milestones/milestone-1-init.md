# Milestone 1: Inisialisasi Proyek, Design System & Skema Database

**Tujuan:** Membangun fondasi Next.js 16 App Router (React 19 + Tailwind CSS v4), mengonfigurasi tema visual **Retro Y2K / Pastel Digicam**, menginstal komponen Shadcn UI, serta mengatur koneksi Drizzle ORM ke PostgreSQL.

---

## 📋 Daftar Tugas & Checklist Eksekusi

### 1. Inisialisasi Project Next.js
- [x] Inisialisasi Next.js 16 di direktori aktif (`vintaagemeew`).
- [x] Konfigurasi `next.config.ts`:
  - Izinkan domain gambar remote (`minio.girlyglimpse.com`, `girlyglimpse.id`).
  - Aktifkan output standalone: `output: "standalone"`.

### 2. Setup Design System & Theme Tokens (Retro Y2K)
- [x] Terapkan CSS tokens dari `_build_plan/blueprints/theme-config.css` ke `app/globals.css` (Tailwind v4 `@theme inline`, utility `.y2k-card`, `.y2k-pill-badge`, dll).
- [x] Konfigurasi font Google Fonts (`Plus_Jakarta_Sans` untuk body & UI di `app/layout.tsx`).
- [x] Install utility pendukung: `clsx`, `tailwind-merge`, `lucide-react`, serta buat `lib/utils.ts` (`cn`, `formatRupiah`).

### 3. Setup Basis Komponen UI
- [x] Setup struktur styling & landing hero test di `app/page.tsx` dengan nuansa Retro Y2K Pastel Digicam.

### 4. Setup Drizzle ORM & PostgreSQL
- [x] Install dependensi ORM: `drizzle-orm`, `pg`, `dotenv`, devDependencies `drizzle-kit`, `@types/pg`, `tsx`.
- [x] Salin dan finalisasi skema ke `db/schema.ts` (11 tabel relasional lengkap: categories, brands, tags, products, productImages, productTags, paymentMethods, orders, orderItems, banners, settings, testimonials).
- [x] Buat file koneksi pool database di `db/index.ts`.
- [x] Buat konfigurasi migrasi di `drizzle.config.ts`.
- [x] Tambahkan skrip npm di `package.json` (`db:generate`, `db:push`, `db:seed`).
- [x] Buat script seeder awal (`db/seed.ts`) yang otomatis membaca data hasil scraping (`data/products.json`, `data/categories.json`, `data/brands.json`, `data/tags.json`) dengan pembersihan grade, tags, dan proteksi PII.

---

## 🎯 Kriteria Penerimaan (Definition of Done)
1. Project dapat berjalan via `npm run dev` tanpa error.
2. Palet warna Retro Y2K Pastel diterapkan dengan benar pada elemen UI.
3. Migrasi Drizzle sukses mengeksekusi pembuatan tabel di database PostgreSQL.
4. Seeder berhasil mengimpor 32 produk kamera digital dari folder `data/`, dengan `condition_grade` terisi dan produk tanpa grade berstatus nonaktif.

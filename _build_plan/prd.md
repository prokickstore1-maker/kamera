# Product Requirement Document (PRD): vintagemeew
## Platform E-Commerce Kurasi Kamera Digital & Vintage (Retro Y2K Aesthetic)

**Versi Dokumen:** 2.0.0  
**Nama Brand:** vintagemeew  
**Status:** Approved & Aligned with [MVP.md](file:///d:/project%20web/kamera%20pung%20lallang/MVP.md)  
**Target Pasar:** Pecinta kamera saku vintage, digicam nostalgia era 2000-an, content creator, dan kolektor.  
**Tech Stack:** Next.js (App Router) + Shadcn UI + Tailwind CSS + Drizzle ORM (PostgreSQL) + Object Storage (S3/MinIO) + Coolify.

---

## 1. Visi Produk & Ringkasan Eksekutif

**vintagemeew** adalah platform e-commerce kurasi kamera digital preloved dan brand new dengan identitas visual **Retro Y2K / Aesthetic Pastel Digicam**. Platform ini menggabungkan pengalaman belanja yang estetik, transparan, dan interaktif dengan keandalan transaksi perbankan lokal (QRIS & Transfer Bank), sistem validasi stok mutlak (*zero race condition*), serta notifikasi admin instan via Telegram Bot.

### Nilai Utama (Key Value Propositions):
1. **Transparansi Kondisi Fisik 100%**: Setiap kamera memiliki skor kondisi bodi terstruktur (`condition_grade` 1–10), catatan minus/defects jujur, daftar kelengkapan aksesoris (*inclusions*), dan galeri foto multi-sudut resolusi tinggi yang mencakup foto bodi dan sample shots hasil jepretan.
2. **Estetika Nostalgia Retro Y2K**: Desain storefront yang memikat dengan warna pastel lembut (soft pink, blush, warm cream) yang selaras dengan tren kultur digicam kekinian.
3. **Pemesanan Mudah & Aman Tanpa Ribet**: Checkout instan tanpa membuat akun, pembayaran QRIS & transfer bank manual, upload bukti bayar aman ke object storage privat, serta pelacakan status mandiri + link resi ekspedisi.
4. **Admin Control Plane Terpadu**: Panel operasional lengkap untuk verifikasi pembayaran, input resi, pengaturan tarif ongkir zona, dan stepper stok real-time dengan proteksi rollback otomatis.

---

## 2. Standar Arsitektur & Tech Stack

| Layer | Teknologi & Tools | Alasan & Standar Implementasi |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router + React 19)** | Server Components untuk kecepatan LCP maksimal, Server Actions untuk mutasi data aman, Turbopack, dan `unstable_cache`. **Next.js 16 punya breaking changes**: `params`, `searchParams`, `cookies()`, dan `headers()` wajib di-`await`. |
| **Styling & UI** | **Tailwind CSS + Shadcn UI** | Desain berbasis token kustom gaya *Retro Y2K Pastel*, komponen aksesibel Radix UI, dan bebas *AI-slop*. |
| **Database** | **PostgreSQL (v15+)** | Integritas transaksi ACID, konkurensi locking baris (`SELECT ... FOR UPDATE`), dan keandalan data relasional. |
| **ORM & Migrasi** | **Drizzle ORM** | Type-safe schema mutlak tanpa overhead memori tinggi, migrasi SQL transparan dan efisien. |
| **Object Storage** | **S3-Compatible (MinIO / Garage / AWS S3)** | Bucket publik untuk foto katalog kamera; Bucket privat berbatas waktu (*presigned URLs*) untuk bukti transfer pembayaran. |
| **State Management** | **Zustand (Persist)** | Keranjang belanja client-side persisten di `localStorage` dengan penanganan hidrasi SSR yang aman tanpa layout shift. |
| **Notifikasi** | **Telegram Bot API** | Dispatcher pesanan dan slip pembayaran ke grup admin toko secara asinkron (*fire-and-forget* non-blocking). |
| **Deployment** | **Coolify (Self-Hosted)** | Deployment otomatis berbasis Git webhook via Nixpacks / Docker Compose container. |

---

## 3. Desain Visual & Design Tokens (Retro Y2K / Pastel Digicam)

### A. Konsep Estetika
- **Vibe**: Nostalgia 2000s, Y2K aesthetic, soft digicam dreamscape, playful yet trustworthy.
- **Mode Tampilan**: **Light Mode First** (default) dengan palet hangat dan lembut yang menonjolkan keaslian warna kamera vintage.
- **Micro-Interactions**: Hover lift halus pada kartu produk, badge status kamera (*Like New, Very Good, Brand New, Wifi*) yang khas, dan border berkontur lembut.

### B. Palet Warna (Color Palette Tokens)

```css
:root {
  /* Primary & Accents (Retro Pastel Rose & Y2K Pink) */
  --color-primary: #ec4899;           /* Vibrant Y2K Rose Pink */
  --color-primary-hover: #db2777;     /* Deep Rose */
  --color-primary-light: #fdf2f8;     /* Soft Blush Background */
  --color-accent-soft: #fbcfe8;       /* Pastel Petal */

  /* Surface & Backgrounds */
  --color-bg-base: #fffbf9;          /* Warm Cream Paper */
  --color-bg-surface: #ffffff;       /* Pure White Card */
  --color-bg-subtle: #fdf4f5;        /* Tinted Pastel Subtle */

  /* Neutral Typography & Borders */
  --color-text-main: #2e1d27;        /* Deep Charcoal Plum */
  --color-text-muted: #7d6b76;       /* Dusty Plum Muted */
  --color-border: #fae1e8;           /* Delicate Pastel Border */
  --color-border-hover: #f472b6;     /* Accent Border Hover */

  /* Semantic Feedback */
  --color-success: #10b981;          /* Emerald Green */
  --color-warning: #f59e0b;          /* Vintage Amber */
  --color-danger: #ef4444;           /* Soft Crimson */

  /* Radii & Shadows */
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;
  --radius-full: 9999px;
  --shadow-card: 0 4px 20px -2px rgba(236, 72, 153, 0.08);
  --shadow-card-hover: 0 10px 25px -4px rgba(236, 72, 153, 0.16);
}
```

### C. Tipografi
- **Primary Body & UI**: `Plus Jakarta Sans` / `Outfit` (bersih, modern, keterbacaan tinggi pada layar mobile).
- **Hero & Branding Accents**: Font kaligrafi halus atau rounded chic untuk tajuk (*e.g., Great Vibes* atau *Cabinet Grotesk*) untuk memberikan sentuhan personal toko kamera.

---

## 4. Rincian Spesifikasi Fitur

### A. Storefront & Customer Experience

#### 1. Beranda (`app/(shop)/page.tsx`)
- **Cinematic Hero Carousel**: Banner promosi dinamis dari tabel `banners`. Slide pertama priority LCP, sisanya lazy.
- **Direct Search Bar**: Pencarian langsung mengarah ke `/products?search=...`.
- **Trust Strip**: Jaminan garansi (100% Tested & Functional, Video Unboxing Friendly, Free Accessories Pack, Amanah Packing Kayu/Bubble Tebal).
- **Brand & Category Quick Filter**: Navigasi cepat ke Canon, Nikon, Sony, Fujifilm, serta kategori *Celebrity's Pick*, *Beginner Friendly*, *Compact*, *Pink Collection*.
- **Section Produk Kurasi**:
  - *Best Sellers*: tag `best-seller`; tidak ada flag `is_best_seller` terpisah.
  - *New Arrivals*: 8 produk terbaru berdasarkan `created_at`.
  - *Featured Cameras*: flag `is_featured` (diimpor dari `featured`).
- **Testimoni**: Section carousel testimoni dari tabel `testimonials` (nama pembeli, rating bintang, screenshot chat).

#### 2. Katalog & Filter Kamera (`app/(shop)/products/page.tsx`)
- **Multi-Dimensional Filter Dinamis** (nilai diturunkan dari database via `DISTINCT`):
  - Filter Brand (`Canon`, `Nikon`, `Sony`, `Fujifilm`).
  - Filter Kategori (`Digital Camera`, `Compact`, `Point & Shoot`, `Luxury`, `Instax`, `Mirrorless`, dll — termasuk sub `Celebrity's Pick`, `Beginner Friendly`, `Canon G7X Dupe`, `Pink Collection`).
  - Filter Kondisi (skor `condition_grade`: `≥9` / `≥7 dan <9` / `<7`, cakup desimal, tanpa celah).
  - Filter Tag Promo (`Wifi`, `Hailey Bieber's`, `Kendall Jenner's`, `Pink`, `Best Seller`, `Fan Fave`, dll — nilai dari `DISTINCT`, bukan hardcode).
  - Filter Rentang Harga (slider min/max IDR).
- **Sorting Fleksibel**: Termurah, Termahal, Terbaru, Unggulan.
- **Paginasi SQL Efisien**: `LIMIT` & `OFFSET` di level database (16 produk per halaman).

#### 3. Halaman Detail Kamera / PDP (`app/(shop)/product/[slug]/page.tsx`)
- **Galeri Foto Multi-Sudut** (satu galeri, urutan `position`):
  - Foto bodi kamera dari berbagai angle (depan, layar belakang, lensa zoom).
  - Sample shots hasil jepretan kamera tersebut, diberi label visual kecil "📷 sample shot" pada thumbnail-nya agar membedakan dari foto bodi.
  - Thumbnail utama ditandai `is_primary`.
- **Spesifikasi Teknis**: Dari array `specifications` (key/value): Sensor (CCD/CMOS megapixel), Lensa (optical zoom + focal length 35mm equivalent), Baterai (tipe + shots per charge).
- **Bobot**: `weight_grams` ditampilkan sebagai info (misal: "125g") — **tidak dipakai untuk hitung ongkir**.
- **Transparansi Kondisi (terstruktur)**:
  - Skor kondisi bodi: badge besar "9/10" dari kolom `condition_grade` (numeric, mendukung desimal).
  - Label otomatis dari skor: `≥9.5` → "Like New", `≥9` → "Excellent", `≥8` → "Very Good", `≥6` → "Good", `<6` → "Used". "Brand New" **tidak** diturunkan dari skor; hanya tampil bila produk bertag `brand-new`.
  - **Minus/Defects**: blok peringatan dari kolom `defects` (text). Jika kosong, tampil centang hijau "No known defects".
  - **Inclusions**: daftar chip dari kolom `inclusions` (jsonb string[]): baterai, memory card, charger, pouch, beaded strap, dll.
  - **Teks deskriptif**: `description` tampil di kartu/bawah judul; `details_raw` tampil di accordion "Detail dari toko".
- **Badge social proof**: teks dari `features[]` (misal "SAKURA LE SSERAFIM'S DIGICAM") ditampilkan di atas judul, ditambah tag promo terhubung (misal "Pink", "Best Seller").
- **Status Stok Real-Time**: Stok integer per produk; mayoritas 1, ada 0 (terjual) dan >1 (unit baru). Tombol beli nonaktif + label "Sold Out" jika `stock = 0`.
- **Add-On Opsional**: **Di luar MVP** — dataset tidak memuat add-on dan belum ada aturan harga/stok/ongkir-nya. Jangan bangun skema add-on sampai katalog nyata tersedia.

#### 4. Keranjang Belanja
- **State Client Zustand Persist**: Tersimpan di `localStorage`, hydration aman tanpa layout shift.
- **Tanpa Varian & Tanpa Tier Promo**: Produk dimasukkan apa adanya (satu produk = satu unit). Tidak ada mekanisme gratis ongkir/diskon otomatis bertingkat.
- **Lazy Cart Drawer**: Drawer keranjang dimuat dynamic import saat hover ikon untuk menjaga bundle awal ringan.
- **Quantity Clamping**: Maksimum per item = stok tersedia. `stock = 0` tidak bisa ditambahkan; tombol "Sold Out".

#### 5. Checkout & Validasi Ketat (`app/(shop)/cart/page.tsx`)
- **Server-Authoritative Calculation**: Harga, subtotal, dan ongkos kirim dihitung ulang mutlak di Server Action. Harga client tidak pernah dipercaya.
- **Metode Pembayaran & Snapshot**:
  - MVP mendukung QRIS dan transfer bank manual. Tidak ada payment gateway, webhook, atau verifikasi otomatis; admin memeriksa dana masuk manual.
  - Admin mengelola metode aktif; minimal satu metode wajib aktif sebelum checkout tersedia.
  - Snapshot metode/rekening/QR yang dipilih disimpan permanen di order agar invoice lama tetap benar.
- **Zonasi Ongkir** (dua zona tetap, bukan berbasis berat):
  - Tepat dua zona: `utama` dan `luar`, satu tarif flat IDR per zona.
  - Admin memetakan provinsi ke zona via daftar centang; provinsi tak terpetakan otomatis `luar`. Provinsi bertanda blokir tidak muncul di pilihan checkout.
  - Ongkir dihitung sekali per order, dihitung ulang di server.
  - `weight_grams` tidak dipakai dalam kalkulasi.
- **Validasi Formulir Ketat**:
  - Nomor WhatsApp: format +62/08.
  - Nama penerima, alamat detail.
  - Kode pos: regex 5 digit angka.
- **Proteksi Idempotency**: Client mengirim UUID per checkout; kolom unik `orders.idempotency_key`. Key sama → order lama dikembalikan, bukan duplikat. Tabel idempotency terpisah tidak dipakai.
- **Rate Limit Checkout**: Maks. 10 request per 15 menit per IP.

#### 6. Invoice Pelanggan & Lacak Pesanan (`app/(shop)/invoice/[orderId]/page.tsx` & `/track-order`)
- **Invoice Pelanggan**: URL memakai UUID order (`/invoice/[orderId]`). Hanya menampilkan nomor pesanan, item, ongkir, total, metode bayar, dan WhatsApp penjual; nama penerima disamarkan dan alamat lengkap tidak ditampilkan. `noindex`.
- **Upload Bukti Bayar**:
  - File picker gambar JPG/PNG/WEBP, **maksimal 1 MB**, dicek ulang di server.
  - Validasi magic bytes (`FFD8FF` / `89504E47` / `RIFF....WEBP`); nama file digenerate server, nama asli client tidak dipakai.
  - Disimpan langsung ke Object Storage privat (`proofs/`).
  - **Fail-Closed Guard**: Error ramah jika storage tidak terjangkau — tidak menyimpan base64 ke database.
- **Lacak Pesanan Mandiri**: Wajib cocok Nomor Pesanan **dan** Nomor HP. Link resi mengarah ke tracking ekspedisi.
- **Rate Limit Lacak**: Maks. 15 request per 15 menit per IP.

#### 7. Halaman Informasi & Legal
- `/specifications`: Spesifikasi teknis standar digicam (CCD vs CMOS, optical zoom, baterai, dll).
- `/returns`: Prosedur garansi, klaim retur, syarat video unboxing.
- `/privacy`: Kebijakan privasi perlindungan data pelanggan.
- `/terms`: Syarat dan ketentuan transaksi toko.

---

### B. Admin Control Plane (`app/admin/`)

#### 1. Keamanan & Autentikasi Admin
- Satu akun admin dengan username tetap `admin`; password dari `ADMIN_PASSWORD_HASH` (bcrypt). Tidak ada tabel user admin.
- Cookie sesi HTTP-Only, HMAC-SHA256 dengan `ADMIN_SESSION_SECRET` min. 32 karakter, masa berlaku 24 jam. Tanpa Iron Session atau library sesi tambahan.
- Rate limiting: maks. 5 percobaan login gagal per 15 menit per IP.

#### 2. Dashboard Ringkasan
- Kartu metrik: Pesanan Perlu Diproses, Pesanan Dikirim, Kamera Stok Tipis, Total Omzet `COMPLETED`.
- Tabel 5 pesanan terbaru + tombol instan "Hubungi via WhatsApp".

#### 3. Manajemen Pesanan (Orders)
- Filter Tab Status: `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`.
- **Auto-Cancel Otomatis**: Order `PENDING_PAYMENT` **tanpa bukti bayar** yang melewati batas waktu (default 2 jam, diatur di settings) otomatis diubah ke `CANCELLED` dan stok kembalikan. Order berbukti tetap pending sampai verifikasi manual. Pemicu: `GET /api/cron/auto-cancel` (header `Bearer $CRON_SECRET`) dipanggil Coolify Scheduled Task tiap 15 menit; fallback, route dipanggil (non-blocking) saat admin membuka daftar order. Restock idempoten via kolom `stock_restored_at`.
- Aksi Admin & Transisi Status (tegas, tidak ada transisi lain):
  - **Confirm Paid**: `PENDING_PAYMENT` → `PROCESSING` setelah dana masuk diverifikasi manual.
  - **Input Resi**: `PROCESSING` → `SHIPPED` (kurir + nomor resi wajib).
  - **Mark Completed**: `SHIPPED` → `COMPLETED`.
  - **Cancel Order**: `PENDING_PAYMENT`/`PROCESSING` → `CANCELLED` + restock atomik idempoten. Order `SHIPPED`/`COMPLETED` tidak bisa dibatalkan.
  - **Lihat Bukti Bayar**: Modal slip transfer via presigned URL (15 menit aktif).
  - **Catatan Internal**: `internal_notes`, tidak terlihat pembeli.

#### 4. Manajemen Kamera & Stok
- **Katalog CRUD**:
  - Input/edit: nama, brand, kategori, harga (IDR), deskripsi, spesifikasi (key/value array), kondisi (grade/defects/inclusions), berat (gram, opsional), upload multi-foto ke bucket publik.
  - Toggle badge: Featured (flag), tag promo (termasuk Best Seller, Wifi, Pink). New Arrival dihitung dari `created_at`, bukan flag.
- **Stepper Stok Real-Time**:
  - Tombol `+` / `-` untuk atur stok.
  - **Rollback Guard**: Jika mutasi gagal (koneksi putus), UI rollback ke angka asli + toast error.

#### 5. Pengaturan Toko & Telegram Bot
- Pengaturan nomor WhatsApp admin, teks banner berjalan (marquee notice).
- **Tarif ongkir dua zona** (`utama` / `luar`) + pemetaan provinsi + daftar provinsi diblokir.
- **Batas waktu auto-cancel** `PENDING_PAYMENT` (jam).
- CRUD Rekening bank & poster QRIS.
- CRUD Banner hero carousel (upload gambar, judul, CTA, urutan).
- CRUD Testimoni (nama, rating, screenshot chat).
- Integrasi Bot Telegram: notifikasi order baru + slip pembayaran dikirim ke grup.

---

## 5. Skema Basis Data (Drizzle ORM)

```
[categories] ──< [products] ──< [product_images]
[brands]     ──< [products] ──< [order_items] >── [orders]
[tags]       ──< [product_tags] >── [products]
[banners]
[payment_methods]
[settings]
[testimonials]
```

### Entitas Utama:
1. **`products`**:
   - `name`, `slug`, `description`, `price_idr` (IDR saja, USD diabaikan).
   - `condition_grade` numeric(3,1) — hanya dari hasil inspeksi admin atau pola `N/10 body condition` pada teks sumber. Label tag (`Brand New`, `Like New`, `Very Good`, `Good`, `Used`) **bukan** skor. `null` = draft, produk tidak aktif.
   - `defects` (text nullable), `inclusions` (jsonb string[]), `details_raw` (text arsip), `features` (jsonb string[] — teks badge tampil saja, bukan facet), `specifications` (jsonb), `weight_grams` (info tampil saja).
   - `stock` mengikuti `products[].stock`; `locations[].stock` dan `stock_reserved` diabaikan.
   - Facet filter badge bersumber dari tag kind `promo` via `tags` + `product_tags`; `is_featured` dari kolom `featured`. Tidak ada flag `is_best_seller` atau `is_new`. Saat seeding, tag kind `condition` non-label (`Wifi`) diubah ke kind `promo`; tag generik (`Like New`, `Very Good`, `Good`, `Used`) dibuang karena duplikat `condition_grade`, kecuali **`Brand New`** dipertahankan sebagai tag promo — satu-satunya sumber label "baru".
   - Foto seeding memakai URL remote dari dataset; domain remote terdaftar di `images.remotePatterns`. `data/images/` disimpan lokal, tidak wajib diunggah ulang di MVP.
   - Jangan aktifkan produk yang tidak punya `price_idr`, foto utama, atau `condition_grade`.
2. **`product_images`**: `product_id`, `url`, `kind` (`body` | `sample`), `position` (int), `is_primary` (bool). Dataset awal tidak menandai sample shots dan semua `position` bernilai 0 — admin wajib menata urutan dan menandai `kind` sebelum produk dipublikasikan.
3. **`orders`**: nomor pesanan tampil (`VMW-YYYYMMDD-NNN`) + `id` UUID untuk URL invoice, identitas pembeli, subtotal, ongkir, total, snapshot metode bayar, bukti bayar URL, kurir + resi, `status` (varchar, nilai: `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`), `expires_at` (auto-cancel), `stock_restored_at` (idempotensi restock), `internal_notes`.
4. **`order_items`**: snapshot harga + nama kamera saat transaksi.
5. **`banners`**: hero carousel (url gambar, title, cta_label, cta_href, sort_order, is_active).
6. **`payment_methods`**: nama bank/QRIS, nomor rekening, nama pemilik, QR image URL.
7. **`settings`**: key-value — tarif dua zona, daftar provinsi per zona/blokir, auto-cancel timeout, WA admin, Telegram chat ID, running text.
8. **`testimonials`**: nama pembeli, rating (1–5), text, screenshot URL.
9. **`brands`**, **`categories`** (hierarchical, `parent_id`), **`tags`** (kind: `condition` | `promo`).

---

## 6. Target Kualitas & Non-Functional Requirements

1. **Kecepatan & Performa**:
   - Google PageSpeed score ≥ 90 mobile storefront.
   - Core Web Vitals: LCP < 2.0s, CLS < 0.05, FID < 100ms.
2. **Integritas Transaksi (ACID)**:
   - Pembelian dibungkus PostgreSQL Transaction + `SELECT ... FOR UPDATE` untuk mencegah overselling unit tunggal.
3. **Keamanan & Privasi**:
   - Bukti bayar: bucket privat, presigned URL aktif 15 menit.
   - Sanitasi input form pelanggan (XSS, SQL Injection).
   - `robots.ts` blokir `/admin/`, `/invoice/`, `/cart/`, `/api/`.
   - HTTP security headers + cache immutable 1 tahun untuk aset statis.
4. **Resiliensi**:
   - Notifikasi Telegram async, tidak memblokir checkout.
   - Cache Next.js (`unstable_cache`) dengan tag: `settings`, `banners`, `testimonials`, `payment-methods`. Invalidasi dari Server Action admin: `updateTag(tag)` (instan, read-your-writes) untuk settings/banner/rekening; `revalidateTag(tag, 'max')` untuk katalog yang boleh telat. `revalidateTag` tanpa argumen kedua = error TS di Next 16.
   - Sitemap dinamis dengan try/catch — jika DB down, tetap return halaman utama tanpa HTTP 500.

---

## 7. Rencana Milestone

- **Milestone 1**: Inisialisasi Next.js App Router + Design Tokens Retro Y2K + Setup Drizzle PostgreSQL + Seeder dari `data/products.json` (IDR saja; abaikan `shipping_rates.json` dan `locations.json` yang berisi tarif internasional serta data pribadi).
- **Milestone 2**: Storefront (Home, Katalog, PDP, Keranjang, Checkout, Invoice, Track Order) + Admin Control Plane (Dashboard, Orders, Products, Settings, Telegram Bot) + S3/MinIO dual bucket + Auto-Cancel Scheduler.
- **Milestone 3**: Hardening (SEO sitemap/robots, rate limiting, security headers, caching) + Typecheck `tsc --noEmit` EXIT=0 + Containerization & Coolify deployment.

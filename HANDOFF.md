# HANDOFF.md - Status Estafet Sesi & Guardrails

Dokumen ini memuat status serah terima antar sesi pengerjaan AI agent serta batasan (*guardrails*) bagian yang dilarang diutak-atik.

---

## 🚦 Status Estafet Sesi

- **Fase Saat Ini**: Milestone 3 — **SELURUH BUG AUDIT (`TASK.md`), UI/UX (`TASK_UI_UX.md`), DAN HARDENING MILESTONE 3 SELESAI**.
- **Kondisi Repository**:
  - Proyek Next.js 16.4.3 (App Router + React 19.3 + Turbopack + Tailwind v4) aktif di root workspace.
  - Skema Drizzle (`db/schema.ts`) sudah sinkron dengan DB fisik via `drizzle-kit push`.
  - Database lokal: **Embedded PostgreSQL** aktif di port `5432` (`npm run db:start`) di `./.pgdata` (UTF-8 locale C).
  - Data seeding: 32 produk kamera, 94 gambar, 8 kategori standar industri, 12 brands, tags, testimonials, payment methods (`VINTAGEMEEW KEDIRI`), dan settings telah masuk ke database.
  - **Hardening Backend, Keamanan & Milestone 3 ([TASK.md](file:///d:/project%20web/kamera%20pung%20lallang/TASK.md)) Selesai**:
    - Alias variabel env S3 & ekstraksi key objek deterministik (`lib/s3.ts`).
    - Autentikasi admin pada `proofUrl()`, validasi klaim `role === "admin"` & penolakan fallback secret di production (`lib/admin-session.ts`).
    - Pemisahan `cancelExpiredOrders()` ke modul server-only (`lib/orders.ts`) dengan pengecekan ulang `PENDING_PAYMENT` di dalam transaksi, rate limit `uploadProof()`, prioritas `x-real-ip` di `clientIp()`, dan verifikasi `CRON_SECRET` sebelum rate limit di `/api/cron/auto-cancel`.
    - Penggabungan `productId` kembar (`mergeItems()`), advisory lock `pg_advisory_xact_lock` untuk penomoran `orderNumber`, pengecekan `idempotencyKey` sebelum rate limit checkout, perbaikan `FormData` Telegram, serta sinkronisasi stok keranjang (`cartStock()`).
    - SEO & Deployment: `app/sitemap.ts`, `app/robots.ts`, `app/api/health/route.ts`, HTTP security headers di `next.config.ts`, `Dockerfile`, dan `.dockerignore` siap untuk Coolify.
  - **Pembersihan AI Slop & Responsivitas Mobile Selesai**:
    - Bar statistik gelap norak ("20jt UNIT TERMAHAL") dihapus.
    - Tombol kotak kaku mengambang dihapus.
    - Tag scraping selebritas/buzzword di filter katalog `/products` disaring ketat.
    - Badge ganda pada PDP (`[BEGINNER FRIENDLY]`) telah dideduplikasi.
    - Hero CTA difokuskan 100% pada belanja (`Lihat Katalog (31 Unit) →`); "Lacak Pesanan" dikembalikan ke utility header/footer semantik.
    - Bilah filter merek scroll/swipe horizontal sticky di bawah Hero 100% murni khusus merek (chip non-merek seperti Pink Cameras, Beginner Friendly, dan harga sudah dibersihkan total).
    - **Card Produk Sold Out Tanpa Overlap**: Komponen `components/product-card.tsx` diatur agar produk habis (`stock <= 0`) hanya menampilkan badge `Sold Out` saja secara tunggal, menghilangkan tabrakan dengan badge nilai kondisi fisik di layar ponsel.
    - **Admin Panel Sidebar Architecture**: Desktop menggunakan Sidebar permanen (lebar 256px) di sebelah kiri lengkap dengan branding, indikator status, menu ikon aktif, dan navigasi terpadu (`Dashboard`, `Kelola Pesanan`, `Inventaris Produk`, `Kelola Merek`, `Upload Kamera Baru`, `Pengaturan Toko`). Di layar ponsel/tablet, topbar dilengkapi tombol hamburger `[ ☰ ]` yang memunculkan drawer sliding sidebar (Shadcn Sheet) dari kiri dengan animasi mulus dan ramah sentuhan jempol. Seluruh tombol menu berada dalam hierarki yang harmonis tanpa tombol ganjil yang mengambang terpisah. Halaman Pesanan (`/admin/orders`) dan Produk (`/admin/products`) otomatis reflow menjadi Card View yang lebar tanpa tabel yang terpotong.
    - **Halaman Khusus Kelola Merek (`/admin/brands`)**: Menyediakan dashboard mandiri untuk melihat seluruh merek terdaftar, jumlah kamera per merek, input merek baru secara instan (`createBrandAction`), pencarian realtime, dan proteksi hapus merek (`deleteBrandAction`).
    - **Fitur Upload & Kurasi Kamera Baru Dinamis Selesai**: Halaman `/admin/products/new` beserta form upload multi-foto (bodi & sample shots), kurasi minus fisik jujur, kelengkapan chip interaktif, brand/category select dengan fitur **`+ Tambah Brand Baru`** dan **`+ Tambah Kategori Baru`** on-the-fly, serta checkbox penanda **`🔥 Most Wanted`** dan **`⭐ Kamera Unggulan`**. Server action `createProductAction` otomatis memasukkan merek baru ke DB, menghubungkan tag `best-seller`, dan memicu invalidasi cache `updateTag("products")`.
    - **Ekosistem Merek Dinamis 100%**: Beranda (`app/page.tsx`), sidebar filter katalog (`/products`), PDP, dan bilah navigasi customer storefront (`shop-shell.tsx`) otomatis sinkron menampilkan semua brand yang memiliki produk aktif di database. Database telah dilengkapi merek digicam populer (Olympus, Panasonic Lumix, Casio, Kodak, Ricoh, Samsung, Leica, Pentax, Canon, Nikon, Sony, Fujifilm). Daftar produk admin (`/admin/products`) kini menampilkan badge visual `🔥 Most Wanted` dan `⭐ Unggulan`.
    - **Pembersihan Total Kategori & Halaman Kelola Kategori (`/admin/categories`)**: Seluruh data kategori dummy hasil scraping yang rancu (*Canon G7X*, *Canon G7X Dupe*, *Pink Collection*, *Celebrity's Pick*, *Beginner Friendly*) telah dibersihkan. Digantikan dengan 8 kategori kamera standar industri (*Digital Pocket / Digicam*, *Point & Shoot*, *Mirrorless*, *DSLR*, *Film / Analog Camera*, *Camcorder / Handycam*, *Instax / Instant Camera*, *Aksesoris & Lensa*). Seluruh 32 unit produk di database direlokasikan ke kategori yang sesuai. Form upload kamera kini cerdas memilih default *Digital Pocket / Digicam*. Halaman mandiri `/admin/categories` dengan pencarian realtime, camera counter, proteksi hapus, dan integrasi navigasi sidebar (`FolderTree`) telah aktif.
    - **Header Editorial Bebas Tabrakan (Zero Collision)**: Memperbaiki tata letak header storefront desktop di `components/shop-shell.tsx` yang sebelumnya menumpuk logo di atas deretan navigasi merek. Logo kini tertata rapi di sebelah kiri desktop (tetap simetris di tengah pada mobile), deretan menu navigasi mengalir bebas di tengah, dan tombol aksi di kanan.
    - **Identitas Lokasi Toko Resmi**: Lokasi operasional & pengiriman toko disesuaikan secara konsisten menjadi **Pare, Kediri, Jawa Timur** di Hero Beranda, Footer Storefront, Pengaturan Database (`settings`), dan Metadata SEO.
    - **Perbaikan Menyeluruh UI/UX, Styling Y2K & Anti-Slop ([TASK_UI_UX.md](file:///d:/project%20web/kamera%20pung%20lallang/TASK_UI_UX.md))**: Seluruh 37 poin (`UX-01`..`UX-23`, `STYLE-01`..`STYLE-07`, `SLOP-01`..`SLOP-07`) telah diterapkan di `app/**` dan `components/**`, mencakup fitur pencarian di header & katalog, announcement bar dinamis, `.camera-viewfinder-frame`, `.scrollbar-none`, font aksen `Playfair Display`, halaman `app/not-found.tsx`, tombol salin rekening/resi (`components/copy-button.tsx`), aksi cepat produk admin (`components/product-row-actions.tsx`), serta pembersihan penuh em-dash, emoji dekoratif, dan klaim tidak akurat.
    - **CRUD Admin Lengkap (Edit Produk, Kelola Banner & Kelola Testimoni)**:
      - `/admin/products/[id]/edit` (`app/admin/products/[id]/edit/page.tsx` + `updateProductAction`) untuk mengedit kamera yang sudah di-upload beserta tombol cepat `<Pencil>` di tabel produk.
      - `/admin/banners` (`app/admin/banners/page.tsx` + `components/banners-manager.tsx`) untuk upload gambar banner baru, edit judul/subjudul/CTA/urutan slide dalam modal `<Dialog>`, toggle aktif/nonaktif, dan hapus banner.
      - `/admin/testimonials` (`app/admin/testimonials/page.tsx` + `components/testimonials-manager.tsx`) untuk upload foto testimoni, pilih rating bintang (`1–5`), nama pembeli, dan ulasan yang tampil sebagai carousel geser kiri-kanan (`components/testimonials-section.tsx`) di antara detail produk & footer serta di beranda.
- **Status Build & Typecheck**: **100% HIJAU & LOLOS VERIFIKASI**:
  - `npx vitest run`: 33/33 tests PASS (5 suites) ✅
  - `npx tsc --noEmit`: EXIT=0 ✅
  - `npm run lint`: EXIT=0 (0 errors, 0 warnings) ✅
  - `npm run build`: Turbopack standalone compile 17 routes EXIT=0 ✅
- **Tugas Siap Eksekusi**: **UJI AUTO-CANCEL CRON & MILESTONE 3 (COOLIFY DEPLOYMENT: DOCKERFILE, NGINX/HEALTHCHECK, SITEMAP)**.

---

## 🛡️ Guardrails (Bagian Terlarang Diutak-Atik / Wajib Dipatuhi)

1. **Integritas Transaksi ACID Stok Kamera**:
   - Pembuatan pesanan **WAJIB** dibungkus transaksi PostgreSQL dengan `SELECT ... FOR UPDATE` row locking.
   - Dilarang mengubah alur ini menjadi pengecekan stok terpisah di luar transaksi database.
2. **Restock Otomatis pada Pembatalan**:
   - Logika pembatalan pesanan di Admin (`CANCELLED`) wajib mengembalikan kuantitas stok produk ke database secara otomatis.
   - **Auto-cancel**: Order `PENDING_PAYMENT` tanpa bukti bayar yang melewati `expires_at` wajib diubah ke `CANCELLED` dan stok dikembalikan dalam transaksi atomik. Pemicu `GET /api/cron/auto-cancel` (header `Bearer $CRON_SECRET`).
   - **Idempotensi wajib**: restock hanya jalan saat `stock_restored_at IS NULL` lalu kolom diisi dalam transaksi sama. Pembatalan manual setelah auto-cancel tidak boleh merestok dua kali.
   - Stok = 1 unit per kamera. Setiap restock ganda langsung merusak data.
   - Transisi status dibatasi: `PENDING_PAYMENT` → `PROCESSING` → `SHIPPED` → `COMPLETED`, atau → `CANCELLED` (dari `PENDING_PAYMENT`/`PROCESSING`). Order `SHIPPED`/`COMPLETED` tidak bisa dibatalkan otomatis.
3. **Pemisahan Object Storage Publik vs Privat**:
   - Foto katalog produk & banner berada di bucket publik (`public-read`).
   - Bukti bayar transfer pelanggan (`proofs/`) **WAJIB** berada di bucket privat dan hanya diakses melalui presigned URL berwaktu. Dilarang mengubahnya menjadi public bucket.
4. **Server-Authoritative Validation**:
   - Harga (IDR) dan stok mutlak dihitung ulang di Server Actions. Tidak boleh ada mutasi harga yang mempercayai payload client. Tidak ada diskon promo bertingkat.
5. **Payment Snapshot Immutability**:
   - Data rekening/QRIS yang tersimpan di kolom `payment_snapshot` pada baris order tidak boleh di-overwrite saat admin mengedit data master rekening.
6. **Izin Operasi Ketat**:
   - Dilarang menjalankan `git commit`, `git push`, atau migrasi database tanpa izin eksplisit dari user.
7. **Single Replica**:
   - Rate limiter in-memory dan lock auto-cancel hanya benar di satu instance. Jangan naikkan replica Coolify tanpa memindahkan limiter ke Redis.
7. **Data Pribadi (PII) pada Dataset**:
   - `data/locations.json` berisi nama, nomor HP, email, dan alamat lengkap orang asli. File ini **dilarang** di-commit, di-seed ke database, atau ditampilkan di UI mana pun.
   - `data/products.json` menyimpan salinan `locations` per produk. Seeder wajib mengabaikannya; jangan pernah memetakan field itu ke tabel.
   - `products.csv` hanya untuk inspeksi internal, bukan artefak publik.

---

## 📦 File Milestone 2 yang Ditulis (Belum Diverifikasi)

- `lib/`: `catalog.ts` (query katalog+facets+home), `checkout.ts` (totalling murni), `condition.ts`, `shipping.ts`, `validation.ts`, `format.ts`, `geo.ts` (38 provinsi), `cart.ts` (store native, tanpa Zustand), `rate-limit.ts` (in-memory), `admin-session.ts` (HMAC cookie, tanpa library), `admin-actions.ts` (login/logout, transisi order, resi, stepper stok), `admin-settings-actions.ts`, `actions.ts` (createOrder ACID+idempoten, uploadProof, proofUrl presigned 15 mnt, telegram fire-and-forget, cancelExpiredOrders).
- `components/`: `shop-shell.tsx`, `product-card.tsx`, `product-gallery.tsx`, `add-to-cart.tsx`, `cart-view.tsx`, `checkout-form.tsx`, `proof-upload.tsx`, `login-form.tsx`, `order-actions.tsx`, `set-note.tsx`, `settings-form.tsx`, `stock-stepper.tsx`.
- `app/`: `page.tsx` (home DB-driven), `products/`, `product/[slug]/`, `cart/`, `checkout/`, `invoice/[orderId]/`, `track-order/`, `admin/{login,orders,orders/[id],products,settings}/`, `api/cron/auto-cancel/`, `returns|privacy|terms|specifications/`, `globals.css` (+marquee), `layout.tsx` (ShopShell; sembunyikan chrome di `/admin`).
- `lib/*.test.ts` (5 file vitest): condition, shipping, validation, checkout, cart.
- `package.json`: tambah `vitest`, `bcryptjs`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, script `test`.

---

## 🚫 Pekerjaan Saat Ini (Uji Coba Runtime Lokal)
 
1. **Verifikasi Teknis**:
   - `npm install` ✅ Selesai
   - `npx vitest run` ✅ 33/33 tests PASS
   - `npx tsc --noEmit` ✅ EXIT=0
   - `npm run lint` ✅ EXIT=0
   - `npm run build` ✅ EXIT=0 (Turbopack standalone 17 routes)
2. **Koneksi Database & Lingkungan (.env.local)**:
   - File template referensi `.env.example` sudah dibuat.
   - Perlu database PostgreSQL aktif (lokal di port 5432, Docker, atau Cloud seperti Neon/Supabase).
3. **DB Migration & Seeding (Wajib Izin User)**:
   - Jalankan `npm run db:push` untuk membuat/memperbarui tabel Drizzle.
   - Jalankan `npm run db:seed` untuk mengisi 32 produk kamera, 94 gambar, tags promo, categories, brands, settings, dan payment methods.
4. **Uji Runtime**:
   - Jalankan `npm run dev` (`http://localhost:3000`).
   - Uji alur storefront: Katalog → Filter → PDP Galeri + Detail Kondisi → Cart → Checkout ACID → Invoice → Upload Bukti → Admin Login → Verifikasi Pesanan & Resi → Cron auto-cancel.
5. **Belum disentuh (scope berikutnya)**:
   - CRUD produk penuh di admin (baru daftar + stepper stok), upload foto produk ke bucket publik, Shadcn UI terpasang, sitemap/robots/rate-limit HTTP header (Milestone 3), scheduler Coolify Scheduled Task, git init.
10. **Ledger sesi**: `.superpowers/sdd/milestone-2-core/progress.md` — catat ruling yang dipakai (shadcn ditunda, Zustand diganti store native, tanpa route group `(shop)`). Baca sebelum mengubah keputusan itu.

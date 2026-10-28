# Blueprint & Spesifikasi Fitur MVP E-Commerce Fullstack (Next.js App Router)

Dokumen ini adalah acuan standar (*master blueprint*) untuk membangun platform e-commerce siap pakai (*production-grade MVP*). Versi ini sudah diselaraskan dengan kebutuhan spesifik **vintaagemeew** (kurasi kamera digital vintage / digicam preloved) dan menjadi rujukan wajib bagi `_build_plan/prd.md`.

---

## 1. Arsitektur Storefront (Customer Facing)

### A. Beranda (`app/(shop)/page.tsx`)
- **Cinematic Hero Carousel**:
  - Banner dinamis diambil dari tabel database (`banners`).
  - Slide pertama dialokasikan untuk penawaran unggulan (*Featured Collections*), slide berikutnya berotasi otomatis.
  - Optimasi LCP: gambar slide pertama menggunakan `priority`, slide selanjutnya `loading="lazy"`.
- **Direct Search Bar**:
  - Kolom pencarian langsung di homepage yang mengarahkan parameter pencarian ke halaman katalog (`/products?search=...`).
- **Trust Strip / Value Proposition**:
  - Banner garansi benefit belanja (contoh: 100% Tested & Functional, Video Unboxing Friendly, Free Accessories Pack, Amanah Packing Kayu/Bubble Tebal).
- **Brand / Kategori Populer**:
  - Grid ikon/logo kategori utama atau brand pilihan untuk navigasi instan.
- **Section Produk Kurasi**:
  - *Best Sellers*: produk dengan tag `best-seller` (tag satu-satunya sumber badge; tidak ada flag terpisah).
  - *New Arrivals*: 8 produk terbaru berdasarkan `created_at` (tidak ada flag maupun badge "NEW" manual).
  - *Featured*: produk dengan flag `is_featured` (hasil impor kolom `featured`).
- **Section Testimoni**:
  - Carousel testimoni pembeli dari tabel `testimonials` (nama, rating bintang, screenshot chat).

---

### B. Katalog & Filter Produk (`app/(shop)/products/page.tsx`)
- **Multi-Dimensional Filter**:
  - Filter kategori, brand, **skor kondisi** (`condition_grade`: `≥9` / `≥7 dan <9` / `<7`, sehingga desimal seperti 8.5 tidak jatuh ke celah), tag promo (`Pink`, `Best Seller`, `Wifi`, dll), rentang harga (min/max IDR), dan kata kunci pencarian.
  - **Opsi Filter Dinamis**: Nilai filter diturunkan otomatis dari data database yang ada (`DISTINCT`), bukan di-hardcode. Hanya tag kind `promo` yang jadi facet; `features[]` tidak.
  - Saat seeding, tag kind `condition` yang bukan label kondisi (mis. `Wifi`) diubah menjadi kind `promo`; sisanya (`Brand New`, `Like New`, `Very Good`, `Good`, `Used`) dibuang karena duplikat `condition_grade`.
- **Sorting Fleksibel**:
  - Urutan: Unggulan (*Featured*), Termurah (*Price Low to High*), Termahal (*Price High to Low*), dan Terbaru (*Newest*).
- **Paginasi Efisien di Level Database**:
  - Paginasi diproses langsung di level kueri SQL (`LIMIT` dan `OFFSET`).
  - Standar: 16 produk per halaman.

---

### C. Halaman Detail Produk / PDP (`app/(shop)/product/[slug]/page.tsx`)
- **Galeri Foto Multi-Sudut (satu galeri)**:
  - Foto bodi kamera dari berbagai angle + sample shots hasil jepretan dalam satu galeri berurutan (`position`).
  - Thumbnail ditandai label kecil "📷 sample shot" untuk foto hasil jepretan agar pembeli membedakan dari foto bodi.
  - Foto utama ditandai `is_primary`.
- **Transparansi Kondisi Terstruktur**:
  - **Skor kondisi bodi**: `condition_grade` (numeric, bisa desimal: 8.5, 9.5) ditampilkan sebagai badge besar, misal "9/10".
  - **Label kondisi otomatis** dari skor: `≥9.5` → Like New, `≥9` → Excellent, `≥8` → Very Good, `≥6` → Good, `<6` → Used. Label **"Brand New" tidak pernah diturunkan dari skor** — hanya tampil jika produk punya tag `brand-new` (unit sealed/baru), supaya kamera preloved 9.5 tidak diklaim baru. Sebaran dataset saat ini 8.0–10.0.
  - **Minus/Defects**: kolom `defects` (text). Jika kosong, tampil "No known defects".
  - **Inclusions**: daftar chip aksesoris dari kolom `inclusions` (array teks): baterai, memory card, charger, pouch, beaded strap, dll.
  - **Deskripsi**: `description` (1–2 baris, tampil di kartu & bawah judul) dan `details_raw` (teks asli scrape, tampil di accordion "Detail dari toko").
- **Spesifikasi Teknis**:
  - Kolom `specifications` (jsonb array `{key, value}`) — Sensor CCD/CMOS megapixel, Lensa (optical zoom + focal length 35mm equivalent), Baterai (tipe + shots per charge).
- **Bobot Kamera**:
  - `weight_grams` hanya ditampilkan sebagai info (misal "125g"). **Tidak dipakai untuk kalkulasi ongkir.**
- **Badge Social Proof**:
  - Dua sumber, peran tegas: `features[]` = teks badge bebas dari dataset (contoh "SAKURA LE SSERAFIM'S DIGICAM", "16.79 MEGAPIXELS") — **tampil saja, tidak bisa difilter**; `tags` kind `promo` = facet filter + badge (contoh "Pink", "Best Seller"). Tag kind `condition` tidak dirender; label kondisi selalu diturunkan dari `condition_grade`.
- **Stok Real-Time**:
  - Stok integer per produk. Sebagian besar preloved stok 1, tetapi data juga memuat stok 0 (sold) dan unit brand-new dengan stok >1. Tombol "Beli Sekarang" dinonaktifkan + label "Sold Out" jika `stock = 0`.
- **Add-On Opsional**:
  - **Di luar MVP.** Dataset tidak memuat add-on, dan tidak ada keputusan operasional (harga, stok, dampak ongkir). Jangan bangun tabel/kolom khusus add-on sampai katalog add-on nyata tersedia.

---

### D. Keranjang Belanja
- **State Keranjang Client (Zustand Persist)**:
  - Keranjang disimpan di `localStorage` dengan penanganan hidrasi SSR yang aman tanpa *layout shift*.
- **Tanpa Varian Produk**:
  - Satu produk = satu unit kamera. Tidak ada pemilih ukuran/warna.
  - *Quantity clamping*: maksimum per item = stok tersedia (umumnya 1 unit preloved).
  - Produk `stock = 0` tidak bisa ditambahkan; tombol nonaktif dengan label "Sold Out".
- **Tanpa Tier Promo Otomatis**:
  - Tidak ada mekanisme gratis ongkir/diskon akumulatif bertingkat.
- **Lazy Cart Drawer**:
  - Drawer keranjang dipisahkan menggunakan dynamic import (`next/dynamic` dengan `ssr: false` dan lazy mount guard).
  - Prefetch bundle otomatis saat kursor user mendekat (*hover*) ke ikon keranjang.

---

### E. Checkout Aman & Validasi Ketat (`app/(shop)/cart/page.tsx`)
- **Server-Authoritative Validation**:
  - Seluruh harga, nama produk, ketersediaan stok, dan ongkos kirim dihitung ulang secara mutlak di Server Action. Harga dari client tidak pernah dipercaya mentah-mentah.
- **Metode Pembayaran**:
  - Admin mengaktifkan QRIS atau transfer bank manual melalui pengaturan. MVP hanya mencatat bukti transfer; tidak ada payment gateway, webhook, atau verifikasi pembayaran otomatis.
  - Metode aktif wajib ada sebelum checkout dibuka; snapshot rekening/QR yang dipilih disimpan permanen di order.
- **Zonasi Pengiriman (Dua Zona Tetap)**:
  - Tepat dua zona: `utama` dan `luar`, masing-masing satu tarif flat (IDR) diatur admin.
  - Admin memetakan provinsi ke salah satu zona lewat daftar centang; provinsi yang tidak dipetakan otomatis masuk `luar`. Provinsi yang ditandai blokir tidak bisa dipilih saat checkout.
  - `weight_grams` **tidak** dipakai untuk kalkulasi ongkir.
  - Ongkir dihitung sekali per order (bukan per item), dihitung ulang di server.
- **Validasi Alamat Ketat**:
  - Validasi regex kode pos (5 digit angka standar nasional).
  - Pembatasan panjang karakter alamat lengkap untuk mencegah teks terpotong di label kurir pengiriman.
  - Validasi nomor WhatsApp format +62/08.
- **Proteksi Idempotency**:
  - Client mengirim UUID `idempotency_key` per percobaan checkout. Server menyimpan di kolom unik `orders.idempotency_key`; request ulang dengan key sama mengembalikan order yang sudah ada, bukan membuat baru.
  - Key kedaluwarsa bersama order-nya; tidak ada tabel idempotency terpisah. Key tidak dikirim ulang setelah order berhasil dibuat.

---

### F. Invoice Pelanggan & Lacak Pesanan (`app/(shop)/invoice/[orderId]/page.tsx`)
- **Invoice Pelanggan**:
  - URL memakai UUID order (`/invoice/[orderId]`), sehingga tidak bisa ditebak dari nomor urut.
  - Halaman invoice hanya menampilkan: nomor pesanan, item, ongkir, total, metode bayar, dan nomor WhatsApp penjual. Nama penerima disamarkan (`Budi S.`), alamat lengkap **tidak** ditampilkan — alamat lengkap hanya ada di admin.
  - Halaman diberi `noindex`.
- **Upload Bukti Pembayaran**:
  - Fitur upload foto slip transfer pelanggan (**maks. 1 MB**, JPG/PNG/WEBP).
  - Validasi server: ekstensi **dan** magic bytes (`FFD8FF`/`89504E47`/`RIFF....WEBP`); ukuran 1 MB dicek ulang; nama file digenerate server (`proofs/{orderId}-{timestamp}.{ext}`), nama asli client tidak dipakai.
  - Gambar disimpan ke Object Storage (S3/MinIO/Garage) privat dan disajikan melalui endpoint URL presigned berwaktu (aktif 15 menit).
  - **Fail-Closed di Produksi**: Menolak upload dan melempar pesan error jelas jika penyimpanan S3 offline, menghindari penyimpanan string base64 raksasa ke database.
- **Pelacakan Pengiriman (`/track-order`)**:
  - Halaman pencarian status order berbasis nomor pesanan + nomor telepon untuk privasi.
  - Tautan pelacakan resi ekspedisi resmi (J&T / JNE / SiCepat / dll).

---

### G. Halaman Informasi & Legal Statis
- `/specifications`: Panduan spesifikasi teknis kamera digicam (CCD vs CMOS, optical zoom, tipe baterai).
- `/returns`: Prosedur garansi, klaim retur barang rusak, dan syarat video unboxing.
- `/privacy`: Kebijakan privasi perlindungan data pelanggan.
- `/terms`: Syarat dan ketentuan transaksi toko.

---

## 2. Admin Control Plane (`app/admin/`)

### A. Keamanan & Autentikasi
- **Login Terproteksi**:
  - Satu akun admin: username tetap `admin`, password dibandingkan dengan `ADMIN_PASSWORD_HASH` (bcrypt) dari environment. Tidak ada tabel user admin.
  - Perlindungan *brute-force rate limiting* (maks. 5 percobaan per 15 menit).
  - Sesi berbasis HTTP-Only Cookie yang ditandatangani HMAC-SHA256 dengan `ADMIN_SESSION_SECRET` (min. 32 karakter), masa kedaluwarsa 24 jam. Tanpa dependency sesi tambahan.

### B. Dashboard Ringkasan
- Metrik kartu cepat: pesanan perlu diproses (`PENDING_PAYMENT` + `PROCESSING`), pesanan dikirim (`SHIPPED`), kamera stok kritis (`stock <= 1` dan `active = true`), dan total omset pesanan `COMPLETED` (sum `total_amount`).
- Tabel 5 pesanan terbaru lengkap dengan tombol pintas kirim pesan konfirmasi via WhatsApp.

### C. Manajemen Pesanan (Orders)
- Tab filter status: `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`.
- **Auto-Cancel Pesanan Belum Dibayar**:
  - Order `PENDING_PAYMENT` **tanpa** bukti bayar yang melewati `expires_at` (default 2 jam, diatur di Settings) diubah ke `CANCELLED` dan stok dikembalikan dalam satu transaksi.
  - Pemicu: route handler `GET /api/cron/auto-cancel` yang dijaga header `Authorization: Bearer $CRON_SECRET`, dipanggil Coolify Scheduled Task tiap 15 menit. Route juga dipanggil (fire-and-forget) saat admin membuka daftar order, sehingga MVP tetap jalan walau scheduler belum dikonfigurasi.
  - Idempotensi: restock hanya dieksekusi jika `stock_restored_at IS NULL`, lalu kolom itu diisi pada transaksi yang sama. Tidak ada job queue, worker, atau `node-cron` di dalam proses Next.js.
  - Krusial karena tiap unit kamera preloved hanya 1 stok — tanpa auto-cancel, unit terkunci selamanya oleh pembeli yang tidak membayar.
- Aksi Admin:
  - **Confirm Paid**: `PENDING_PAYMENT` → `PROCESSING` setelah dana diverifikasi manual. Status ini tidak pernah diset otomatis oleh upload bukti.
  - **Simpan Resi**: nomor resi + kurir; `PROCESSING` → `SHIPPED`.
  - **Mark Completed**: `SHIPPED` → `COMPLETED`.
  - **Cancel Order**: `PENDING_PAYMENT`/`PROCESSING` → `CANCELLED` + restock atomik (idempoten via `stock_restored_at`). Order `SHIPPED`/`COMPLETED` tidak bisa dibatalkan lewat tombol ini — stok tidak dikembalikan otomatis setelah barang keluar.
  - **Inspeksi Bukti Bayar**: Modal tampilan slip pembayaran via presigned URL.
  - **Catatan Internal**: Catatan khusus admin per pesanan yang tidak terlihat oleh pembeli (`internal_notes`).

### D. Manajemen Produk & Stok
- **Katalog Produk (CRUD)**:
  - Form tambah/edit produk: nama, brand, kategori, harga (IDR), deskripsi, `specifications` (array key/value), kondisi (`condition_grade`, `defects`, `inclusions`), berat gram (opsional), upload multi-foto langsung ke Object Storage publik.
  - Penandaan: flag *Featured* (`is_featured`) dan tag promo (`best-seller`, `Pink`, `Wifi`, dll). *New Arrivals* dihitung dari `created_at`, bukan flag.
  - Tag hanya kind `promo`; label kondisi tidak dibuat sebagai tag.
- **Stepper Stok Real-Time**:
  - Pengaturan stok integer dengan tombol `+` / `-`.
  - **Rollback Guard**: UI memeriksa respons server; jika mutasi gagal (misal koneksi terputus), tampilan stok otomatis di-rollback ke angka asli dan memunculkan notifikasi error.

### E. Pengaturan Toko (Settings)
- Dua tarif zona (`utama`, `luar`) + pemetaan provinsi per zona + daftar provinsi diblokir.
- Batas waktu auto-cancel pesanan `PENDING_PAYMENT` (jam).
- Konfigurasi kontak WhatsApp admin & aktivasi integrasi Bot Telegram.
- Pengaturan running banner teks di navbar atas.
- CRUD Banner promo beranda (upload gambar, teks judul, tombol CTA, urutan tampil).
- CRUD Rekening & QRIS pembayaran (Bank, Nama Akun, Nomor Rekening, upload file QR).
- CRUD Testimoni pembeli (nama, ulasan, rating bintang, screenshot chat).

---

## 3. Fondasi Backend, Database & Infrastruktur

### A. Integritas Transaksi Database (ACID)
- **Atomic Order Execution**:
  - Pembuatan pesanan dibungkus dalam PostgreSQL Transaction menggunakan locking baris `SELECT ... FOR UPDATE`.
  - Verifikasi stok dan pemotongan kuantitas dieksekusi dalam satu transaksi atomik. Jika ada 1 item yang kehabisan stok, seluruh pesanan digagalkan secara bersih tanpa *race condition*.
- **Restock Otomatis**:
  - Pembatalan pesanan (`CANCELLED`), baik manual admin maupun auto-cancel, mengeksekusi kueri pengembalian kuantitas stok yang sesuai dalam transaksi yang sama.

### B. Notifikasi Real-Time (Telegram Bot Dispatcher)
- Integrasi bot Telegram *fire-and-forget* (`.catch()` non-blocking agar tidak memperlambat respon checkout).
- Notifikasi otomatis saat pesanan dibuat dan saat pelanggan mengunggah bukti bayar.
- Mengirim foto slip pembayaran langsung sebagai attachment multipart gambar ke chat/grup admin toko.

### C. Strategi Object Storage (S3 / MinIO / Garage)
- **Bucket Publik**: Digunakan untuk aset foto produk katalog (bodi kamera + sample shots), banner beranda, dan icon (`public-read`).
- **Bucket Privat**: Khusus dokumen bukti bayar pelanggan (`proofs/`). Akses hanya dibuka melalui presigned URL berwaktu (15 menit).
- Host storage dinamis membaca dari variabel lingkungan `S3_ENDPOINT` (menghindari hardcode nama domain provider storage).

### D. Caching Cerdas & Invalidasi Instan
- Menggunakan `unstable_cache` Next.js dengan penandaan tag spesifik:
  - Tag `["settings"]`: Konfigurasi toko & ongkir (di-cache sebagai *single map* untuk menghemat kueri).
  - Tag `["banners"]`: Daftar banner aktif.
  - Tag `["testimonials"]`: Daftar testimoni pembeli.
  - Tag `["payment-methods"]`: Daftar metode bayar.
- Invalidasi instan dari Server Action admin memakai `updateTag(tag)` (Next 16, read-your-writes). Untuk katalog yang boleh telat, pakai `revalidateTag(tag, 'max')`. Pola lama `revalidateTag(tag, { expire: 0 })` tidak ada di Next 16.

### E. Proteksi Keamanan & Rate Limiting
- **In-Memory Rate Limiter**:
  - Batas per alamat IP, dengan `Retry-After` saat limit tercapai:
    - Checkout: maks. 10 request per 15 menit.
    - Lacak pesanan: maks. 15 request per 15 menit; lookup harus cocok dengan nomor pesanan **dan** nomor HP.
    - Login admin: maks. 5 percobaan gagal per 15 menit.
  - Header proxy hanya dipercaya dari konfigurasi proxy trusted; tanpa trusted proxy, pakai alamat koneksi langsung.
  - In-memory limiter hanya untuk satu instance; MVP Coolify wajib satu replica. Multi-replica perlu Redis/shared limiter sebelum scaling.
- **HTTP Header Security**:
  - Cache statis 1 tahun (`immutable`) untuk aset gambar, font, dan bundle publik.

### F. SEO & Optimasi Search Engine
- Generator XML sitemap dinamis (`app/sitemap.ts`) yang otomatis mendaftarkan URL halaman statis serta seluruh URL produk aktif di database.
- Proteksi `try/catch` pada crawler: jika database sedang dalam perawatan, sitemap tetap menyajikan halaman utama tanpa melempar status error HTTP 500.
- `robots.ts` mengizinkan pengindeksan katalog publik dan memblokir jalur privat (`/admin/`, `/invoice/`, `/cart/`, `/api/`).

---

## 4. Model Data Produk Kamera (Wajib)

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `name` | text | Nama kamera, misal "Nikon Coolpix S3600". |
| `slug` | text unique | URL PDP. |
| `description` | text | Deskripsi singkat. |
| `price_idr` | integer | Harga rupiah. **Satu-satunya mata uang.** Data USD dari scrape diabaikan. |
| `stock` | integer | Jumlah unit. Sumber hanya `products[].stock`; `locations[].stock` dan `stock_reserved` diabaikan. Produk terjual tetap aktif sebagai arsip PDP, tetapi tidak dapat dibeli. |
| `condition_grade` | numeric(3,1) | Skor 1.0–10.0, hanya diisi hasil inspeksi admin. Label sumber seperti `Brand New`, `Like New`, `Very Good`, `Good`, `Used` tidak dipakai sebagai skor; impor grade hanya jika pola `N/10 body condition` cocok. `null` berarti draft/nonaktif sampai admin inspeksi. |
| `defects` | text nullable | Catatan minus/defects. |
| `inclusions` | jsonb (string[]) | Daftar aksesoris (baterai, charger, memory card, dll). |
| `details_raw` | text | Teks deskripsi asli dari scrape (arsip). |
| `weight_grams` | integer nullable | Bobot kamera. **Info tampil saja, bukan basis ongkir.** |
| `specifications` | jsonb | Array `{key, value}` — sensor, lensa, baterai. |
| `features` | jsonb (string[]) | Teks badge bebas untuk PDP (mis. "SAKURA LE SSERAFIM'S DIGICAM"). **Tampil saja, bukan facet filter.** |
| `brand_id`, `category_id` | uuid | Relasi. |
| `is_active`, `is_featured` | boolean | Nama kolom: `active`, `is_featured`. `is_featured` dari kolom `featured` dataset. Tidak ada `is_best_seller` / `is_new`. |

**Aturan tegas:**
- **Tidak ada tabel varian.** Tidak ada ukuran/warna. Satu baris produk = satu model kamera; stok integer (mayoritas 1).
- **Tidak ada tier promo otomatis.** Tidak ada gratis ongkir/diskon akumulatif berbasis jumlah item.
- **Tidak ada harga USD.** Seeder memakai `prices[currency=IDR].amount` saja.
- **Stok hanya dari `products[].stock`**, bukan `locations[].stock` — mencegah stok terduplikasi.
- **Foto:** dataset awal tidak menandai sample shots dan semua `position` bernilai 0. Admin wajib menata urutan dan menandai `kind` (`body` | `sample`) sebelum produk dipublikasikan.
- **Tag:** `tags` + `product_tags` sumber facet filter (kind `promo`). `features[]` sumber teks badge di PDP. Best Seller = tag `best-seller`; New Arrivals = `created_at`. Tidak ada flag `is_best_seller`/`is_new`.
- **Foto sumber:** seeder menyimpan `images[].url` remote apa adanya (minio.girlyglimpse.com) dan menyalin `data/images/` bila diperlukan; foto tidak wajib dipindah ke bucket sendiri di MVP. Upload admin baru selalu ke bucket sendiri. Domain remote didaftarkan di `images.remotePatterns`.
- **Produk tidak boleh aktif** tanpa `price_idr`, foto utama, dan kondisi hasil inspeksi admin.
- **File dataset yang tidak dipakai seeder**: `shipping_rates.json` (tarif internasional non-IDR, bertentangan dengan keputusan ongkir zona domestik) dan `locations.json` (alamat gudang berisi data pribadi — jangan di-seed, jangan dipublish).

## 5. Aturan Operasional Produk & Order

- **Admin CRUD produk**: Form mendukung harga IDR, spesifikasi teknis, skor kondisi desimal, defects, inclusions, stok, tag, penataan galeri, dan penandaan sample shots.
- **Verifikasi pembayaran**: Upload bukti hanya memberi notifikasi ke admin; pembayaran selalu diverifikasi manual.
- **Auto-Cancel**: Order pending tanpa bukti bayar dibatalkan setelah 2 jam; jika bukti sudah diunggah, order tetap pending sampai admin verifikasi/batalkan.
- **Data impor sensitif**: Gunakan `products[].stock`, bukan `locations[].stock`. Abaikan/strip `locations` dari `products.json`; jangan commit atau seed `data/locations.json`.

---

## 6. Checklist Kesiapan Sebelum Rilis Produksi (Production Launch)

1. [ ] Jalankan typecheck TypeScript: `node_modules/.bin/tsc --noEmit` wajib **EXIT=0**.
2. [ ] Pastikan seluruh kredensial rahasia (DB password, S3 secret, session secret, token bot Telegram) terisi di environment variable server produksi (bukan default fallback).
3. [ ] Pastikan Object Storage (S3/Garage/MinIO) siap menerima upload foto publik dan privat.
4. [ ] Uji alur transaksi penuh: Pilih kamera → Checkout → Upload Bukti Bayar → Cek notifikasi Telegram → Input Resi di Admin → Periksa status pelacakan.
5. [ ] Uji auto-cancel: buat order `PENDING_PAYMENT`, majukan `expires_at`, pastikan status jadi `CANCELLED` dan stok kembali.
6. [ ] Verifikasi sitemap di browser: `https://domain.com/sitemap.xml` dan `https://domain.com/robots.txt`.

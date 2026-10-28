# TASK.md - Daftar Tugas Perbaikan Bug, Penyelarasan Ambiguitas & Milestone 3

**Terakhir Diperbarui:** 2026-10-28  
**Referensi Audit:** `bug-audit/AUDIT.md`, `MVP.md`, `_build_plan/prd.md`, `HANDOFF.md`, `DAILY_TASKS.md`

---

## 🔴 FASE 1: Keamanan, Integritas Data & Konfigurasi S3 (Blocker)

### 1.1. Penyelarasan Variabel Lingkungan Object Storage (S3/MinIO)
- [x] **Samakan nama variabel env S3 di seluruh kode dan konfigurasi**:
  - Masalah: `.env.example` & `lib/admin-actions.ts:385-397` memakai `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`, sedangkan `lib/actions.ts:259-271, 291-296`, `_build_plan/blueprints/coolify.json:52-71`, dan `_build_plan/milestones/milestone-3-coolify.md:55-58` memakai `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_BUCKET`, `S3_PRIVATE_BUCKET`.
  - Target: Dukung pembacaan keduanya (fallback alias) di `lib/actions.ts` dan `lib/admin-actions.ts`, serta seragamkan penamaan di `.env.example`, `coolify.json`, dan `milestone-3-coolify.md`.
- [x] **Perbaiki penyimpanan & parsing key S3 bukti bayar (`AUDIT L-2`)**:
  - Lokasi: `lib/actions.ts:271, 283-284`
  - Masalah: `storeProof()` menyimpan URL penuh dan `proofUrl()` mem-parsing ulang URL dengan `u.pathname.replace(/^\/[^/]+\//, "")` yang rusak jika `S3_ENDPOINT` memiliki sub-path.
  - Target: Simpan atau ekstrak key objek (`proofs/...`) secara deterministik tanpa bergantung pada jumlah segmen path endpoint.

### 1.2. Proteksi Endpoint Server Action & Sesi Admin (`AUDIT C-1, C-2, H-4, M-1`)
- [x] **Wajibkan autentikasi admin pada `proofUrl(orderId)` (`AUDIT C-1`)**:
  - Lokasi: `lib/actions.ts:275`
  - Masalah: Fungsi berada di file `"use server"` tanpa `if (!(await isAdmin())) return null;`, sehingga publik dapat meminta presigned URL slip transfer jika mengetahui UUID order.
- [x] **Tolak fallback secret sesi admin di production & validasi klaim `role` (`AUDIT C-2`)**:
  - Lokasi: `lib/admin-session.ts:7-11, 28-29`
  - Masalah: `process.env.ADMIN_SESSION_SECRET ?? "dev-secret-min-32-characters-0000"` tetap aktif di production bila env lupa diset, dan `verifyToken()` hanya memeriksa `exp` tanpa memeriksa `payload.role === "admin"`.
- [x] **Amankan `cancelExpiredOrders()` agar tidak terekspos sebagai public Server Action (`AUDIT H-4`)**:
  - Lokasi: `lib/actions.ts:303` & `app/api/cron/auto-cancel/route.ts`
  - Masalah: Diekspor dari file `"use server"`, sehingga dapat dipanggil dari luar tanpa `CRON_SECRET` maupun sesi admin.
  - Target: Pindahkan logika internal `cancelExpiredOrders` ke modul server-only (tanpa `"use server"`, mis. `lib/orders.ts`) atau batasi pemanggilannya.
- [x] **Tambahkan rate limit & proteksi pada `uploadProof()` (`AUDIT H-4`)**:
  - Lokasi: `lib/actions.ts:217`
  - Masalah: Tidak ada rate limit per IP sehingga rawan spam upload ke S3 privat dan spam notifikasi Telegram.
- [x] **Perbaiki urutan pembacaan IP di `clientIp()` & auth cron (`AUDIT M-1`)**:
  - Lokasi: `lib/rate-limit.ts:27-29`, `app/track-order/page.tsx:43`, `app/api/cron/auto-cancel/route.ts:14-20`
  - Masalah: `x-forwarded-for` paling kiri mudah dipalsukan klien; di route cron, rate limit dijalankan sebelum pengecekan header `Authorization: Bearer $CRON_SECRET`.

### 1.3. Integritas Transaksi Order & Auto-Cancel (`AUDIT H-1, H-2, M-3, M-5`)
- [x] **Gabungkan duplikat `productId` sebelum cek & potong stok (`AUDIT H-1`)**:
  - Lokasi: `lib/actions.ts:38-52, 136-141, 184-189`
  - Masalah: Array `items` dengan `productId` kembar (`[{productId: p1, qty: 1}, {productId: p1, qty: 1}]`) lolos cek `p.stock < i.qty` karena membaca nilai `p.stock` yang sama, lalu mengurangi stok dua kali hingga menjadi `-1`.
- [x] **Perbaiki race condition `cancelExpiredOrders()` terhadap order yang baru dibayar/diproses**:
  - Lokasi: `lib/actions.ts:320-324`
  - Masalah: Klausa `WHERE` pada `tx.update(orders)` di dalam transaksi hanya mengecek `and(eq(orders.id, o.id), isNull(orders.stockRestoredAt))` tanpa mengecek ulang `eq(orders.status, "PENDING_PAYMENT")` dan `isNull(orders.proofUploadedAt)`.
- [x] **Implementasikan retry & penomoran bebas bentrok untuk `orderNumber` (`AUDIT H-2`)**:
  - Lokasi: `lib/actions.ts:144-153`
  - Masalah: Komentar menyebut *"race ditangani unique constraint + retry di luar"*, namun belum ada retry loop dan masih memakai `count()` yang bisa bentrok saat ada transaksi paralel.
- [x] **Pindahkan cek `idempotencyKey` ke sebelum `rateLimit` checkout & sesuaikan kuota (`AUDIT M-3`)**:
  - Lokasi: `lib/actions.ts:91-107`
  - Masalah: Retry jaringan dengan `idempotencyKey` yang sama ikut memotong kuota rate limit. Selain itu, selaraskan kuota `5` vs `10` pesanan / 15 menit sesuai `MVP.md` & `prd.md`.
- [x] **Perbaiki pengiriman foto bukti bayar ke Telegram (`telegram()`)**:
  - Lokasi: `lib/actions.ts:60-65, 240`
  - Masalah: `new FormData(Object.entries(...) as never)` melempar `TypeError` saat runtime karena konstruktor `FormData` tidak menerima array entries, dan `uploadProof()` belum menyertakan nomor pesanan / lampiran ke notifikasi Telegram.

---

## 🟠 FASE 2: Perbaikan Bug Fungsional Storefront & Admin UX

### 2.1. Pelacakan Pesanan, Invoice & Checkout (`AUDIT H-3, M-2, M-4`)
- [x] **Perbaiki normalisasi nomor HP di `/track-order` (`AUDIT H-3`)**:
  - Lokasi: `app/track-order/page.tsx:28-31, 57`
  - Masalah: Input user dinormalisasi `08...` → `628...` oleh `normalizeWa()`, tetapi kolom `orders.customer_phone` di SQL hanya di-`regexp_replace(..., '[^0-9]', '', 'g')` tanpa mengubah awalan `^0` menjadi `62`. Akibatnya pembeli yang menginput `08...` saat checkout tidak pernah bisa melacak pesanannya.
  - Target: Normalisasi kedua sisi (baik di SQL dengan `regexp_replace(regexp_replace(customer_phone, '[^0-9]', '', 'g'), '^0', '62')` maupun saat menyimpan `customerPhone` di checkout), serta tambahkan tautan pelacakan ekspedisi (JNE/J&T/SiCepat).
- [x] **Lengkapi halaman Invoice (`/invoice/[orderId]`)**:
  - Lokasi: `app/invoice/[orderId]/page.tsx:81-89, 135-161`
  - Target:
    - Tampilkan status konfirmasi jika `order.proofUploadedAt` sudah terisi (agar pelanggan tahu bukti bayar sudah masuk dan sedang diverifikasi admin).
    - Tampilkan informasi kurir & nomor resi (`order.courierName` & `order.trackingNumber`) saat pesanan berstatus `SHIPPED` / `COMPLETED`.
    - Tambahkan tombol salin nomor rekening / unduh QRIS sesuai checklist `milestone-2-core.md:47`.
    - Tambahkan null-guard pada `order.expiresAt`.
- [x] **Validasi ukuran file 1 MB & reset input di `ProofUpload` (`AUDIT M-4`)**:
  - Lokasi: `components/proof-upload.tsx:16-53`
  - Target: Cek `file.size > 1024 * 1024` di sisi klien sebelum upload, dan reset `e.target.value = ""` saat gagal agar file yang sama bisa dipilih ulang.
- [x] **Sinkronisasi keranjang (`cartActions.sync`) & batasan kuantitas (`AUDIT M-2`)**:
  - Lokasi: `lib/cart.ts:105`, `components/cart-view.tsx:97-124, 158-172`, `components/add-to-cart.tsx:42-48`
  - Target:
    - Panggil sinkronisasi stok/harga terbaru dari server saat membuka `/cart` dan `/checkout`.
    - Nonaktifkan tombol `+` di keranjang saat `i.qty >= i.stock`.
    - Beri indikator/umpan balik pada tombol `AddToCartButton` jika seluruh stok unit kamera sudah ada di keranjang.
    - Cegah navigasi keyboard pada tombol checkout saat `soldOut === true`.

### 2.2. Katalog, PDP & Navigasi Storefront (`AUDIT L-1, L-3, L-4`)
- [x] **Blokir akses publik ke PDP produk berstatus Draft (`active = false`)**:
  - Lokasi: `lib/catalog.ts:227-253` & `app/product/[slug]/page.tsx:25-34`
  - Masalah: `getProduct(slug)` tidak memfilter `eq(products.active, true)` sehingga kamera draft tetap bisa dibuka publik dan dibeli.
- [x] **Tampilkan `weightGrams` di PDP meskipun `specs` kosong**:
  - Lokasi: `app/product/[slug]/page.tsx:153-171`
  - Masalah: Berat kamera berada di dalam blok `{!!p.specs?.length && (...)}`, sehingga kamera yang diinput lewat form admin (tanpa array `specs`) tidak menampilkan beratnya.
- [x] **Sambungkan fitur Pencarian (`Search`) di Storefront**:
  - Lokasi: `components/shop-shell.tsx:175-185`, `app/products/page.tsx`
  - Masalah: Tombol `SEARCH` di header hanya mengarah ke `/products`, dan di halaman `/products` maupun `/` tidak ada input `<input name="search">` sama sekali.
  - Target: Tambahkan form input pencarian kata kunci di halaman katalog `/products` (dan/atau bar pencarian header).
- [x] **Sambungkan `running_banner_text` dari database ke Announcement Bar**:
  - Lokasi: `components/shop-shell.tsx:51-72`, `app/layout.tsx`
  - Masalah: Teks pengumuman atas masih hardcoded `"Ongkir flat 2 zona • Semua unit dites sebelum kirim"`, mengabaikan `settings.running_banner_text` yang diatur admin di `/admin/settings`.
- [x] **Pertahankan semua filter aktif saat submit form rentang harga di `/products` & validasi `condition` (`AUDIT L-3`)**:
  - Lokasi: `app/products/page.tsx:53, 122-149`
  - Masalah: Form harga hanya meneruskan `brand` sebagai hidden input (menghapus `category`, `condition`, `tag`, `search`, `sort`), dan `sp.condition` di-cast tanpa validasi terhadap `"gte9" | "gte7" | "lt7"`.
- [x] **Tambahkan utilitas `.scrollbar-none` & bersihkan angka fallback hardcoded (`AUDIT L-1, L-4`)**:
  - Lokasi: `app/globals.css`, `app/page.tsx:105, 173`, `components/shop-shell.tsx:234`

### 2.3. Kelengkapan Panel Admin
- [x] **Pasang `<OrderActions>` di halaman detail pesanan admin**:
  - Lokasi: `app/admin/orders/[id]/page.tsx` & `components/order-actions.tsx`
  - Masalah: Admin tidak bisa mengubah status order atau menginput nomor resi dari halaman detail `/admin/orders/[id]`. Pastikan juga state input resi di-reset setelah transisi berhasil.
- [x] **Sambungkan tombol aksi produk di `/admin/products`**:
  - Lokasi: `app/admin/products/page.tsx` & `lib/admin-actions.ts:311-446`
  - Masalah: `toggleMostWantedAction`, `toggleFeaturedAction`, dan `deleteProductAction` sudah ditulis di `lib/admin-actions.ts` tetapi belum memiliki tombol pemicu di UI `/admin/products`. Tambahkan juga penjagaan di `deleteProductAction` agar tidak menghapus produk yang sedang terikat pesanan aktif (`PENDING_PAYMENT` / `PROCESSING`).
- [x] **Perbaiki rollback `StockStepper` agar kembali ke nilai stok terakhir yang sah**:
  - Lokasi: `components/stock-stepper.tsx:16-32`
  - Masalah: Rollback saat gagal memakai prop `initial` saat mount pertama, bukan nilai `prev` sebelum klik terakhir.
- [x] **Sinkronkan preview label kondisi di `ProductForm` dengan `conditionLabel()`**:
  - Lokasi: `components/product-form.tsx:507-513` vs `lib/condition.ts:6-15`
  - Masalah: Preview form admin tidak menampilkan kategori `"Used"` untuk skor `< 6.0`, serta pastikan produk aktif wajib memiliki `conditionGrade` dan minimal 1 foto sesuai `MVP.md:245`.

---

## ⚖️ FASE 3: Penyelarasan Seeder & Ambiguitas Dokumen (`AUDIT A-1 s/d A-8`)

- [x] **Perbarui `db/seed.ts` agar sesuai dengan klaim fitur & lokasi toko**:
  - Tambahkan ke-8 merek populer dunia (*Olympus, Panasonic Lumix, Casio, Kodak, Ricoh, Samsung, Leica, Pentax*) ke dalam `db/seed.ts` agar tidak hilang saat re-seed.
  - Tambahkan data awal `testimonials` di `db/seed.ts` (sesuai log `[5/6] Seeding default banners, testimonials & payment methods...`).
  - Ubah `accountHolder: "VINTAAGEMEEW JKT"` di `db/seed.ts:314, 324` menjadi `"VINTAAGEMEEW"` / `"VINTAAGEMEEW KEDIRI"`.
- [x] **Putuskan & selaraskan aturan tag `"Brand New"` di `MVP.md`, `_build_plan/prd.md`, dan `db/seed.ts`**:
  - Hilangkan kontradiksi antara `MVP.md:33` (dibuang) vs `MVP.md:49` & `prd.md:122, 231` (dipertahankan sebagai tag `brand-new`).
- [x] **Selaraskan dokumentasi arsitektur dengan implementasi aktual**:
  - **`A-1`**: Selaraskan catatan state keranjang (`useSyncExternalStore` native store di `lib/cart.ts` vs klaim Zustand di `MVP.md`, `prd.md`, `00-DOCS.md`, `milestone-2-core.md`).
  - **`A-2` & `A-8`**: Perbarui `HANDOFF.md`, `bug-audit/AUDIT.md`, dan `_build_plan/milestones/milestone-2-core.md` (Shadcn UI sudah terpasang, `vitest`/`tsc`/`lint`/`build` sudah lulus, 8 kategori standar industri sudah diterapkan).
  - **Kategori di `README.md`, `MVP.md`, `prd.md`**: Perbarui referensi 11 kategori lama hasil scrape menjadi 8 kategori kamera standar industri.
  - **Design Tokens**: Selaraskan `_build_plan/blueprints/theme-config.css` dengan format Tailwind v4 yang dipakai di `app/globals.css`.

---

## 🚀 FASE 4: Eksekusi Milestone 3 (Hardening, SEO & Coolify Deployment)

- [x] **SEO & Crawler**:
  - [x] Buat `app/sitemap.ts` dinamis (query seluruh slug produk aktif dari PostgreSQL dengan `try/catch` fail-safe).
  - [x] Buat `app/robots.ts` (izinkan `/`, `/products`, `/product/*`; blokir `/admin/`, `/cart/`, `/checkout/`, `/invoice/`, `/api/`).
- [x] **Security Headers & Healthcheck**:
  - [x] Tambahkan HTTP Security Headers di `next.config.ts` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, cache header aset statis).
  - [x] Buat route `app/api/health/route.ts` untuk memverifikasi konektivitas database (`SELECT 1`) dan mengembalikan HTTP 200 OK bagi healthcheck Coolify.
- [x] **Containerization Coolify**:
  - [x] Salin & sesuaikan `Dockerfile` dan `.dockerignore` di root repository untuk build Next.js standalone.
- [x] **Verifikasi Akhir Wajib**:
  - [x] `npx vitest run` (seluruh unit test + test regresi bug baru PASS).
  - [x] `npx tsc --noEmit` (**EXIT=0**).
  - [x] `npm run lint` (**EXIT=0**).
  - [x] `npm run build` (**EXIT=0**).

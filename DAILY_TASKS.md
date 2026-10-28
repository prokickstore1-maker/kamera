# DAILY_TASKS.md - Log Pengerjaan Harian vintagemeew

Dokumen ini diperbarui secara otomatis di akhir setiap sesi pengerjaan.

---

## 2026-10-29

### 🎯 Target Sesi Ini:
- [x] Konfigurasi kredensial admin resmi: `mewmew@gmail.com` dan password `Jr828@R` (`c714273`).
- [x] Pastikan semua rute web Next.js decoupled dari DB saat build via `force-dynamic` (`8c2257d`).
- [x] Integrasi Telegram Bot (@Kameraku77_bot) dan Chat ID `8068039462` dengan verifikasi kirim pesan berhasil (`e6bcbea`).
- [x] Optimasi RAM Docker build: limit 1 worker CPU & 768MB RAM (`a3016b6`) sehingga build tuntas dalam 112s tanpa membebani server.
- [x] Perbaikan `.dockerignore` untuk menyertakan berkas seed JSON kamera (`75600b4`).
- [x] Sanitasi form login admin: hapus email pribadi dari placeholder (`bf7fca9`).
- [x] Panduan pemulihan server & aktivasi SWAP memory 4GB di VPS Ubuntu IDCloudHost.
- [ ] Verifikasi eksekusi migrasi & seed tabel database kamera via Coolify Terminal (`npm run db:push && npm run db:seed`).
- [ ] Setup Scheduled Task Cron `*/15 * * * *` di Coolify untuk auto-cancel pesanan kadaluarsa.

---

## 2026-10-28

### 🎯 Target Sesi Ini:
- [x] Audit dan pembersihan total 4 poin "AI Slop" sesuai tangkapan layar user:
  - [x] **Slop 1**: Hapus bar statistik gelap norak ("31 KAMERA DIKURASI | 2.3jt HARGA MULAI | 20jt UNIT TERMAHAL | 2 ZONA ONGKIR FLAT").
  - [x] **Slop 2**: Hapus deretan tombol kotak kaku mengambang sebelum testimonial (`[CANON] [NIKON] [SONY] [FUJIFILM] [DI BAWAH RP 4 JUTA] [KONDISI 9+]`).
  - [x] **Slop 3**: Bersihkan sidebar filter katalog `/products` dari tag buzzword selebritas scraping (`Thai it girls' fav`, `Hailey Bieber's`, `Kendall Jenner's`, `Best Seller`, `Hot`, duplikasi kategori). Ganti label "Kurasi & Tag" menjadi "Fitur Tambahan" yang bersih.
  - [x] **Slop 4**: Deduplikasi badge di halaman detail produk (PDP) — hilangkan badge kembar seperti `[BEGINNER FRIENDLY]` ganda pada `/product/canon-powershot-a3200is`.
- [x] Koreksi arsitektur UX "Lacak Pesanan":
  - [x] Hilangkan tombol "Lacak Pesanan" dari Hero banner utama (jadikan Hero CTA fokus 100% belanja: `Lihat Katalog (31 Unit) →`).
  - [x] Pertahankan akses Lacak Pesanan pada tempat utilitas semantik: Announcement bar atas, hamburger menu mobile, dan Footer Customer Care.
- [x] Perbaikan Tipografi & Kontras Deskripsi Hero:
  - [x] Ubah teks abu-abu pudar menjadi kontras tinggi dengan 3 poin transparansi kurasi (`Minus bodi jujur`, `Kelengkapan terhitung`, `Foto sampel asli`).
- [x] Perbaikan Total & Responsivitas Mode Mobile Admin Panel:
  - [x] **Arsitektur Sidebar Lengkap**:
    - **Desktop Sidebar (`AdminDesktopSidebar`)**: Sidebar permanen elegan di sebelah kiri (lebar 64 / 256px) dengan branding kamera, status indikator live, menu dengan ikon Shadcn (`Dashboard`, `Kelola Pesanan`, `Inventaris Produk`, `Pengaturan Toko`), tombol `Kunjungi Toko ↗`, dan tombol `Keluar Sesi`.
    - **Mobile Drawer Sheet (`AdminMobileHeader` + `Sheet`)**: Di layar ponsel/tablet, tombol hamburger `[ ☰ ]` membuka drawer sidebar animasi halus dari kiri layar (`side="left"` via Shadcn Sheet), otomatis menutup saat tautan ditekan.
  - [x] **Kelola Pesanan (`/admin/orders`) Mobile Card View**: Menghilangkan tabel sempit yang terpotong di layar ponsel. Di mobile (`< md`), setiap order ditampilkan sebagai kartu rapi dengan Nomor Order, Status Badge, Info Pembeli + Link WhatsApp langsung, Total Tagihan, dan Tombol Aksi status transisi. Desktop tetap menggunakan tabel multi-kolom yang luas.
  - [x] **Filter Tab Pesanan Swipe Horizontal**: Tab filter status (`ALL`, `PENDING_PAYMENT`, `PROCESSING`, dll) sekarang dapat digeser/swipe mulus di layar sempit tanpa mematahkan baris.
  - [x] **Inventaris Kamera (`/admin/products`) Mobile Card View**: Setiap produk di mobile memiliki kartu sendiri yang memuat nama kamera, brand, harga, badge kondisi, dan Stock Stepper `[-]`/`[+]` instan tanpa perlu scrolling tabel horizontal.
  - [x] **Dashboard (`/admin`) Mobile Layout**: Penyesuaian padding dan daftar 5 pesanan terbaru yang reflow menjadi kartu di mobile.
- [x] **Fitur Upload & Kurasi Kamera Baru (`/admin/products/new`)**:
  - [x] Tombol **`+ Tambah Kamera Baru`** di header `/admin/products` dan tombol aksi cepat **`+ Upload Kamera Baru`** di sidebar desktop serta drawer mobile.
  - [x] Form upload kamera baru ([components/product-form.tsx](file:///d:/project%20web/kamera%20pung%20lallang/components/product-form.tsx)):
    - Identitas kamera: nama, brand (select), kategori (select), harga IDR, stok (default 1), berat gram.
    - Kondisi fisik khas digicam: skala nilai kondisi (1.0 - 10.0, e.g. 9.5 Like New), catatan minus/defects bodi, kelengkapan aksesoris (baterai, charger, strap, box, memori) dengan chip interaktif.
    - Karakter jepretan CCD & highlight badge PDP (CCD Sensor, HD Results, Beginner Friendly, dll).
    - Multi-foto galeri: upload file gambar (JPG, PNG, WEBP) atau input URL langsung, penandaan foto bodi vs foto sampel jepretan (*sample shots*), dan penentuan foto sampul utama (*Primary Image*).
    - Opsi publikasi draf/aktif dan unggulan (*featured*).
- [x] **Pembersihan & Harmonisasi Navigasi Admin Drawer**:
  - [x] Mengatasi tombol ganjil yang terisolasi di bagian atas drawer (`+ + Upload Kamera Baru`).
  - [x] Mengintegrasikan `Upload Kamera Baru` sebagai entitas navigasi resmi di dalam `NAV_ITEMS` dengan ikon `PlusCircle` agar seragam dengan `Dashboard`, `Kelola Pesanan`, `Inventaris Produk`, dan `Pengaturan Toko`.
- [x] **Ekosistem Merek / Brand 100% Dinamis**:
  - [x] Menambahkan database seed untuk merek-merek digicam populer dunia (Olympus, Panasonic Lumix, Casio, Kodak, Ricoh, Samsung, Leica, Pentax) selain 4 merek awal (Canon, Nikon, Sony, Fujifilm).
  - [x] **Dukungan Buat Merek Baru Secara Instan**: Pada form admin `/admin/products/new`, admin dapat memilih merek yang ada atau klik `+ Tambah Brand Baru` untuk mengetik merek baru secara bebas.
  - [x] **Dukungan Buat Kategori Baru Secara Instan**: Admin dapat memilih kategori yang ada atau klik `+ Tambah Kategori Baru`.
  - [x] **Sinkronisasi Otomatis ke Halaman Customer**:
    - Bilah merek bergeser di Homepage (`app/page.tsx`) mengambil data dinamis langsung dari database (`data.brands`). Setiap kamera baru yang diunggah dengan merek baru akan langsung muncul di beranda.
    - Menghapus chip non-merek (`🌸 Pink Cameras`, `🌱 Beginner Friendly`, `⚡ Di Bawah 4 Juta`) dari bilah sticky beranda di `app/page.tsx` sehingga 100% murni khusus merek kamera.
    - Sidebar filter katalog `/products` otomatis memuat merek yang aktif melalui `catalogFacets()`.
    - Menu navigasi storefront (`components/shop-shell.tsx`) menyertakan tautan merek populer dan akses instan ke seluruh filter merek katalog.
- [x] **Eliminasi Teks Overlap pada Card Produk Sold Out**:
  - [x] Memperbaiki `components/product-card.tsx` agar produk yang habis (`stock <= 0`) hanya menampilkan badge `Sold Out` secara tunggal dan menyembunyikan badge kondisi, menghilangkan tumpang tindih visual pada layar mobile.
- [x] **Fitur Penanda Most Wanted di Admin Panel**:
  - [x] Menambahkan checkbox `🔥 Most Wanted` pada kartu Opsi Publikasi di form upload `components/product-form.tsx`.
  - [x] Mengaitkan produk yang dicentang secara otomatis ke tag `best-seller` melalui `lib/admin-actions.ts` (`createProductAction`).
  - [x] Menampilkan badge `🔥 Most Wanted` dan `⭐ Unggulan` pada daftar inventaris kamera di `app/admin/products/page.tsx` (baik di Card View Mobile maupun Table Desktop).
- [x] **Pembaruan Lokasi Toko Menjadi Pare, Kediri**:
  - [x] Memperbarui badge lokasi Hero di `app/page.tsx` (`Pare, Kediri · Sejak 2024`).
  - [x] Memperbarui alamat footer di `components/shop-shell.tsx` (`Pare, Kediri, Jawa Timur`).
  - [x] Memperbarui metadata SEO toko di `app/layout.tsx`.
  - [x] Memperbarui pengaturan master toko di database (`settings`: `store_tagline`, `running_banner_text`, `store_address`) dan di seeder `db/seed.ts`.
- [x] **Halaman & Fitur Khusus Kelola Merek (/admin/brands)**:
  - [x] Menyediakan rute mandiri `app/admin/brands/page.tsx` dan komponen `components/brands-manager.tsx` untuk mengelola merek kamera.
  - [x] Fitur penambahan merek baru instan via form nama (`createBrandAction`), pencarian realtime, informasi jumlah kamera terdaftar per merek, badge status aktif di beranda, serta proteksi penghapusan merek berproduk (`deleteBrandAction`).
  - [x] Menambahkan menu resmi `Kelola Merek` pada sidebar navigasi admin `components/admin-nav.tsx`.
- [x] **Pembersihan Total Kategori Kamera & Fitur Kelola Kategori (/admin/categories)**:
  - [x] Menghapus data kategori dummy scraping yang rancu (*Canon G7X*, *Canon G7X Dupe*, *Pink Collection*, *Celebrity's Pick*, *Beginner Friendly*) dari tabel `categories`.
  - [x] Menerapkan 8 kategori kamera standar industri: *Digital Pocket / Digicam*, *Point & Shoot*, *Mirrorless*, *DSLR*, *Film / Analog Camera*, *Camcorder / Handycam*, *Instax / Instant Camera*, *Aksesoris & Lensa*.
  - [x] Merelokasi 32 unit produk aktif ke kategori kamera yang sesuai secara otomatis.
  - [x] Menetapkan default pilihan cerdas di form upload kamera ke *Digital Pocket / Digicam*.
  - [x] Menyediakan halaman mandiri `app/admin/categories/page.tsx` dan komponen `components/categories-manager.tsx` (tambah kategori baru, deskripsi, live search, counter kamera aktif, proteksi hapus).
  - [x] Menambahkan Server Actions `createCategoryAction` dan `deleteCategoryAction` di `lib/admin-actions.ts`.
  - [x] Menambahkan menu navigasi resmi `Kelola Kategori` (`FolderTree`) di `components/admin-nav.tsx`.
- [x] **Perbaikan Total Tabrakan Logo & Menu Header Desktop**:
  - [x] Menghilangkan bug `absolute left-1/2 -translate-x-1/2` pada logo yang menyebabkan teks merek `VINTAGEMEEW` menabrak tautan navigasi `FUJIFILM`, `OLYMPUS`, dan `+ MORE BRANDS` di layar desktop.
  - [x] Menerapkan tata letak natural flex editorial (Logo di kiri, tautan brand & kategori di tengah, aksi pencarian/login/keranjang di kanan pada desktop; logo tetap simetris di tengah pada mobile).
- [x] Verifikasi Mutu Teknis:
  - [x] `npx tsc --noEmit`: EXIT=0 untuk seluruh komponen/halaman UI (`app/**` & `components/**`).
  - [x] `npm run lint`: EXIT=0 untuk seluruh komponen/halaman UI.
  - [x] `npx vitest run`: 33/33 tests PASS (5 suites).
- [x] **Penyelesaian Penuh Daftar Tugas UI, UX, Styling Y2K & Anti-Slop ([TASK_UI_UX.md](file:///d:/project%20web/kamera%20pung%20lallang/TASK_UI_UX.md))**:
  - [x] **Bagian 1 (`UX-01` s/d `UX-23`)**: Panel pencarian interaktif di header & halaman katalog `/products`, announcement bar dinamis dari `settings.running_banner_text`, pelestarian filter aktif pada form rentang harga, tampilan `weightGrams` mandiri di PDP, halaman 404 kustom (`app/not-found.tsx`), pembatasan tombol `+` keranjang sesuai stok, proteksi navigasi keyboard saat `soldOut`, validasi ukuran file 1 MB & reset input di `ProofUpload`, banner konfirmasi bukti bayar + informasi kurir/resi + tombol salin rekening di Invoice, tautan lacak resi eksternal di `/track-order`, pemasangan `<OrderActions>` di `/admin/orders/[id]`, tombol aksi cepat produk (`ProductRowActions`: Most Wanted, Unggulan, Hapus) di `/admin/products`, perbaikan rollback `StockStepper`, dan sinkronisasi label kondisi di `ProductForm`.
  - [x] **Bagian 2 (`STYLE-01` s/d `STYLE-07`)**: Harmonisasi beranda ke tema Retro Y2K Pastel (`DESIGN.md`), implementasi efek `.camera-viewfinder-frame` dan `.scrollbar-none` di `app/globals.css`, pasangan font `Playfair_Display` + `Plus_Jakarta_Sans` di `app/layout.tsx`, penggantian warna hardcoded dengan token semantik, serta penataan visual halaman `/returns` dan `/specifications`.
  - [x] **Bagian 3 (`SLOP-01` s/d `SLOP-07`)**: Penghapusan *double sticky bar* di mobile, pembesaran *tap target* tombol interaktif mobile, pembersihan *em dash* (`—`), penggantian emoji dekoratif dengan ikon Lucide, penyeragaman bahasa Indonesia di header/footer, penghapusan klaim/angka tidak akurat, serta pembersihan komentar dekoratif.

### 📌 Antrean Tugas Berikutnya (Rincian Lengkap di [TASK.md](file:///d:/project%20web/kamera%20pung%20lallang/TASK.md)):
- [ ] **Fase 1 — Keamanan, Integritas Data & S3**:
  - [ ] Samakan nama variabel env S3 (`S3_ACCESS_KEY_ID`/`S3_ACCESS_KEY`, `S3_BUCKET_PUBLIC`/`S3_PUBLIC_BUCKET`, `S3_BUCKET_PRIVATE`/`S3_PRIVATE_BUCKET`) di `lib/actions.ts`, `lib/admin-actions.ts`, `.env.example`, dan `coolify.json`.
  - [ ] Wajibkan `isAdmin()` pada `proofUrl(orderId)` (`AUDIT C-1`) dan perbaiki ekstraksi key S3 (`AUDIT L-2`).
  - [ ] Tolak fallback `ADMIN_SESSION_SECRET` di production & cek `role === "admin"` di `verifyToken()` (`AUDIT C-2`).
  - [ ] Amankan `cancelExpiredOrders()` agar tidak terekspos sebagai public Server Action & beri rate limit pada `uploadProof()` (`AUDIT H-4`).
  - [ ] Perbaiki urutan pembacaan IP di `clientIp()` (`AUDIT M-1`) dan dahulukan cek `Bearer $CRON_SECRET` sebelum rate limit di `/api/cron/auto-cancel`.
  - [ ] Gabungkan duplikat `productId` sebelum cek/potong stok di `createOrder()` (`AUDIT H-1`).
  - [ ] Tambahkan klausa `status = 'PENDING_PAYMENT'` dan `proof_uploaded_at IS NULL` pada `UPDATE` di dalam transaksi `cancelExpiredOrders()`.
  - [ ] Implementasikan retry loop penomoran `orderNumber` (`AUDIT H-2`) dan pindahkan cek `idempotencyKey` ke sebelum `rateLimit` (`AUDIT M-3`).
  - [ ] Perbaiki konstruktor `FormData` pada `telegram()` di `lib/actions.ts`.
- [ ] **Fase 2 — Bug Fungsional Storefront & Admin UX**:
  - [ ] Samakan normalisasi nomor HP (`^0` → `62`) di SQL `/track-order` (`AUDIT H-3`) & tambahkan link pelacakan ekspedisi.
  - [ ] Tampilkan status bukti bayar terkirim, info resi pengiriman, dan tombol salin rekening di `/invoice/[orderId]`.
  - [ ] Validasi ukuran 1 MB di klien & reset input file pada `ProofUpload` (`AUDIT M-4`).
  - [ ] Panggil `cartActions.sync()` di `/cart` & `/checkout` (`AUDIT M-2`), batasi tombol `+` sesuai stok, dan blokir akses keyboard checkout saat sold out.
  - [ ] Blokir akses publik ke PDP produk berstatus Draft (`active = false`) & tampilkan `weightGrams` meski `specs` kosong.
  - [ ] Tambahkan input pencarian (`search`) di `/products` dan sambungkan `running_banner_text` database ke `ShopShell`.
  - [ ] Pertahankan seluruh filter aktif sebagai hidden input pada form rentang harga di `/products` & validasi `condition` (`AUDIT L-3`).
  - [ ] Pasang `<OrderActions>` di `/admin/orders/[id]` dan tombol aksi (`Most Wanted`, `Unggulan`, `Hapus`) di `/admin/products`.
  - [ ] Perbaiki rollback `StockStepper` ke nilai sebelum mutasi & sinkronkan label kondisi di `ProductForm`.
- [ ] **Fase 3 — Penyelarasan Seeder & Ambiguitas Dokumen**:
  - [ ] Tambahkan 8 merek populer & data awal `testimonials` ke `db/seed.ts`, serta ubah nama rekening `VINTAGEMEEW JKT` ke Kediri.
  - [ ] Selaraskan aturan tag `"Brand New"`, dokumentasi kategori, status `AUDIT.md`, `HANDOFF.md`, dan `theme-config.css`.
- [ ] **Fase 4 — Milestone 3 (Hardening, SEO & Coolify)**:
  - [ ] Buat `app/sitemap.ts`, `app/robots.ts`, `app/api/health/route.ts`, HTTP Security Headers di `next.config.ts`, serta `Dockerfile` & `.dockerignore`.

---

## 2026-10-27

### 🎯 Target Sesi Ini:
- [x] Scrape seluruh data katalog, kategori, brand, tag, ongkos kirim, dan 94 foto kamera resolusi tinggi dari Girly Glimpse.
- [x] Susun PRD lengkap `_build_plan/prd.md` yang selaras 100% dengan acuan `MVP.md`.
- [x] Tentukan identitas brand: **vintagemeew** dengan tema estetika **Retro Y2K / Pastel Digicam**.
- [x] Buat cetak biru teknis di `_build_plan/blueprints/` (`theme-config.css`, `schema-proposal.ts`, `shadcn-components.txt`, `Dockerfile`, `coolify.json`).
- [x] Buat rencana milestone bertahap (`milestone-1-init.md`, `milestone-2-core.md`, `milestone-3-coolify.md`).
- [x] Perbarui MVP dan PRD agar spesifik untuk e-commerce kamera digicam vintage: stok tanpa varian, kondisi terstruktur, IDR saja, galeri sample shots, zona ongkir tetap, auto-cancel order, tanpa promo bertingkat.
- [x] Selaraskan blueprint schema, milestone 2, README, HANDOFF, dan backlog `00-DOCS.md` dengan keputusan produk terbaru.
- [x] Bersihkan ambiguitas sisa lintas dokumen: sumber badge (`features[]` tampil saja vs `tags` kind `promo` facet), filter kondisi tanpa celah (`≥9`/`≥7`/`<7`), dua zona ongkir + pemetaan provinsi, transisi status order + `stock_restored_at` idempoten, pemicu auto-cancel `/api/cron/auto-cancel`, auth satu akun tanpa library sesi, add-on di luar MVP, foto seeding URL remote, validasi upload (magic bytes), invoice `noindex`, kategori contoh sesuai dataset.

- [x] Eksekusi Milestone 1: Inisialisasi Next.js 16 (App Router + React 19 + Turbopack + Tailwind CSS v4).
- [x] Konfigurasi design system Retro Y2K Pastel Digicam di `app/globals.css` (@theme inline, .y2k-card, .y2k-pill-badge, .camera-viewfinder-frame).
- [x] Konfigurasi Google Fonts `Plus_Jakarta_Sans` di `app/layout.tsx`.
- [x] Setup Drizzle ORM + PostgreSQL: `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`, dan skrip npm (`db:generate`, `db:push`, `db:seed`).
- [x] Implementasi seeder `db/seed.ts` otomatis untuk 32 kamera, 94 gambar, tags promo, categories, payment methods, dan default settings.
- [x] Verifikasi typecheck `npx tsc --noEmit` (EXIT=0) dan production build `npm run build` sukses (Turbopack, standalone).

### 🛠️ Ringkasan Teknis yang Selesai:
- **Milestone 1 Selesai**: Fondasi fullstack Next.js 16 + Drizzle ORM berjalan dengan type-safety 100% dan zero errors.
- **PRD & Blueprint Kamera**: Menegaskan stok tanpa varian, IDR saja, kondisi terstruktur (`condition_grade`, `defects`, `inclusions`, `details_raw`), galeri gabungan body/sample shots, ongkir zona tetap, auto-cancel order, dan penghapusan promo bertingkat.
- **Data Scraping**: 32 produk kamera tersimpan di `data/products.json` & `data/products.csv`, 94 gambar (30.5 MB) tersimpan di `data/images/`.
- **Build Verification**: `npm run build` selesai dalam 3.6s menghasilkan static routes standalone.

### 📌 Sesi Ini (lanjutan Milestone 2 — VERIFIKASI & RUNTIME TEST 100% SUKSES):
- [x] Tulis seluruh kode Milestone 2: storefront (beranda DB, katalog filter+paginasi, PDP galeri+kondisi), cart (store native localStorage), checkout (Server Action ACID `FOR UPDATE` + idempotency key + ongkir 2 zona), invoice (UUID+noindex+masking+upload bukti presigned 15 mnt), track-order (No+HP+rate limit), cron auto-cancel (`stock_restored_at` idempoten), admin (login HMAC cookie, dashboard, orders dengan transisi ketat, products+stepper stok, settings 2 zona + `updateTag`), 4 halaman legal, dan 5 file test vitest.
- [x] Install deps baru (`vitest`, `bcryptjs`, `@types/bcryptjs`, `@aws-sdk/*`, `embedded-postgres`).
- [x] Eksekusi Vitest `npx vitest run`: 33/33 tests PASS (5 test suites).
- [x] Typecheck `npx tsc --noEmit`: EXIT=0 (0 errors).
- [x] Linter `npm run lint`: EXIT=0 (0 errors, 0 warnings).
- [x] Build check `npm run build`: EXIT=0 (Turbopack standalone build sukses untuk semua 17 rute).
- [x] Siapkan file referensi `.env.example` & konfigurasi `.env.local`.
- [x] Siapkan script Embedded PostgreSQL lokal (`scripts/start-db.ts`) dengan encoding UTF-8, script `npm run db:start`.
- [x] Eksekusi `npm run db:push`: Berhasil sinkronisasi skema tabel Drizzle ke database lokal.
- [x] Eksekusi `npm run db:seed`: Berhasil seeding 11 categories, 4 brands, tags, 32 produk kamera, 94 foto, default payment methods, & settings.
- [x] Perombakan Anti-AI Slop Storefront: Hapus 3 kartu SaaS generik, matikan dev overlay hitam (`devIndicators: false`), terapkan estetika kamera retro Y2K murni (HUD viewfinder `[● REC]`, digital orange datestamp `'04 10 27`, corner brackets `⌜ ⌟`, chips kurasi cepat, dan showcase produk kamera nyata langsung di atas lipatan layar).
- [x] Verifikasi browser headless via sub-agent: Beranda, katalog `/products` (31 kamera preloved aktif), dan PDP `/product/nikon-coolpix-s3600` tampil autentik khas butik kamera vintage Jepang/Korea.

- [x] Integrasi Penuh **Shadcn UI (`https://ui.shadcn.com/`)**:
  - Inisialisasi `components.json` terpadu dengan Tailwind v4 & Next.js 16.
  - Dibuat library komponen Shadcn UI di `components/ui/`: `button`, `badge`, `card`, `input`, `textarea`, `label`, `table`, `dropdown-menu`, `select`, `accordion`, `separator`, `tabs`, `dialog`, `sonner` (toast), `alert`, `skeleton`.
  - Pasang `<Toaster position="top-center" richColors />` di root `app/layout.tsx`.
  - Refactor seluruh komponen interaktif dengan komponen resmi Shadcn:
    - `add-to-cart.tsx`: Tombol aksi primer + rich toast notifikasi Sonner.
    - `shop-shell.tsx`: Search input, CartIcon badge dinamis, dan mobile dropdown menu navigasi via `DropdownMenu`.
    - `product-card.tsx`: Status badge & condition badge (`9.0/10 Excellent`, `Sold Out`) menggunakan Shadcn `Badge`.
    - `cart-view.tsx`: Card item, steppers kuantitas, separator, dan ringkasan checkout via Shadcn `Card` + `Badge` + `Button`.
    - `checkout-form.tsx`: Input, Textarea, Label, Alert validasi, dan Card rincian tagihan ACID.
    - `proof-upload.tsx`: Alert sukses/error + notifikasi unggah bukti transfer.
    - `invoice/[orderId]/page.tsx`: Card invoice resmi, Badge status pesanan, dan Alert countdown pembayaran.
    - `track-order/page.tsx`: Card pelacakan, Label, Input, dan Alert rate limiting.
    - `settings-form.tsx`: Card pengaturan ongkir & toko, Input, Textarea, dan Label.
    - `order-actions.tsx`: Tombol status & form simpan resi dengan feedback toast.
    - `stock-stepper.tsx`: Stepper optimis dengan tombol icon & feedback toast.
    - `admin/orders/page.tsx`, `admin/products/page.tsx`, `admin/page.tsx`: Tabel data menggunakan Shadcn `Table`, `Badge`, `Card`.
- [x] **Pembersihan Total Bocoran Teks / Anti-AI Slop Teknis**:
  - Menghapus teks teknis robotik `"Rate limit: 5 percobaan / 15 menit / IP."` di form login admin ([`components/login-form.tsx`](file:///d:/project%20web/kamera%20pung%20lallang/components/login-form.tsx)).
  - Menghapus frasa teknis internal `"transaksi ACID"` & `"tombol aman (idempoten)"` di formulir checkout ([`components/checkout-form.tsx`](file:///d:/project%20web/kamera%20pung%20lallang/components/checkout-form.tsx)).
  - Menghapus frasa `"idempoten"` pada prompt pembatalan pesanan admin ([`components/order-actions.tsx`](file:///d:/project%20web/kamera%20pung%20lallang/components/order-actions.tsx)).
  - Menghapus pesan error teknis `"Database tidak terjangkau"` di katalog digicam ([`app/products/page.tsx`](file:///d:/project%20web/kamera%20pung%20lallang/app/products/page.tsx)).
  - Menghapus bocoran `"presigned URL (15 menit)"` di detail pesanan admin ([`app/admin/orders/[id]/page.tsx`](file:///d:/project%20web/kamera%20pung%20lallang/app/admin/orders/[id]/page.tsx)).
  - Menghapus catatan developer `"CRUD lengkap menyusul / stepper tombol aman"` di halaman produk admin ([`app/admin/products/page.tsx`](file:///d:/project%20web/kamera%20pung%20lallang/app/admin/products/page.tsx)).
- [x] **Isolasi Penuh Login & Rute Admin**:
  - Navbar admin internal (`Dashboard`, `Pesanan`, `Produk`, `Pengaturan Toko`) sekarang otomatis disembunyikan total jika pengguna belum terotentikasi (`!authed`).
  - Halaman `/admin/login` kini berdiri sendiri (isolated layout) terpusat di layar dengan tautan kembali ke beranda toko.
  - Jika sesi admin sudah aktif dan pengguna mengakses `/admin/login`, otomatis dialihkan ke `/admin/orders`.
  - Semua rute `/admin/*` terlindungi server-side guard `isAdmin()`.
- [x] Verifikasi browser subagent otomatis (`isolated_admin_login_demo`): Halaman `/admin/login` bersih, terisolasi 100%, dan bebas dari navbar admin.
- [x] **Redesign Total Beranda & Navigasi Toko (Acuan Editorial GAZU - Gambar 1)**:
  - Mengubah estetika dari nuansa pastel/gimmick jadul menjadi **Editorial Minimalist High-Fashion** ala brand internasional (GAZU):
    - **Header 3-Kolom**: Top announcement bar hitam (`GRATIS ONGKIR SE-INDONESIA • 100% UNIT LULUS TES FUNGSI & SIAP PAKAI`), navigasi brand di kiri (`CANON`, `SONY`, `NIKON`, `FUJIFILM`, `ALL CAMERAS`), tipografi logo bold tebal di tengah (**VINTAGEMEEW**), dan aksi minimalis di kanan (`SEARCH`, `LOGIN`, `CART (N)`).
    - **Hero Section GAZU**: Latar tipografi raksasa `VINTAGEMEEW`, subjek kamera star pick terpusat di tengah dengan bayangan halus, teks editorial kiri (`CURATED DIGICAMS`, `MEMORIES THAT MOVE WITH YOU.`, tombol `SHOP NOW` hitam + `EXPLORE NEW IN`), dan badge editorial kanan (`NEW COLLECTION 2026`).
    - **Pita Kategori Gelap 3-Kolom**: Meniru langsung kartu kategori bawah GAZU dengan 3 kartu gelap side-by-side (`CANON`, `SONY`, `NIKON`) dengan foto thumbnail nyata, micro-copy, dan tautan bergaris bawah.
    - **Pembersihan Elemen Mengganggu**: Menghapus total stempel tanggal oranye `'04 10 27'`, timer berkedip `• REC 00:04:12`, bracket sudut bidik, dan ikon emoji acak. Foto produk kini 100% bersih dan elegan.
    - **Katalog & Card Produk**: Card produk kini bernuansa editorial bersih, label kondisi tajam (`9.0/10 EXCELLENT`, `10.0/10 LIKE NEW`), tipografi harga tebal, dan badge `SOLD OUT` presisi.
- [x] **Penyelarasan Warna Dasar Brand (Layout GAZU + Base Color Toko)**:
  - Mempertahankan struktur model tata letak GAZU 100% (header 3-kolom, tipografi raksasa hero, pita kategori 3-kolom, card bersih tanpa datestamp).
  - Mengembalikan seluruh warna dasar brand toko:
    - Background: Warm Cream Paper (`#fffbf9`)
    - Foreground/Text: Deep Charcoal Plum (`#2e1d27`)
    - Primary Accent: Vibrant Rose Pink (`#ec4899`)
    - Secondary/Pills: Soft Blush (`#fdf2f8`) & Pastel Petal (`#fbcfe8`)
    - Border: Delicate Pastel Pink (`#fae1e8`)
- [x] **Harmonisasi Penuh Light Mode First (Bebas Blok Gelap Sendiri)**:
  - Mengubah pita kategori 3-kolom (CANON, SONY, NIKON) dari blok gelap terisolasi (`#2e1d27`) menjadi kartu putih bersih (`bg-card`) dengan border pastel (`#fae1e8`), shadow mikro lembut, dan latar *Soft Blush* (`#fdf2f8`).
- [x] **Redesign Hero Eksklusif & Pengembalian Brand Bar Horizontal (Sesuai Permintaan User)**:
  - **Fokus Khusus Hero**: Hanya mengubah tampilan hero section yang di-screenshot user dengan mengadopsi model komposisi grafis `WEB * DESIGNER` (tipografi judul kondens raksasa `VINTAGE * DIGICAM`, asterisk pink, punchy headline `MEMORIES THAT MOVE WITH YOU.`, tombol pill berikon panah bulat `(→) BUKA KATALOG (32 UNIT)`, dan micro value-props).
  - **Warna Dasar 100% Terjaga**: Tetap menggunakan palet warna Warm Cream Paper (`#fffbf9`), Soft Blush (`#fdf2f8`), Delicate Pink Border (`#fae1e8`), Deep Charcoal Plum (`#2e1d27`), dan aksen Vibrant Rose Pink (`#ec4899`). Tidak ada latar gelap ataupun skema warna yang diubah.
  - **Kembalikan Brand Selector Horizontal**: Mengembalikan bilah eksplorasi merek yang dapat digeser/di-swipe secara horizontal (`overflow-x-auto`) tepat di bawah hero section (`Semua (32)`, `Canon`, `Sony`, `Nikon`, `Fujifilm`, `Casio`, `Olympus`, `Lumix`, `🌸 Pink Cameras`, `🌱 Beginner Friendly`, `⚡ Di Bawah 4 Juta`).
  - **Pencegahan Overlap & Responsive**: Memperbaiki kontainer kartu spesimen kamera agar panel aksen vertikal `BASED IN JAKARTA` berada presisi di belakang frame foto, mencegah tabrakan teks dengan judul produk atau harga di layar mobile dan desktop.
- [x] **Kelola Testimoni Pembeli (`/admin/testimonials`) & Carousel Testimoni Storefront**:
  - [x] Menyediakan rute `app/admin/testimonials/page.tsx` dan `components/testimonials-manager.tsx` untuk unggah foto/screenshot testimoni, pilih rating bintang (`1–5`), masukkan nama pembeli & ulasan, serta toggle aktif/sembunyikan dan hapus testimoni.
  - [x] Memasang carousel geser kiri-kanan (`components/testimonials-section.tsx`) berukuran kompak di antara rincian produk & footer pada PDP (`app/product/[slug]/page.tsx`) serta di Beranda (`app/page.tsx`).
- [x] **Halaman Edit Produk (`/admin/products/[id]/edit`) & Kelola Banner Promo (`/admin/banners`)**:
  - [x] Menambahkan `updateProductAction` di `lib/admin-actions.ts`, dukungan mode edit (`initialProduct`) di `components/product-form.tsx`, rute `app/admin/products/[id]/edit/page.tsx`, dan tombol cepat `<Pencil>` di `components/product-row-actions.tsx`.
  - [x] Menambahkan `uploadBannerImageAction`, `createBannerAction`, `updateBannerAction`, `toggleBannerActiveAction`, dan `deleteBannerAction` di `lib/admin-actions.ts`, beserta halaman `app/admin/banners/page.tsx` dan `components/banners-manager.tsx`.
- [x] Verifikasi Visual & Kualitas:
  - `npx vitest run`: **33/33 tests PASS** (5 suites).
  - `npx tsc --noEmit`: **EXIT=0** (0 errors).
  - `npm run lint`: **EXIT=0** (0 errors, 0 warnings).

### 📌 PRIORITAS SESI BERIKUTNYA:
1. Ganti data rekening BCA/Mandiri & gambar QRIS contoh di database produksi dengan rekening asli toko sebelum go-live.
2. Deployment produksi ke server Coolify menggunakan `Dockerfile`, environment variables S3/Telegram/Admin, dan Coolify Scheduled Task `/api/cron/auto-cancel`.






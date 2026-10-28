# TASK_UI_UX.md - Daftar Tugas Khusus UI, UX, Styling & Anti-Slop

**Tanggal Audit & Eksekusi:** 2026-10-28  
**Referensi Standar:** `DESIGN.md`, `_build_plan/blueprints/theme-config.css`, `.claude/skills/antislop/SKILL.md`, `.claude/skills/antislop-ui/SKILL.md`, `.claude/skills/antislop-layoutmobile/SKILL.md`, `.claude/skills/antislop-copywriting/SKILL.md`

> File ini terpisah sepenuhnya dari `TASK.md` agar tidak tercampur dengan pekerjaan backend/database. Setiap item dipecah per masalah spesifik (tidak digabung).

---

## 1. Masalah Fungsional UX & Interaksi Antarmuka

### 1.1. Navigasi & Katalog Storefront
- [x] **UX-01 — Input Pencarian Kamera di Storefront** (`components/shop-shell.tsx`, `app/products/page.tsx`):
  - Menambahkan panel pencarian interaktif di header `ShopShell` serta form pencarian kata kunci lengkap dengan tombol reset di halaman `/products`.
- [x] **UX-02 — Teks Dinamis Announcement Bar** (`components/shop-shell.tsx`, `app/layout.tsx`):
  - Menghubungkan pengumuman bar atas dengan `settings.running_banner_text` dari database (dengan fallback bersih bila kosong).
- [x] **UX-03 — Pertahankan Filter Aktif pada Form Rentang Harga** (`app/products/page.tsx`):
  - Meneruskan `brand`, `category`, `condition`, `tag`, `search`, dan `sort` sebagai hidden input saat pengguna menekan tombol *Terapkan Harga* maupun *Cari*.
- [x] **UX-04 — Validasi Parameter `condition` & `sort` di Katalog** (`app/products/page.tsx`):
  - Memvalidasi `sp.condition` terhadap `"gte9" | "gte7" | "lt7"` dan `sp.sort` terhadap `"featured" | "price_asc" | "price_desc" | "newest"`.

### 1.2. Halaman Detail Produk (PDP)
- [x] **UX-05 — Tampilkan `weightGrams` Mandiri di PDP** (`app/product/[slug]/page.tsx`):
  - Menampilkan spesifikasi berat kamera (`weightGrams`) meskipun array `specs` kosong, serta memblokir akses publik ke produk berstatus draft (`!p.active`).
- [x] **UX-06 — Aksesibilitas & Prioritas Gambar Galeri** (`components/product-gallery.tsx`):
  - Menggunakan `aria-current={i === active ? "true" : undefined}`, menambahkan `alt` deskriptif pada thumbnail, dan `fetchPriority="high"` pada gambar utama.
- [x] **UX-07 — Halaman 404 Kustom (`app/not-found.tsx`)**:
  - Menyediakan halaman `not-found.tsx` bergaya vintagemeew dengan navigasi kembali ke katalog dan beranda.

### 1.3. Keranjang, Add-to-Cart & Checkout
- [x] **UX-08 — Batas Maksimal Stok pada Stepper Keranjang** (`components/cart-view.tsx`):
  - Menonaktifkan tombol `+` ketika `i.qty >= i.stock` dan menampilkan keterangan batas stok unit.
- [x] **UX-09 — Cegah Toast Menyesatkan Saat Stok Keranjang Penuh** (`components/add-to-cart.tsx`):
  - Memeriksa jumlah unit di keranjang terhadap `product.stock` sebelum menambahkan item, serta menampilkan status `Sudah di Keranjang (qty/stock)`.
- [x] **UX-10 — Blokir Navigasi Keyboard Saat `soldOut` di Keranjang** (`components/cart-view.tsx`):
  - Merender `<Button disabled>` murni (tanpa `<Link href="/checkout">`) saat ada produk habis agar tidak bisa ditembus via `Tab` + `Enter`.
- [x] **UX-11 — Atribut `minLength={10}` pada Alamat Checkout** (`components/checkout-form.tsx`):
  - Menambahkan `minLength={10}` pada `<Textarea id="addressLine">` dan `minLength={5}` pada kode pos.
- [x] **UX-12 — Tampilan Ongkir Saat Provinsi Diblokir** (`components/checkout-form.tsx`):
  - Menampilkan `"Tidak tersedia"` pada baris ongkir ketika provinsi yang dipilih termasuk daftar diblokir (`!provOk`).

### 1.4. Invoice, Upload Bukti & Lacak Pesanan
- [x] **UX-13 — Banner Konfirmasi Bukti Bayar Sudah Diunggah di Invoice** (`app/invoice/[orderId]/page.tsx`, `components/proof-upload.tsx`):
  - Menampilkan status konfirmasi waktu unggah ketika `order.proofUploadedAt` sudah terisi (beserta opsi unggah ulang bila diperlukan).
- [x] **UX-14 — Informasi Kurir & Resi di Halaman Invoice** (`app/invoice/[orderId]/page.tsx`):
  - Menampilkan kartu informasi pengiriman berisi nama kurir (`order.courierName`), nomor resi (`order.trackingNumber`), dan tombol salin resi.
- [x] **UX-15 — Tombol Salin Nomor Rekening, Unduh QRIS & Null-Guard `expiresAt` di Invoice** (`app/invoice/[orderId]/page.tsx`, `components/copy-button.tsx`):
  - Menambahkan komponen `<CopyButton>` untuk nomor rekening, tombol unduh gambar QRIS, serta null-guard pada `order.expiresAt`.
- [x] **UX-16 — Validasi Ukuran File 1 MB & Reset Input di `ProofUpload`** (`components/proof-upload.tsx`):
  - Menolak file `> 1 MB` di sisi klien sebelum memanggil server action, dan mereset `inputEl.value = ""` saat gagal agar pengguna dapat memilih ulang file.
- [x] **UX-17 — Tautan Lacak Resi Eksternal & Normalisasi Nomor WA di `/track-order`** (`app/track-order/page.tsx`):
  - Menambahkan tombol salin resi dan tautan eksternal pelacakan kurir (`courierTrackUrl`), serta menormalisasi awalan `08` menjadi `628` pada kedua sisi query SQL.

### 1.5. Panel Admin
- [x] **UX-18 — Komponen `<OrderActions>` di Detail Pesanan Admin** (`app/admin/orders/[id]/page.tsx`):
  - Memasang `<OrderActions>` langsung di halaman detail pesanan admin beserta informasi resi.
- [x] **UX-19 — Reset State Form Resi Setelah Transisi Order** (`components/order-actions.tsx`):
  - Memanggil `setResi(null)` saat perubahan status pesanan berhasil dan menambahkan tombol *Batal* pada form input resi.
- [x] **UX-20 — Tombol Aksi Cepat Produk di `/admin/products`** (`app/admin/products/page.tsx`, `components/product-row-actions.tsx`):
  - Menyediakan komponen `<ProductRowActions>` untuk toggle *Most Wanted*, toggle *Unggulan (Featured)*, dan *Hapus Produk* di tampilan mobile maupun desktop.
- [x] **UX-21 — Perbaikan Rollback `StockStepper`** (`components/stock-stepper.tsx`):
  - Menyimpan nilai `prev = stock` sebelum klik dan mengembalikan ke `prev` (bukan prop `initial` saat mount) jika request gagal.
- [x] **UX-22 — Sinkronisasi Preview Label Kondisi di `ProductForm`** (`components/product-form.tsx`):
  - Menyamakan rentang preview dengan `conditionLabel()` di `lib/condition.ts` (`9.5+` Like New, `9.0–9.4` Excellent, `8.0–8.9` Very Good, `6.0–7.9` Good, `< 6.0` Used).
- [x] **UX-23 — Reset State Error `fatal` di `LoginForm` & Rel Keamanan Link Admin** (`components/login-form.tsx`, `components/admin-nav.tsx`, `components/brands-manager.tsx`, `components/categories-manager.tsx`):
  - Mereset `setFatal(null)` saat form login disubmit ulang dan menambahkan `rel="noopener noreferrer"` pada seluruh link `target="_blank"`.

---

## 2. Masalah Styling & Konsistensi Visual (`DESIGN.md`)

- [x] **STYLE-01 — Harmonisasi Gaya Visual Beranda dengan Tema Pastel Y2K** (`app/page.tsx`):
  - Mengganti garis brutalist hitam kaku dan kotak tajam dengan kontur kartu `.y2k-card`, sudut membulat proporsional, dan badge `.y2k-pill-badge` sesuai `DESIGN.md`.
- [x] **STYLE-02 — Implementasi `.camera-viewfinder-frame` di CSS** (`app/globals.css`, `components/product-gallery.tsx`, `components/product-card.tsx`, `app/page.tsx`):
  - Menambahkan definisi `.camera-viewfinder-frame` (bingkai pembidik putus-putus halus saat *hover* sesuai `DESIGN.md:38-39`).
- [x] **STYLE-03 — Pasangan Font Aksen Judul Storefront** (`app/layout.tsx`, `app/globals.css`, `app/page.tsx`):
  - Memuat `Playfair_Display` (`--font-serif` / `font-display`) pendamping `Plus_Jakarta_Sans` (`--font-sans`) untuk aksen judul editorial Y2K.
- [x] **STYLE-04 — Definisi Utility `.scrollbar-none`** (`app/globals.css`):
  - Menambahkan class `.scrollbar-none` untuk merapikan bilah horizontal di beranda dan halaman pesanan admin.
- [x] **STYLE-05 — Ganti Warna Tailwind Hardcoded dengan Design Tokens** (`components/shop-shell.tsx`, `components/cart-view.tsx`, `components/checkout-form.tsx`, `app/invoice/[orderId]/page.tsx`, `app/track-order/page.tsx`, `components/login-form.tsx`, `components/admin-nav.tsx`):
  - Mengganti `bg-pink-50`, `bg-pink-100`, `border-pink-200`, `hover:bg-neutral-100` dengan variabel token (`bg-secondary`, `border-border`, `border-primary/20`).
- [x] **STYLE-06 — Penataan Visual Halaman `/returns` dan `/specifications`** (`app/returns/page.tsx`, `app/specifications/page.tsx`):
  - Merapikan tata letak halaman kebijakan retur & panduan spesifikasi menggunakan komponen `.y2k-card`, `.y2k-pill-badge`, dan ikon Lucide.
- [x] **STYLE-07 — Konsistensi Border Radius Dropdown & Komponen Navigasi** (`components/shop-shell.tsx`):
  - Mengubah `rounded-none` pada menu dropdown mobile menjadi `rounded-2xl` dengan bayangan lembut.

---

## 3. Masalah Layout Mobile & Standar Anti-Slop (`R-01` s/d `R-38`)

- [x] **SLOP-01 — Hapus Double Sticky Bar di Layar Mobile** (`app/page.tsx`):
  - Menghilangkan `sticky top-16` pada bilah brand di bawah hero agar tidak menumpuk dengan header utama (`sticky top-0 h-16`).
- [x] **SLOP-02 — Perbesar Tap Target Interaktif Mobile** (`components/cart-view.tsx`, `components/stock-stepper.tsx`, `app/products/page.tsx`, `components/hero-banner.tsx`, `components/categories-manager.tsx`, `components/product-form.tsx`):
  - Memperbesar ukuran sentuh tombol `-` / `+` di `CartView` (`h-9 w-9`) dan `StockStepper` (`h-8 w-8 sm:h-9 sm:w-9`), dot indikator di `HeroBanner` (`h-8`), chip filter & input harga di `/products`, serta tombol ikon di admin.
- [x] **SLOP-03 — Bersihkan Penggunaan Em Dash (`—`) di Seluruh Copy & Metadata** (`app/**/page.tsx`, `app/layout.tsx`, `app/returns/page.tsx`, `app/specifications/page.tsx`):
  - Mengganti karakter `—` pada judul metadata, isi teks halaman informasi, dan placeholder tabel admin.
- [x] **SLOP-04 — Ganti Emoji Dekoratif dengan Ikon Lucide / Label Bersih** (`app/products/page.tsx`, `app/admin/products/page.tsx`, `components/product-form.tsx`):
  - Mengganti emoji dekoratif `⚙`, `🔥`, `⭐`, `🌟`, `✨`, `👍`, `👌`, `📸`, `📷` dengan ikon Lucide (`SlidersHorizontal`, `Flame`, `Star`) dan badge bersih.
- [x] **SLOP-05 — Seragamkan Bahasa Indonesia Natural di Header & Footer** (`components/shop-shell.tsx`):
  - Mengubah teks navigasi dan footer dari bahasa Inggris generik menjadi bahasa Indonesia yang ramah dan konsisten.
- [x] **SLOP-06 — Hapus Klaim Tidak Akurat & Angka Hardcoded di UI** (`components/add-to-cart.tsx`, `components/proof-upload.tsx`, `components/checkout-form.tsx`, `components/shop-shell.tsx`, `app/page.tsx`, `app/products/page.tsx`):
  - Menghapus klaim bonus otomatis di toast `AddToCartButton`, klaim enkripsi di `ProofUpload`, klaim verifikasi instan di `CheckoutForm`, serta angka statis `All 32 Units`, fallback `31`, dan rentang harga statis di `/products`.
- [x] **SLOP-07 — Bersihkan Komentar Kode Dekoratif** (`app/page.tsx`, `components/shop-shell.tsx`, `components/hero-banner.tsx`, `components/admin-nav.tsx`):
  - Menghapus komentar banner `/* ============ ... ============ */` dan komentar pengulang elemen JSX.

# Milestone 2: Eksekusi Storefront, Checkout & Admin Control Plane

**Tujuan:** Membangun storefront khusus kamera digital vintage dan panel admin, terhubung ke Server Actions dengan validasi Zod.

---

## 📋 Daftar Tugas & Checklist Eksekusi

### 1. Storefront: Beranda (`app/(shop)/page.tsx`)
- [x] Hero carousel dari banner aktif; slide pertama prioritas LCP.
- [x] Pencarian kamera + trust strip (100% Tested & Functional, Video Unboxing Friendly, Free Accessories Pack, packing aman).
- [x] Navigasi brand/kategori populer.
- [x] Section *Best Sellers* (tag `best-seller`), *New Arrivals* (urutan `created_at`), *Featured* (flag `is_featured`).
- [x] Carousel testimoni dari database.
- [x] Tidak ada promo bertingkat.

### 2. Katalog & Filter (`app/(shop)/products/page.tsx`)
- [x] Filter dinamis database: brand, kategori, `condition_grade` rentang, `features`, harga IDR.
- [x] Sorting harga naik/turun, terbaru, unggulan.
- [x] SQL pagination, 16 produk/halaman.
- [x] Kartu kamera tampilkan foto, skor kondisi, badge fitur, harga IDR, status stok.

### 3. Detail Kamera / PDP (`app/(shop)/product/[slug]/page.tsx`)
- [x] Satu galeri berurutan: foto bodi + sample shots; sample shots diberi label.
- [x] Transparansi kondisi: skor 1–10, defects, inclusions, deskripsi asli.
- [x] Spesifikasi kamera: sensor, lensa, baterai, berat.
- [x] Stok per produk; tidak ada varian ukuran/warna.
- [x] Tombol beli dinonaktifkan jika sold out.
- [x] Badge social proof dari `features[]`.

### 4. Keranjang
- [x] Zustand Persist di `localStorage`, hidrasi SSR aman.
- [x] Satu produk = satu unit; quantity maksimal stok.
- [x] Tidak ada promo bertingkat.
- [x] Lazy Cart Drawer.

### 5. Checkout (`app/(shop)/cart/page.tsx`)
- [x] Form nama, WhatsApp, alamat, provinsi/kota, kode pos 5 digit.
- [x] Tarif ongkir dua zona (`utama`/`luar`) + pemetaan provinsi; berat kamera hanya info, bukan dasar hitung.
- [x] Metode QRIS/transfer dinamis + payment snapshot.
- [x] Harga dan stok dihitung ulang di server; transaksi PostgreSQL + `SELECT ... FOR UPDATE`.
- [x] Idempotency key mencegah order ganda.
- [x] Telegram Bot notifikasi async.

### 6. Invoice & Lacak Pesanan
- [x] Invoice unik format `VMW-YYYYMMDD-NNN`.
- [x] QRIS dapat diunduh; nomor rekening dapat disalin.
- [x] Upload JPG/PNG/WEBP maks. 1 MB ke bucket privat; fail-closed jika storage gagal.
- [x] Lacak status dengan nomor order + nomor HP; link tracking kurir.

### 7. Admin Control Plane (`app/admin/`)
- [x] Login sesi HMAC HTTP-Only 24 jam; rate limit 5 percobaan/15 menit/IP.
- [x] Dashboard metrik pesanan, stok kritis, omzet completed.
- [x] Manajemen order: transisi `PENDING_PAYMENT`→`PROCESSING`→`SHIPPED`→`COMPLETED`; cancel + restock idempoten (`stock_restored_at`); inspeksi bukti bayar; catatan internal.
- [x] Auto-cancel `PENDING_PAYMENT` **tanpa bukti bayar** setelah batas waktu default 2 jam (dapat diubah di Settings); order berbukti tetap pending sampai admin verifikasi; pemicu `GET /api/cron/auto-cancel` (Bearer `CRON_SECRET`) + fallback saat admin buka daftar order; restock atomik idempoten.
- [x] CRUD kamera: harga IDR, spesifikasi, kondisi terstruktur, stok, tag promo + flag Featured, multi-foto.
- [x] CRUD Settings: dua tarif zona + pemetaan provinsi + blokir wilayah, auto-cancel timeout, kontak, banner, metode pembayaran, testimoni, Telegram.

### 8. Halaman Informasi
- [x] `/specifications`, `/returns`, `/privacy`, `/terms`.

---

## 🎯 Kriteria Penerimaan
1. Storefront responsif mobile/desktop dan konsisten dengan Retro Y2K Pastel.
2. Alur transaksi lulus: kamera → cart → checkout → invoice → upload bukti → verifikasi admin → resi.
3. Harga/stok authoritative di server; order tidak oversell saat request bersamaan.
4. Pembatalan manual dan auto-cancel merestok tepat satu kali.
5. Notifikasi Telegram tidak memblokir checkout.
6. Typecheck lulus, seluruh kredensial memakai environment variable.

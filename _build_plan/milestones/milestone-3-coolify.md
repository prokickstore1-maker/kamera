# Milestone 3: Hardening Keamanan, SEO, Build Produksi & Deployment Coolify

**Tujuan:** Memvalidasi ketahanan aplikasi terhadap beban produksi, memastikan type-safety 100%, konfigurasi sitemap dinamis & robots.txt, serta finalisasi konfigurasi deployment ke server Coolify.

---

## 📋 Daftar Tugas & Checklist Eksekusi

### 1. Hardening Keamanan & Rate Limiting
- [x] **Rate Limiter In-Memory / Edge**:
  - Batasi request checkout: Maks. 10 pesanan per 15 menit per IP.
  - Batasi cek invoice / lacak resi: Maks. 15 request per 15 menit per IP.
  - Batasi login admin: Maks. 5 percobaan per 15 menit per IP.
- [x] **HTTP Headers Security**:
  - Terapkan `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - Header cache 1 tahun (`immutable`) untuk aset gambar dan static chunk publik.
- [x] **Health Check Endpoint**:
  - Buat route `/api/health` untuk memverifikasi koneksi database dan status server (digunakan oleh health-check Coolify).

### 2. SEO & Optimasi Search Engine
- [x] Buat sitemap dinamis di `app/sitemap.ts`:
  - Mengambil seluruh slug kamera aktif dari database PostgreSQL.
  - Membungkus kueri dalam `try/catch` agar sitemap tidak melempar HTTP 500 jika database sedang *maintenance*.
- [x] Buat file `app/robots.ts`:
  - Izinkan crawler publik mengindeks katalog (`/`, `/products`, `/product/*`).
  - Blokir jalur privat (`/admin/`, `/cart/`, `/invoice/`, `/api/`).
- [x] Metadata dinamis pada halaman detail produk (`generateMetadata` dengan OpenGraph tags, harga, dan foto utama).

### 3. Validasi Build & Type-Safety
- [x] Jalankan typecheck TypeScript penuh:
  ```bash
  npx tsc --noEmit
  ```
  *(Wajib lulus tanpa error / EXIT=0)*.
- [x] Jalankan linting:
  ```bash
  npm run lint
  ```
- [x] Uji production build lokal:
  ```bash
  npm run build
  ```

### 4. Deployment Coolify (Self-Hosted)
- [x] Pastikan file `Dockerfile` dan `.dockerignore` siap di root repository.
- [ ] Konfigurasi environment variables di dashboard Coolify:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `ADMIN_PASSWORD_HASH`
  - `ADMIN_SESSION_SECRET`
  - `CRON_SECRET`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CHAT_ID`
  - `S3_ENDPOINT`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_BUCKET_PUBLIC`
  - `S3_BUCKET_PRIVATE`
- [ ] Buat Coolify Scheduled Task: `GET /api/cron/auto-cancel` tiap 15 menit dengan header `Authorization: Bearer $CRON_SECRET`.
- [ ] Jalankan aplikasi **satu replica** — rate limiter in-memory dan lock auto-cancel hanya benar di satu instance.
- [ ] Hubungkan repository Git ke Coolify dengan webhook auto-deploy saat branch `main` di-push.
- [ ] Uji akses domain publik dan verifikasi SSL/TLS Let's Encrypt aktif otomatis di Coolify.

---

## 🎯 Kriteria Penerimaan (Definition of Done)
1. `npm run build` sukses membuat bundle standalone tanpa warning kritis.
2. Endpoint `https://domain.com/sitemap.xml` dan `https://domain.com/robots.txt` dapat diakses dengan valid.
3. Health check `/api/health` mengembalikan status HTTP 200 OK.
4. Container berjalan stabil di server Coolify dengan penggunaan memori yang terkontrol.

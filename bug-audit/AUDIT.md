# AUDIT.md - Log Audit & Pelacakan Bug Teknis vintagemeew

Dokumen ini melacak temuan bug teknis, status perbaikan, dan verifikasi kelayakan kode.

**Terakhir diperbarui:** 2026-10-28
**Metode audit:** pembacaan statis kode (runtime check `tsc`/`build` belum dijalankan — lihat bagian Verifikasi).

---

## 📋 Status Ringkasan

| Tingkat | Jumlah | Terbuka |
| :--- | ---: | ---: |
| Critical | 2 | 2 |
| High | 4 | 4 |
| Medium | 5 | 5 |
| Low | 4 | 4 |

---

## 🔴 CRITICAL

### C-1. `proofUrl()` tidak terautentikasi — bukti transfer pelanggan bocor

- **Lokasi:** `lib/actions.ts:275`
- **Masalah:** File berawalan `"use server"`, jadi setiap `export async function` di dalamnya otomatis menjadi endpoint Server Action. `proofUrl(orderId)` mengembalikan presigned URL bukti transfer **tanpa memanggil `isAdmin()`**. Siapa pun yang memiliki atau menebak UUID order dapat membaca slip bank pelanggan.
- **Dampak:** Pelanggaran guardrail #3 (`HANDOFF.md`): bukti bayar wajib privat, akses hanya lewat presigned berwaktu.
- **Perbaikan:** Tambahkan guard di awal fungsi.
  ```ts
  if (!(await isAdmin())) return null;
  ```
- **Status:** Terbuka

### C-2. Secret sesi admin punya fallback hardcoded

- **Lokasi:** `lib/admin-session.ts:8`
- **Masalah:**
  ```ts
  const s = process.env.ADMIN_SESSION_SECRET ?? "dev-secret-min-32-characters-0000";
  ```
  Bila environment variable lupa diisi di produksi, secret default dari repo dipakai. `verifyToken` hanya memvalidasi `exp` — tidak memeriksa klaim `role`. Penyerang dapat membuat cookie `vmw_admin` yang sah.
- **Dampak:** Ambil alih panel admin penuh (ubah stok, batalkan order, ubah rekening pembayaran).
- **Perbaikan:** Tolak start bila secret tidak ada di produksi:
  ```ts
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET wajib diisi");
    return Buffer.from("dev-secret-min-32-characters-0000");
  }
  ```
  Tambahkan juga `role === "admin"` pada `verifyToken`.
- **Status:** Terbuka

---

## 🟠 HIGH

### H-1. Duplikat `productId` dalam satu order membuat stok negatif

- **Lokasi:** `lib/actions.ts:136-141` (cek) dan `184-189` (pengurangan)
- **Masalah:** Cek stok membandingkan `p.stock` dari baris terkunci yang nilainya **tidak berubah** antar-iterasi, sementara pengurangan dilakukan per item.
  ```
  products p1.stock = 1
  items = [{ productId: p1, qty: 1 }, { productId: p1, qty: 1 }]
  cek   : 1 >= 1 ✓, 1 >= 1 ✓
  update: stock = 1 - 1 = 0, lalu 0 - 1 = -1
  ```
  Client dapat mengirim array duplikat lewat pemanggilan Server Action langsung (tidak melalui UI).
- **Dampak:** Stok negatif; produk tampil "Sold Out" padahal seharusnya bisa terjual, atau sebaliknya merusak logika restock (restock menambah 2 ke stok yang tadinya hanya berkurang 1).
- **Perbaikan:** Agregasi `items` per `productId` **sebelum** transaksi (gabungkan `qty`), lalu jalankan alur yang ada terhadap array hasil agregasi.
- **Status:** Terbuka

### H-2. Nomor pesanan bisa bentrok — retry tidak pernah diimplementasikan

- **Lokasi:** `lib/actions.ts:144-153`
- **Masalah:** Komentar di kode menyebut *"race ditangani unique constraint + retry di luar"*, tetapi **tidak ada blok retry**. Dua checkout bersamaan menghitung `count()` yang sama, menghasilkan `orderNumber` identik, lalu insert gagal dengan error Postgres `23505 duplicate key`.
  Nomor urut juga dihitung dari `count()` — bila ada order yang terhapus, nomor berikutnya akan bertabrakan dengan yang sudah ada.
- **Dampak:** Pembeli menerima pesan error mentah database pada jam sibuk; order tidak terbentuk walau stok sudah dicek.
- **Perbaikan:** Ganti `count()` dengan `SELECT max(order_number)` untuk tanggal berjalan, lalu bungkus insert dalam retry loop 3× khusus error `23505`.
- **Status:** Terbuka

### H-3. Lacak pesanan gagal saat format nomor HP berbeda

- **Lokasi:** `app/track-order/page.tsx:28-31` (normalisasi input) dan `:57` (query)
- **Masalah:** `normalizeWa` hanya menormalkan **input pengguna** (`0…` → `62…`). Nilai tersimpan di kolom `orders.customer_phone` adalah apa pun yang diketik saat checkout — bisa `0812…`, `+62812…`, atau `62812…`. Query membandingkan hasil normalisasi input dengan kolom DB yang **tidak dinormalkan dengan aturan sama**.
  ```
  DB tersimpan: "+6281234567890"
  lacak input : "081234567890"  → dinormalkan "6281234567890"
  hasil       : tidak cocok → "Pesanan tidak ditemukan"
  ```
- **Dampak:** Pembeli sah tidak bisa melacak pesanannya. Bug yang langsung terasa pengguna.
- **Perbaikan:** Normalkan kedua sisi di SQL, bukan hanya input:
  ```sql
  regexp_replace(regexp_replace(customer_phone, '[^0-9]', '', 'g'), '^0', '62')
  ```
  Bandingkan dengan nilai input yang dinormalkan dengan aturan identik.
- **Status:** Terbuka

### H-4. `uploadProof()` dan `cancelExpiredOrders()` tanpa autentikasi

- **Lokasi:** `lib/actions.ts:217` dan `lib/actions.ts:303`
- **Masalah:** Keduanya diekspor dari file `"use server"`, sehingga dapat dipanggil langsung tanpa sesi.
  - `uploadProof` — siapa pun dapat mengunggah file 1 MB berulang ke bucket privat order mana pun yang UUID-nya diketahui, sekaligus memicu notifikasi Telegram (spam + biaya storage).
  - `cancelExpiredOrders` — idempoten sehingga tidak merusak data, tetapi tetap permukaan serangan (DoS ringan lewat pemanggilan berulang).
- **Dampak:** Penyalahgunaan storage, spam Telegram, beban DB.
- **Perbaikan:** `uploadProof` — batasi ke order yang sedang `PENDING_PAYMENT` (sudah ada) **dan** beri rate limit per IP. `cancelExpiredOrders` — pindahkan ke modul non-`"use server"` (`lib/orders.ts`) agar hanya dapat dipanggil dari server, lalu ekspor pembungkus ber-otorisasi untuk route cron.
- **Status:** Terbuka

---

## 🟡 MEDIUM

### M-1. Rate limiting dapat dilewati lewat `x-forwarded-for`

- **Lokasi:** `lib/rate-limit.ts:27`
- **Masalah:** IP diambil dari header `x-forwarded-for` pertama, yang sepenuhnya dikendalikan klien bila tidak ada trusted proxy. Header dapat dipalsukan per request sehingga kuota (checkout 5/15 menit, login admin 5/15 menit, lacak 15/15 menit) tidak pernah tercapai.
- **Perbaikan:** Baca `x-real-ip` lebih dulu, atau konfigurasi daftar proxy tepercaya dan ambil entri paling kanan dari `x-forwarded-for` yang berasal dari proxy tersebut.
- **Status:** Terbuka

### M-2. Keranjang tidak pernah disinkronkan dengan stok server

- **Lokasi:** `lib/cart.ts:75` (`sync`) — pencarian pemanggil: **nol**
- **Masalah:** `cartActions.sync()` didefinisikan tetapi tidak dipanggil dari mana pun. Stok dan harga di `localStorage` tetap seperti saat barang ditambahkan. Bila admin mengubah stok, pembeli baru mengetahui saat checkout ditolak server.
- **Perbaikan:** Panggil `sync()` saat halaman `/cart` dan `/checkout` dimuat, menggunakan data ringkas dari Server Action.
- **Status:** Terbuka

### M-3. Rate limit checkout dihitung sebelum pemeriksaan idempotensi

- **Lokasi:** `lib/actions.ts:92` (limit) vs `:102` (cek idempotency)
- **Masalah:** Retry karena jaringan buruk atau klik ganda tetap menghabiskan kuota 5 order/15 menit, walau request tersebut mengembalikan order yang sama dan tidak membuat order baru.
- **Perbaikan:** Pindahkan cek `idempotencyKey` ke atas pemanggilan `rateLimit`.
- **Status:** Terbuka

### M-4. `type="file"` tanpa validasi ukuran di sisi klien

- **Lokasi:** `components/proof-upload.tsx`
- **Masalah:** Validasi 1 MB hanya terjadi di server setelah seluruh file diunggah ke memori. Pengguna dengan koneksi lambat menunggu unggahan penuh sebelum ditolak (tidak ada umpan balik cepat, memboroskan kuota).
- **Perbaikan:** Tambahkan `if (f.size > 1024*1024)` sebelum memanggil `uploadProof`.
- **Status:** Terbuka

### M-5. `cancelExpiredOrders()` dibatasi 50 order per pemanggilan tanpa penanda lanjutan

- **Lokasi:** `lib/actions.ts:316`
- **Masalah:** `.limit(50)` tanpa loop lanjutan. Bila ada lebih dari 50 order kedaluwarsa (mis. setelah toko lama tidak dibuka), sisanya baru diproses pada pemanggilan berikutnya. Tidak ada indikasi ke pemanggil bahwa masih ada sisa.
- **Perbaikan:** Loop sampai hasil kosong, atau kembalikan `{ cancelled, remaining }`.
- **Status:** Terbuka

---

## 🟢 LOW

### L-1. Angka fallback hardcoded di beranda

- **Lokasi:** `app/page.tsx:105` dan blok statistik
- **Masalah:** Nilai cadangan `31`, `2.3jt`, `20jt` ditulis manual. Dataset berisi 32 produk; bila DB kosong, angka yang tampil menyesatkan.
- **Perbaikan:** Tampilkan `0` atau sembunyikan blok statistik saat `stats.total === 0`.
- **Status:** Terbuka

### L-2. Parsing key S3 rapuh pada endpoint berpath

- **Lokasi:** `lib/actions.ts:284`
- **Masalah:** `u.pathname.replace(/^\/[^/]+\//, "")` mengasumsikan `S3_ENDPOINT` tanpa prefiks path. Bila endpoint berbentuk `https://host/storage`, segmen pertama yang terbuang adalah `storage`, bukan nama bucket — key yang ditandatangani salah.
- **Perbaikan:** Simpan `objectKey` di kolom tersendiri saat upload (skema `orders` belum punya kolom ini), jangan parsing ulang dari URL.
- **Status:** Terbuka

### L-3. Nilai filter `condition` tidak divalidasi

- **Lokasi:** `app/products/page.tsx:53`
- **Masalah:** Cast `as CatalogFilters["condition"]` menerima string apa pun dari query. Nilai tidak dikenal membuat `condWhere()` mengembalikan `undefined` — filter diam-diam diabaikan, menampilkan seluruh produk seolah tidak ada filter.
- **Perbaikan:** Validasi terhadap himpunan `"gte9" | "gte7" | "lt7"` sebelum dipakai.
- **Status:** Terbuka

### L-4. `scrollbar-none` tidak terdefinisi

- **Lokasi:** `app/page.tsx:164`, `app/admin/orders/page.tsx:82`
- **Masalah:** Kelas dipakai tetapi tidak ada deklarasi di `globals.css` dan bukan utilitas bawaan Tailwind v4. Scrollbar horizontal tetap tampil.
- **Perbaikan:** Tambahkan utilitas di `globals.css`:
  ```css
  .scrollbar-none { scrollbar-width: none; }
  .scrollbar-none::-webkit-scrollbar { display: none; }
  ```
- **Status:** Terbuka

---

## ⚠️ Ambiguitas Dokumen vs Implementasi

Temuan berikut bukan bug kode, melainkan **dokumen yang tidak lagi sesuai kenyataan**. Wajib diselaraskan agar sesi berikutnya tidak salah asumsi.

| # | Dokumen | Klaim dokumen | Kenyataan kode | Tindakan |
| :-- | :--- | :--- | :--- | :--- |
| A-1 | `MVP.md:67`, `_build_plan/prd.md:33,131`, `00-DOCS.md:36`, `milestone-2-core.md:32` | Keranjang memakai **Zustand Persist** | Implementasi memakai store native (`useSyncExternalStore` + `localStorage`) di `lib/cart.ts`; `zustand` tidak ada di `package.json` | Perbarui dokumen, atau putuskan pindah ke Zustand |
| A-2 | `HANDOFF.md:95` | "Shadcn UI terpasang" tercantum sebagai **pekerjaan yang belum dilakukan** | Shadcn **sudah** terpasang: 16 komponen di `components/ui/`, dependensi Radix + `sonner` + `class-variance-authority` ada di `package.json` | Hapus dari daftar pending |
| A-3 | `AGENTS.md:22` | Tech stack menyebut Shadcn UI | Konsisten dengan kenyataan (sudah terpasang) | Tidak perlu diubah — catat bahwa A-2 sudah basi |
| A-4 | `HANDOFF.md:28` | Lokasi toko **Pare, Kediri, Jawa Timur** | **Sudah konsisten**: `app/page.tsx:53` ("Pare, Kediri · Sejak 2024"), `app/layout.tsx:15`, `shop-shell.tsx:256`, `db/seed.ts:347,385,390` | ✅ **Selesai** — keputusan user 2026-10-28: **Pare** |
| A-5 | `app/page.tsx:53` | Label hero | Sudah "Pare, Kediri · Sejak 2024" | ✅ **Selesai** — konsisten dengan `settings` |
| A-6 | `MVP.md`, `prd.md` | Auto-cancel dipicu cron `/api/cron/auto-cancel` | Route ada, tetapi belum ada Scheduled Task Coolify; saat ini hanya terpicu saat admin membuka `/admin/orders` | Catat sebagai ketergantungan deployment di Milestone 3 |
| A-7 | `prd.md:8` / `AGENTS.md` | Next.js 14+ | Terpasang **16.4.3** (breaking changes besar — lihat seksi Next.js 16 di `AGENTS.md`) | Sudah dikoreksi di `AGENTS.md`; `prd.md` masih menyebut "14+" secara umum |
| A-8 | `_build_plan/milestones/milestone-2-core.md` | Checklist Milestone 2 sebagian besar `[ ]` belum dicentang | Sebagian besar fitur sudah ditulis (storefront, checkout, admin, invoice, cron) | Centang yang benar-benar selesai setelah verifikasi `tsc`/`build` |

---

## 🔍 Bagian Belum Terverifikasi

Audit ini **statis** — pembacaan kode, bukan eksekusi. Yang belum pernah dijalankan pada sesi ini:

1. `npm install` untuk dependensi baru (`vitest`, `bcryptjs`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
2. `npx vitest run` — 5 file test di `lib/*.test.ts`
3. `npx tsc --noEmit`
4. `npm run lint`
5. `npm run build`
6. Uji runtime alur penuh (checkout → invoice → upload → admin → cron)

Temuan bertanda **TypeScript-level** (mis. tipe `paymentSnapshot` vs `PaymentSnapshot`, signature Drizzle `.for("update")`) belum tervalidasi dan bisa berubah setelah typecheck dijalankan.

---

## 🛡️ Standar Verifikasi Bug Fix

Setiap bug yang dinyatakan resolved wajib memenuhi:

1. Typecheck `npx tsc --noEmit` sukses (**EXIT=0**).
2. Test reproduksi gagal sebelum perbaikan dan lulus sesudahnya.
3. Tidak menimbulkan regresi pada transaksi ACID stok atau validasi pembayaran.

---

## 📌 Urutan Pengerjaan yang Disarankan

1. **C-1, C-2** — keamanan, perubahan kecil, dampak besar.
2. **H-1, H-2** — integritas data; keduanya menyentuh `lib/actions.ts` yang sama.
3. **H-3** — bug yang dirasakan pembeli.
4. **H-4, M-1** — permukaan serangan.
5. **A-4, A-5** — tentukan identitas lokasi toko (blocker konten).
6. **M-2, M-3, L-4** — perbaikan cepat.
7. Sisanya setelah verifikasi runtime tersedia.

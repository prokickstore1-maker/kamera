# Spesifikasi Desain: Fitur Edit & Hapus Kamera Admin Panel (vintagemeew)

**Tanggal:** 2026-10-28  
**Status:** Disetujui (Approved)  
**Tujuan:** Memberikan kendali penuh CRUD inventaris kamera digicam kepada admin toko melalui rute `/admin/products/[id]/edit`, pembaruan data atomik, sinkronisasi foto & tag, serta proteksi penghapusan kamera berpesanan aktif.

---

## 1. Arsitektur & Komponen

### 1.1 Rute & Halaman
- **`/admin/products/[id]/edit` (`app/admin/products/[id]/edit/page.tsx`)**:
  - Halaman Server Component terproteksi guard `isAdmin()`.
  - Mengambil parameter asinkron `const { id } = await params` (Next.js 16 App Router).
  - Mengambil data produk lengkap beserta relasinya:
    - Baris tabel `products`
    - Galeri `productImages` diurutkan berdasarkan `position ASC`
    - Status tag `best-seller` dari `productTags`
    - Daftar seluruh `brands` dan `categories` aktif untuk opsi dropdown.
  - Me-render form terpadu: `<ProductForm brands={allBrands} categories={allCats} initialData={initialData} />`.

### 1.2 Form Terpadu Reusable (`components/product-form.tsx`)
- Mendukung dua mode:
  - **Mode Tambah Baru** (`initialData === undefined`): Judul "Upload & Kurasi Kamera Baru", tombol aksi "Terbitkan Kamera ke Katalog".
  - **Mode Edit** (`initialData !== undefined`): Judul "Edit Kamera: [Nama]", tombol aksi "Simpan Perubahan", tombol sekunder "Hapus Kamera" dengan dialog konfirmasi.
- Inisialisasi state dari `initialData`:
  - Identitas: `name`, `brandId`, `categoryId`, `priceIdr`, `stock`, `weightGrams`.
  - Kondisi Vintage: `conditionGrade`, `defects`, `inclusions` (chip aktif).
  - Karakter & Spek: `description`, `features` (chip aktif).
  - Galeri Foto: daftar gambar bodi & sample shots yang sudah ada, mempertahankan status foto utama (`isPrimary`) dan urutan.
  - Opsi Publikasi: `active`, `isFeatured`, `isMostWanted`.

### 1.3 Server Actions (`lib/admin-actions.ts`)
1. **`updateProductAction(productId: string, data: ProductInputData)`**:
   - Guard sesi admin (`await guard()`).
   - Validasi nama (minimal 3 karakter) dan harga IDR (minimal Rp 100.000).
   - Resolusi Brand & Kategori dinamis (dukungan tambah baru jika admin mengetikkan nama baru).
   - Update data produk di tabel `products` (`updatedAt: new Date()`).
   - Sinkronisasi galeri foto:
     - Hapus foto lama di tabel `productImages` untuk produk ini.
     - Masukkan kembali foto yang tersusun di state form dengan urutan `position` dan tanda `isPrimary`.
   - Sinkronisasi tag `best-seller` (Most Wanted):
     - Jika `isMostWanted === true`, hubungkan ke `productTags`.
     - Jika `isMostWanted === false`, hapus relasi dari `productTags`.
   - Invalidasi cache Next.js 16:
     - `updateTag("products")`
     - `revalidatePath("/admin/products")`
     - `revalidatePath("/products")`
     - `revalidatePath("/")`
     - `revalidatePath(`/product/${product.slug}`)`
   - Mengembalikan `{ ok: true, slug: product.slug }`.

2. **`deleteProductAction(productId: string)` (Hardening & Proteksi)**:
   - Guard sesi admin.
   - Pengecekan relasi pesanan aktif:
     - Cek apakah kamera ini terhubung pada pesanan berstatus `PENDING_PAYMENT` atau `PROCESSING` di tabel `orderItems` + `orders`.
     - Jika ada pesanan yang belum selesai, tolak penghapusan dan kembalikan pesan ramah:  
       `"Kamera tidak dapat dihapus karena masih berada dalam pesanan aktif. Selesaikan pesanan atau ubah status kamera menjadi DRAFT terlebih dahulu."`
   - Jika aman, lakukan `db.delete(products).where(eq(products.id, productId))`.
   - Foreign key database secara otomatis menghapus galeri (`cascade`) dan tag (`cascade`), serta menjaga riwayat pesanan masa lalu (`set null`).
   - Invalidasi cache katalog & admin.

### 1.4 Aksi Cepat di Daftar Inventaris (`app/admin/products/page.tsx`)
- **Tabel Desktop (`>= md`)**:
  - Kolom baru: "Aksi".
  - Tombol **Edit** (`/admin/products/[id]/edit`) dengan ikon `Pencil`.
  - Tombol **Hapus** dengan dialog konfirmasi (`Dialog` Shadcn) dan status loading.
- **Kartu Mobile (`< md`)**:
  - Baris aksi di bagian bawah kartu:
    - Tombol Edit (lebar penuh / fleksibel).
    - Tombol Hapus dengan dialog konfirmasi.

---

## 2. Rencana Pengujian & Verifikasi Mutu

1. **Typecheck & Linter**:
   - `npx tsc --noEmit` wajib **EXIT=0**.
   - `npm run lint` wajib **EXIT=0**.
   - `npx vitest run` wajib **PASS 100%**.
2. **Uji Fungsional Runtime**:
   - Buka `/admin/products`, pilih salah satu kamera, klik Edit.
   - Ubah harga, tambah kelengkapan aksesoris, ubah status Most Wanted.
   - Klik "Simpan Perubahan" dan verifikasi pembaruan langsung tercermin di katalog storefront `/products` dan PDP kamera.
   - Uji coba dialog hapus pada kamera tanpa pesanan vs kamera berpesanan aktif.

# vintagemeew - Digicam Store Scraper & Dataset

Data hasil scraping lengkap dari [Girly Glimpse](https://girlyglimpse.com/) untuk katalog dan fondasi produk e-commerce **vintagemeew** (Toko kamera digital/digicam preloved & brand new Pare, Kediri).

## 📊 Ringkasan Data (Dataset Summary)

- **Total Produk**: 32 Kamera
- **Total Gambar**: 94 Foto Resolusi Penuh (30.5 MB)
- **Kategori**: 11 Kategori (Beginner Friendly, Canon G7X, Celebrity's Pick, Compact, Pink Collection, Point & Shoot, dll)
- **Brand**: Canon, Fujifilm, Nikon, Sony
- **Rentang Harga IDR**: Rp 2.300.000 s/d Rp 20.000.000
- **Mata Uang Dipakai Toko**: **IDR saja**. Kolom `price_usd` di dataset mentah hanya arsip scrape, diabaikan oleh seeder.
- **Kondisi Kamera**: Very good, Like New, Good, Used, Brand New, Wifi support
- **Tarif Pengiriman**: 82 destinasi internasional di `shipping_rates.json` — **tidak dipakai** (ongkir toko berbasis dua zona domestik; file tidak di-seed)

---

## 📁 Struktur Direktori

```
kamera pung lallang/
├── data/
│   ├── products.csv          # Spreadsheet Excel-ready dengan semua spesifikasi & URL
│   ├── products.json         # Raw JSON 32 produk lengkap dengan relasi DB
│   ├── categories.json       # 11 kategori produk
│   ├── brands.json           # 4 brand terdaftar
│   ├── tags.json             # 15 tag (kondisi & promo/influencer picks)
│   ├── locations.json        # Alamat gudang (PII) — .gitignore, jangan di-seed
│   ├── shipping_rates.json   # 82 tarif internasional — tidak dipakai, tidak di-seed
│   ├── summary.json          # Statistik dataset
│   └── images/               # 94 foto produk tersimpan per folder produk slug
│       ├── canon-g7x-mark-ii/
│       ├── nikon-coolpix-s3600/
│       └── ... (32 folder kamera)
├── scrape_girlyglimpse.py    # Script scraper Python otomatis
└── README.md                 # Dokumentasi dataset
```

---

## 🚀 Menjalankan Ulang Scraper

Jika ingin memperbarui data di masa depan, jalankan:

```bash
# Update semua data JSON dan CSV (cepat, ~1-2 detik)
python scrape_girlyglimpse.py

# Update data sekaligus download/sinkronisasi semua gambar produk
python scrape_girlyglimpse.py --download-images
```

---

## 📋 Kolom pada `products.csv`

1. `id` - UUID produk
2. `name` - Nama kamera (e.g., Nikon Coolpix S3600, Canon G7X Mark II)
3. `slug` - URL identifier
4. `product_url` - Link detail ke website
5. `brand` - Canon, Nikon, Sony, Fujifilm
6. `category` - Kategori produk
7. `condition` - Kondisi fisik (Like New, Very Good, Good, etc.)
8. `promo_tags` - Hailey Bieber's, Pink, Best Seller, dll.
9. `all_tags` - Gabungan semua tag
10. `price_idr` - Harga Rupiah (**satu-satunya mata uang yang dipakai**)
11. `price_usd` - Harga USD (hanya arsip dataset, diabaikan seeder)
12. `stock` - Stok unit tersedia
13. `weight_grams` - Berat kamera (gram)
14. `active` / `featured` - Status ketersediaan
15. `image_count` - Jumlah foto
16. `primary_image_url` - Link foto utama
17. `all_image_urls` - Semua link foto (dipisah tanda `|`)
18. `features` - Fitur utama
19. `specifications` - Sensor, Lens, Battery, Zoom
20. `details` - Minus/defects, kelengkapan/inclusions, kondisi body
21. `description` - Deskripsi singkat
22. `locations` - Lokasi pengiriman fisik

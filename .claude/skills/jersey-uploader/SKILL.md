---
name: jersey-uploader
description: Use when importing, scraping, or uploading football jersey products and multi-angle galleries to ProKick Store
---

# Jersey Uploader (ProKick Store)

## Overview
Upload jersey dari URL supplier ke ProKick Store. Mendukung klub & tim nasional mana pun.
Sumber kebenaran ada di `scripts/upload-jersey.mjs` — dokumen ini hanya ringkasan operasional.

---

## Alur Kerja

### Langkah 1: Jalankan uploader

```bash
node scripts/upload-jersey.mjs --url "https://www.zoabcd.com/products/..." --price 150000
```

Flag: `--url` (wajib), `--name`, `--team`, `--league`, `--season`, `--type`, `--kitType`, `--category`, `--country`, `--description`, `--price`.

Script scrape halaman supplier (`scrapeProduct`), deteksi metadata (`detectJerseyMetadata` + `TEAMS_DB`), upload gambar ke S3 prefix `products/`, upsert `jerseys`, lalu tulis ulang `jersey_images`.

### Langkah 2: Periksa hasil

- Harga default `120000.00` — script **tidak** menghitung harga dari kategori/lengan. Kirim `--price` sesuai matriks.
- Stok awal tetap `{ S:10, M:15, L:20, XL:15, XXL:10 }` (total 70), tanpa flag pengubah.
- `edition` diturunkan dari `type === 'Retro' ? 'Vintage' : 'Current'`.
- Upsert cocokkan `name` ATAU `team + season + kit_type + type`.

**Peringatan:** script juga menulis salinan foto ke `public/images/jerseys/`. Jangan stage/commit salinan itu — bersihkan setelah upload. File lokal membengkakkan Docker context dan memperlambat build Coolify.

### Langkah 3: Verifikasi

1. URL S3 HTTP 200.
2. `/product/<id>` dan `/jersey?team=<Team>` menampilkan produk + galeri.
3. `node_modules/.bin/tsc --noEmit` EXIT=0.

---

## Matriks Harga (wajib)

| Kategori | Varian | Kode URL/Judul | Harga (IDR) |
|---|---|:---:|:---:|
| Jersey Klub (Player Issue) | Lengan Pendek | tanpa `ls` | Rp 120.000 |
| Jersey Klub (Player Issue) | Lengan Panjang | `ls`, `-ls-` | Rp 150.000 |
| Tim Nasional | Lengan Pendek | tanpa `ls` | Rp 150.000 |
| Tim Nasional | Lengan Panjang | `ls`, `-ls-` | Rp 180.000 |
| Retro (Vintage) | Lengan Pendek | `retro`/`classic` | Rp 150.000 |
| Retro (Vintage) | Lengan Panjang | `ls` + retro | Rp 180.000 |

---

## Filter Kurasi Supplier

**Upload:** klub & timnas modern 2024–2027 (Player Issue: `pv`, `player`, `authentic`), semua retro, semua edisi kit (Home/Away/Third/Fourth/GK/Special/Pre-Match).

**Skip:** `kids`/`children`/`little`/`baby`, `women`/`female`/`lady`, dan non-jersey (shorts, jaket, hoodie, windbreaker, training pants, polo, socks).

---

## Auto-Detect Tim (referensi `TEAMS_DB`)

| Keyword | Tim | Liga |
|---|---|---|
| `arsenal`, `ars` | Arsenal | Premier League |
| `madrid`, `rma` | Real Madrid | La Liga |
| `barcelona`, `barca`, `fcb` | Barcelona | La Liga |
| `manchester united`, `mufc` | Manchester United | Premier League |
| `manchester city`, `mcfc` | Manchester City | Premier League |
| `liverpool`, `lfc` | Liverpool | Premier League |
| `chelsea`, `cfc` | Chelsea | Premier League |
| `tottenham`, `spurs` | Tottenham | Premier League |
| `bayern`, `munchen` | Bayern Munich | Bundesliga |
| `dortmund`, `bvb` | Borussia Dortmund | Bundesliga |
| `juventus`, `juve` | Juventus | Serie A |
| `milan`, `acm` | AC Milan | Serie A |
| `inter` | Inter Milan | Serie A |
| `roma` | AS Roma | Serie A |
| `psg`, `paris` | Paris Saint-Germain | Ligue 1 |
| `indonesia`, `timnas` | Indonesia | World Cup (Tim Nasional) |
| `argentina`, `brazil`, `japan`, `germany`, `portugal`, `england`, `france`, `spain` | Tim nasional masing-masing | World Cup (Tim Nasional) |

Deteksi kit: `away`/`-a-` → Away, `third`/`3rd`/`-th-` → Third, `fourth`/`4th` → Fourth, default Home.

---

## S3 Config

- Env: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`.
- Key: `products/<slug>-angle-<N>.jpg`
- ACL: `public-read` (wajib)

Uploader **tidak** punya fallback kredensial — env wajib diisi. (Kode aplikasi masih punya fallback; itu tercatat sebagai temuan #43 di `bug-audit/AUDIT.md`.)

---

## Ekstraksi Browser (cadangan)

Bila supplier memblokir `fetch`, user buka halaman produk di browser lalu jalankan di console:

```js
JSON.stringify(
  [...document.querySelectorAll('script')]
    .map(s => s.textContent)
    .filter(t => t && t.includes('"images"'))
    .map(t => { const m = t.match(/"images"\s*:\s*(\[[\s\S]*?\])/); if (m) try { return JSON.parse(m[1]); } catch {} return null; })
    .filter(Boolean).flat()
    .filter(img => img && img.src)
    .map(img => img.src.startsWith('//') ? 'https:' + img.src : img.src)
)
```

Hasilnya array URL gambar hi-res; pakai untuk alur manual yang disetujui.

---

## Checklist Pasca-Upload

- [ ] Harga sesuai matriks
- [ ] Gambar S3 → HTTP 200
- [ ] Halaman produk live tampil lengkap
- [ ] `public/images/jerseys/` sudah dibersihkan & tidak ter-stage
- [ ] `tsc --noEmit` EXIT=0

# DESIGN.md - Panduan Visual & Estetika vintaagemeew

**Style Archetype:** Retro Y2K / Aesthetic Pastel Digicam  
**Mode Default:** Light Mode First (dengan dukungan Dark Mode)  
**Referensi Token:** [_build_plan/blueprints/theme-config.css](file:///d:/project%20web/kamera%20pung%20lallang/_build_plan/blueprints/theme-config.css)

---

## 🎨 1. Konsep & Nuansa Visual

- **Vibe**: Nostalgia era 2000-an, nuansa kamera saku digital (digicam), chic, playful, lembut, namun tetap terpercaya dan transparan.
- **Warna Dasar**:
  - `Background`: Warm Cream Paper (`#fffbf9` / `hsl(350 40% 98%)`)
  - `Surface / Card`: Pure White (`#ffffff`) dengan border pastel tipis
  - `Primary / Accent`: Vibrant Y2K Rose Pink (`#ec4899` / `hsl(330 81% 60%)`)
  - `Secondary Accent`: Soft Blush (`#fdf2f8`) & Pastel Petal (`#fbcfe8`)
  - `Text Main`: Deep Charcoal Plum (`#2e1d27` / `hsl(320 20% 15%)`)
  - `Text Muted`: Dusty Plum (`#7d6b76`)
  - `Border`: Delicate Pastel Pink (`#fae1e8`)

---

## 🔤 2. Tipografi

- **Body & UI**: `Plus Jakarta Sans` atau `Outfit` (bersih, sans-serif modern, keterbacaan tinggi di layar kecil).
- **Branding & Accent Heading**: Font kaligrafi halus atau serif chic (misal: *Cabinet Grotesk* atau *Great Vibes*) untuk aksen judul storefront.

---

## 🏷️ 3. Komponen Khas (Custom Y2K Components)

1. **Card Kamera (`.y2k-card`)**:
   - Card putih berkontur border pastel halus dengan hover lift mikro (`translateY(-3px)`).
   - Bayangan halus berwarna rose tint (`rgba(236, 72, 153, 0.12)`).
2. **Pill Badge Status (`.y2k-pill-badge`)**:
   - Badge oval kecil untuk kondisi fisik kamera (*Like New, Very Good, Brand New, Wifi*).
   - Latar blush lembut dengan teks rose kontras tinggi.
3. **Camera Viewfinder Frame (`.camera-viewfinder-frame`)**:
   - Efek frame pembidik kamera dengan garis putus-putus tipis yang muncul halus saat foto di-hover.

---

## 🚫 4. Prinsip Anti-AI Slop

- **Hindari Elemen Generik**: Jangan gunakan gradien neon acak, rounded border ekstrem tanpa proporsi, atau ilustrasi 3D generik.
- **Fokus pada Objek Nyata**: Produk utama adalah kamera fisik; prioritaskan foto kamera resolusi tinggi dengan latar bersih.
- **Copywriting Otentik**: Gunakan bahasa Indonesia kasual yang ramah dan jujur (misal: *"Kondisi bodi 9/10, lensa jernih, minus gores halus pemakaian normal"*), bukan bahasa marketing berbunga-bunga yang klise.

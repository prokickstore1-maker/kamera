<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md - Panduan Operasional & Aturan Kerja Agen (vintaagemeew)

Dokumen ini adalah pedoman kerja wajib untuk setiap AI Agent yang beroperasi di dalam repository **vintaagemeew**.

---

## 📌 Ringkasan Identitas Proyek

- **Nama Proyek**: **vintaagemeew**
- **Domain Produk**: E-Commerce Kurasi Kamera Digital Vintage & Preloved (Digicam).
- **Aesthetic Direction**: **Retro Y2K / Aesthetic Pastel Digicam** (Light Mode First).
- **Tech Stack**: Next.js **16.4** (App Router, Turbopack default, React **19.3**) + Tailwind CSS **v4** + Shadcn UI + Drizzle ORM (PostgreSQL) + S3/MinIO Object Storage + Coolify Deployment.
- **Master Blueprint**: [MVP.md](file:///d:/project%20web/kamera%20pung%20lallang/MVP.md) dan [_build_plan/prd.md](file:///d:/project%20web/kamera%20pung%20lallang/_build_plan/prd.md).

---

## 📘 Aturan Next.js 16 (Wajib Baca Sebelum Kode)

Dokumen resmi versi terpasang ada di **`node_modules/next/dist/docs/`** (mirror https://nextjs.org/docs, tiap halaman juga punya `.md`). Baca dari sana, **bukan dari ingatan pelatihan** — API 16 beda dari 14/15. Panduan migrasi: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.

Breaking changes yang paling sering salah di proyek ini:

1. **Async Request APIs**: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` **wajib `await`**. Komponen/page: `const { slug } = await params`.
2. **Cache invalidation Server Action**: `revalidateTag(tag)` satu argumen = error TS. Dua opsi:
   - `revalidateTag(tag, 'max')` — biarkan pembaca pakai data lama sebentar (katalog, settings, banners).
   - `updateTag(tag)` — **read-your-writes**, dipakai saat admin mengubah data lalu UI harus langsung benar. **Ini pengganti `revalidateTag(tag, { expire: 0 })`** (pola lama, sudah tidak ada) untuk invalidasi instan di Server Action.
3. **Caching model lama masih hidup** selama `cacheComponents` tidak diaktifkan: `unstable_cache` + tag tetap sah (lihat `01-app/02-guides/caching-without-cache-components.md`). Jangan mengaktifkan `cacheComponents`/`use cache` tanpa keputusan eksplisit — butuh `<Suspense>` di mana-mana.
4. **`middleware.ts` → `proxy.ts`** (konvensi baru). Middleware lama dipindah via codemod, bukan rename buta.
5. **`sitemap()` / `imageGeneration()`**: parameter `id` **async**, wajib `await`.
6. **Turbopack default** untuk `next dev` & `next build` — jangan tambah flag `--turbopack`, jangan pasang plugin webpack.
7. **`next lint` dihapus** — lint via CLI: `npm run lint` (`eslint`). ESLint 9 flat config.
8. **Runtime**: Node.js ≥ 20.9, TypeScript ≥ 5.1, React 19.2+ (Compiler opsional, jangan diaktifkan sembarangan).
9. **Paralel route** wajib punya `default.js`; `parallel-routes` tanpa default = navigasi rusak.

Sumber di atas: `version-16.md` §Async Request APIs, §Caching APIs, §`middleware` to `proxy`, §Removals.

---

## ⚡ Aturan Kerja Sesi & Dokumentasi

### 1. Awal Sesi:
- Baca [00-DOCS.md](file:///d:/project%20web/kamera%20pung%20lallang/00-DOCS.md) — peta dokumen, status proyek, dan backlog prioritas.
- Periksa [DAILY_TASKS.md](file:///d:/project%20web/kamera%20pung%20lallang/DAILY_TASKS.md) dan [HANDOFF.md](file:///d:/project%20web/kamera%20pung%20lallang/HANDOFF.md).
- **Jika masuk tanggal/hari baru**, buat heading tanggal baru (`## YYYY-MM-DD`) di paling atas [DAILY_TASKS.md](file:///d:/project%20web/kamera%20pung%20lallang/DAILY_TASKS.md).

### 2. Saat Kerja:
- **Status bug teknis**: Rujuk [bug-audit/AUDIT.md](file:///d:/project%20web/kamera%20pung%20lallang/bug-audit/AUDIT.md).
- **Patuhi guardrail** di [HANDOFF.md](file:///d:/project%20web/kamera%20pung%20lallang/HANDOFF.md) (bagian terlarang diutak-atik, arsitektur locking transaksi ACID, keamanan presigned URL, dll).
- Selalu prioritaskan type-safety, modularitas, dan performa tinggi (Core Web Vitals).

### 3. Sebelum Klaim Selesai:
- **Verifikasi wajib**: Jalankan `node_modules/.bin/tsc --noEmit` (atau `npx tsc --noEmit`) dan wajib **EXIT=0**.
- **Wajib perbarui `DAILY_TASKS.md` secara otomatis**:
  - Centang target yang selesai: `[x]`.
  - Catat ringkasan teknis yang selesai dan hash commit-nya (jika ada) pada tanggal hari ini.
  - Tulis prioritas tugas untuk sesi berikutnya.
- **Perbarui status estafet** di [HANDOFF.md](file:///d:/project%20web/kamera%20pung%20lallang/HANDOFF.md).

### 4. Izin Operasi:
- **DILARANG** melakukan `git commit`, `git push`, build produksi besar, atau eksekusi migrasi database struktural (`drizzle-kit push` / `migrate`) **tanpa izin eksplisit dari user**.

---

<!-- antislop:start -->
## 🎨 Standar Kualitas Anti-AI Slop

Untuk kerja UI, copy/teks, representasi manusia, layout mobile, atau komentar kode, baca panduan skill terkait:
- **Core Standard**: `.claude/skills/antislop/SKILL.md`
- **UI / Visual**: `.claude/skills/antislop-ui/SKILL.md`
- **Copy & Text**: `.claude/skills/antislop-copywriting/SKILL.md`
- **People / Persona**: `.claude/skills/antislop-human/SKILL.md` (gunakan `contrast-check.py`)
- **Mobile / Responsive Layout**: `.claude/skills/antislop-layoutmobile/SKILL.md`
- **Code Comments**: `.claude/skills/antislop-code/SKILL.md`

### Panduan Visual Utama:
- Rujuk [DESIGN.md](file:///d:/project%20web/kamera%20pung%20lallang/DESIGN.md) dan [_build_plan/blueprints/theme-config.css](file:///d:/project%20web/kamera%20pung%20lallang/_build_plan/blueprints/theme-config.css).
- **Sebelum mulai bekerja pada antarmuka/konten**, konfirmasikan kepada user: *Apakah antislop berlaku saat kerja langsung, atau setelah selesai (tahap audit)?*
<!-- antislop:end -->

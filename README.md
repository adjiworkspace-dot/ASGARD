# ASGARD — Askrindo Geospatial Analytics for Risk Detection (v3.2.0)

Sistem Mandiri Pendukung Keputusan Underwriting Properti Berbasis Geospasial untuk **PT Asuransi Kredit Indonesia (Askrindo)** — Anggota Holding **Danantara Indonesia / IFG**.

---

## 1. Arsitektur Mandiri (Standalone Architecture)

ASGARD didesain untuk berjalan sepenuhnya secara mandiri pada browser web tanpa bergantung pada IDE atau perangkat pengembangan (seperti Antigravity) untuk proses login, autentikasi, penyimpanan portofolio, maupun analisis risiko.

### Komponen Sistem:
1. **Front-End (Client-Side Interface):**
   - HTML5, CSS3, Tailwind UI Dark Theme (`css/styles.css`), Vanilla ES6 JavaScript Modular.
   - Peta Interaktif Leaflet.js (`vendor/leaflet.js`) dengan GIS Vector Layers (Sesar Aktif PuSGeN, DAS & Sungai BIG, KRB Gunung Api MAGMA PVMBG, Zona Bahaya Banjir & Longsor).
   - Multi-peril Canvas Blending & ArcGIS ImageServer Tile Rasterizer.
   - Visualisasi Grafik Chart.js (`vendor/chart.min.js`), Analisis Spasial Turf.js (`vendor/turf.min.js`), Parser Excel SheetJS (`vendor/xlsx.full.min.js`), dan Export PDF jsPDF (`vendor/jspdf.umd.min.js`).

2. **Storage Subsystem (`SafeStorage`):**
   - **Multi-Tier Resilient Storage:** Menggunakan `localStorage` dan `sessionStorage` dengan mekanisme fallback otomatis ke **In-Memory Storage**.
   - **Quota Guard & Auto-Purge:** Mencegah `QuotaExceededError` (batas kuota browser 5MB) dengan membersihkan cache versi lama secara otomatis.
   - **Zero-Crash Security:** Kebal terhadap `SecurityError` saat dijalankan pada private browsing, sandboxed iframe, atau lingkungan korporat terbatas.

3. **Backend Proxy & Web Server (`server.js`):**
   - Server Node.js ultra-ringan (port 8085) menggunakan modul bawaan (`http`, `fs`, `path`) tanpa dependensi eksternal pihak ketiga (`zero npm dependency`).
   - Melayani static asset web dan bertindak sebagai proxy aman untuk upstream API bencana nasional:
     - **BMKG TEWS Live**: `/api/bmkg-earthquakes` (Gempa bumi tektonik M5.0+ dan terkini).
     - **MAGMA ESDM / PVMBG**: `/api/magma-volcanoes` (Aktivitas dan status 127 gunung api).
     - **BNPB inaRISK**: `/api/inarisk-point` & `/api/inarisk-tile` (Indeks bahaya, kerentanan, kapasitas, dan risiko bencana 9 peril).
     - **Healthcheck**: `/api/health`.

---

## 2. Cara Menjalankan ASGARD Secara Mandiri

### Opsi A: Menggunakan Launcher Satu-Klik (Windows Batch)
Cukup klik ganda file:
```cmd
start.bat
```
Script akan otomatis memeriksa Node.js, mengaktifkan `server.js` pada port 8085, dan langsung membuka browser ke `http://localhost:8085`.

### Opsi B: Menggunakan PowerShell Launcher
Buka PowerShell dan jalankan:
```powershell
.\start.ps1
```

### Opsi C: Manual via Command Line (Node.js)
```bash
node server.js
```
Buka browser pada: `http://localhost:8085`

---

## 3. Akun Login & Otorisasi Underwriter

- **Username / Email:** `underwriter@askrindo.co.id`
- **Password Default:** `asgard2026`
- **Fitur Ingat Sesi:** Sesi login dapat disimpan di perangkat (persisten) atau disimpan sementara pada tab browser aktif.
- **Logout:** Tersedia tombol *Logout Session* pada menu *My Profile* (ikon avatar UW di pojok kanan atas).

---

## 4. Langkah Deployment Publik (Production Readiness)

Untuk mempublikasikan ASGARD ke lingkungan staging / production instansi:
1. **Containerization (Docker):**
   - Buat `Dockerfile` berbasis `node:20-alpine` yang menyalin source code dan mengeksekusi `node server.js`.
2. **Reverse Proxy (Nginx / Cloudflare):**
   - Pasang Nginx di depan `server.js` dengan sertifikat SSL/TLS (HTTPS) pada domain korporat (misal: `https://asgard.askrindo.co.id`).
3. **Cloud Run / VPS Deployment:**
   - Deploy container ke Google Cloud Run, AWS App Runner, atau VPS internal Danantara/Askrindo dengan auto-scaling dan memory allocation minimum 512 MB.
4. **Environment Variables:**
   - Atur konfigurasi port melalui environment variable `PORT` (default 8085).

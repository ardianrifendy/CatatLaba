<div align="center">

# 💎 CatatLaba

**Aplikasi Pembukuan & Manajemen Keuangan Usaha (Kasir/UMKM) Modern**
*Berbasis iOS Liquid Glass Aesthetic & Architecture Offline-First Cloud Sync.*

[![Download APK](https://img.shields.io/badge/Download-CatatLaba.apk-007AFF?style=for-the-badge&logo=android&logoColor=white)](https://github.com/ardianrifendy/CatatLaba/raw/main/CatatLaba.apk)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

---

</div>

## 🌟 Tentang CatatLaba

**CatatLaba** adalah aplikasi pencatatan keuangan bisnis dan kasir UMKM yang dirancang khusus untuk memberikan pengalaman pengguna yang sangat cepat, elegan, dan andal. Dibangun dengan pendekatan **Offline-First**, seluruh data Anda tersimpan di database SQLite lokal perangkat HP secara *real-time* dan dapat disinkronkan ke **Supabase Cloud** kapan saja.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
| :--- | :--- |
| 🚀 **Offline-First Database** | Menggunakan **SQLite Local Database**. Aplikasi tetap berfungsi 100% cepat tanpa koneksi internet. |
| ☁️ **Cloud Synchronization** | Sinkronisasi dua arah ke **Supabase Cloud** secara otomatis saat terhubung ke internet. |
| 🔐 **Multi-Provider Auth** | Registrasi & Login fleksibel menggunakan **Email**, **Nomor Telepon (WhatsApp)**, atau **Google OAuth**. |
| 💎 **iOS Liquid Glass UI** | Desain futuristik dengan efek glassmorphism, blur dinamis, dan animasi micro-interactions yang mulus. |
| 📊 **Laporan & Analytics** | Visualisasi grafik keuangan komprehensif (Pendapatan, Pengeluaran, Laba Bersih, & Penjualan Produk). |
| 📦 **Katalog Produk & Stok** | Manajemen produk lengkap dengan dukungan kategori, harga modal, harga jual, dan stok otomatis. |
| 💳 **Multi-Dompet & Metode** | Bebas mengelola kas tunai, bank, e-wallet, serta saluran penjualan. |
| 💾 **Backup & Impor File** | Ekspor dan impor cadangan data dalam format file JSON kapan saja untuk keamanan ekstra. |

---

## 🛠️ Teknologi & Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **UI/UX**: Custom iOS Liquid Glass Design System, Recharts
* **State & Query**: TanStack Query (React Query), Zustand
* **Database Lokal**: SQLite via `@capacitor-community/sqlite`
* **Cloud Backend**: Supabase Auth & REST Data API
* **Native Runtime**: Capacitor Android Framework

---

## 📥 Download Aplikasi (Android)

Anda dapat mengunduh file APK siap pakai secara langsung melalui repository ini:

👉 **[Download CatatLaba.apk (Versi Terbaru)](https://github.com/ardianrifendy/CatatLaba/raw/main/CatatLaba.apk)**

---

## 🚀 Panduan Memulai (Pengkodingan & Development)

### 1. Clone Repository
```bash
git clone https://github.com/ardianrifendy/CatatLaba.git
cd CatatLaba
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Mode Development (Web)
```bash
npm run dev
```

### 4. Konfigurasi Environment (`.env`)
Buat file `.env` di root proyek dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 5. Build & Sync ke Android
```bash
# Build web & sync assets ke folder native Android
npm run android:sync

# Install ke perangkat Android terhubung via USB / Emulator
node scripts/android-gradle.mjs installDebug
```

---

## 📝 Lisensi & Kredit

Dikembangkan dengan 💖 oleh **Ardian Rifendy**. Hak cipta dilindungi undang-undang.

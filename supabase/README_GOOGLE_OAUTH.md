# Panduan Konfigurasi Google OAuth (Login with Google) - CatatLaba

Fitur **Masuk / Daftar dengan Google** di aplikasi CatatLaba menggunakan integrasi **Supabase Authentication**. Fitur ini mendukung login di **Web Browser** maupun di aplikasi **Android Native (Capacitor)**.

---

## 1. Konfigurasi di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada.
3. Masuk ke **APIs & Services** > **OAuth consent screen**:
   - Pilih **External**.
   - Isi nama aplikasi: `CatatLaba`.
   - Isi Email dukungan pengembang.
   - Tambahkan scope dasar: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Masuk ke **APIs & Services** > **Credentials**:
   - Klik **Create Credentials** > **OAuth client ID**.
   - Pilih Application type: **Web application**.
   - Masukkan Name: `CatatLaba Supabase Auth`.
   - Di bagian **Authorized redirect URIs**, tambahkan Callback URL dari Supabase Anda:
     ```text
     https://lrihnupabbjyeyzvwrwt.supabase.co/auth/v1/callback
     ```
   - Klik **Save** dan dapatkan **Client ID** dan **Client Secret**.

---

## 2. Konfigurasi di Supabase Dashboard

1. Buka Dashboard [Supabase](https://supabase.com/dashboard).
2. Pilih proyek CatatLaba Anda (`lrihnupabbjyeyzvwrwt`).
3. Masuk ke **Authentication** > **Providers**:
   - Cari dan klik **Google**.
   - Aktifkan toggle **Enable Google provider**.
   - Tempelkan **Client ID** dan **Client Secret** dari Google Cloud Console.
   - Klik **Save**.
4. Masuk ke **Authentication** > **URL Configuration**:
   - **Site URL**:
     ```text
     http://localhost:5173
     ```
   - **Redirect URLs** (Tambahkan URL berikut di daftar redirect yang diizinkan):
     ```text
     http://localhost:5173
     http://localhost
     com.catatlaba.app://google-auth
     com.catatlaba.app://*
     ```
   - Klik **Save**.

---

## 3. Cara Kerja di Aplikasi CatatLaba

- **Web (Vite / Browser)**:
  Saat pengguna mengeklik tombol **Masuk dengan Google**, aplikasi mengarahkan browser ke Supabase Google OAuth. Setelah berhasil login, Supabase mengembalikan token ke `http://localhost:5173/#access_token=...`. Aplikasi secara otomatis menangkap token tersebut dan masuk ke akun.

- **Android App (Capacitor Native)**:
  Aplikasi membuka InAppBrowser via `@capacitor/browser`. Setelah login di Google, Supabase melakukan redirect ke Deep Link Scheme `com.catatlaba.app://google-auth#access_token=...`.
  Aplikasi Android (`@capacitor/app`) mendeteksi deep link tersebut melalui `Intent-Filter`, menutup browser, dan langsung login serta melakukan sinkronisasi otomatis.

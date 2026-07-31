# 🛡️ Proteksi Database & Anti-Spam (Cloudflare Turnstile + Supabase)

Dokumen ini menjelaskan langkah-langkah untuk memproteksi aplikasi **CatatLaba** dari pendaftaran akun massal / bot spammers yang dapat memenuhi kuota database Supabase.

---

## 1. Keamanan Utama Database (Database Protection Layers)

Aplikasi **CatatLaba** menggunakan 3 lapis keamanan utama:

```
[ User Form / Bot ]
       │
       ▼
 [ 1. Cloudflare Turnstile CAPTCHA ] (Memblokir Bot/Script otomatis di level frontend)
       │
       ▼
 [ 2. Supabase Auth Rate Limiter ]  (Membatasi jumlah request registrasi per IP & per jam)
       │
       ▼
 [ 3. Row Level Security (RLS) ]    (Hanya pengguna terautentikasi yang bisa menulis data)
```

---

## 2. Cara Mengaktifkan Cloudflare Turnstile di Supabase

### Langkah 1: Buat Widget Turnstile di Cloudflare Dashboard
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Turnstile**.
2. Klik **Add Site**.
3. Isi nama aplikasi: `CatatLaba`.
4. Masukkan domain Anda (misal: `localhost`, `catatlaba.app`, atau nama domain Supabase Anda).
5. Pilih Widget Mode: **Managed** atau **Non-interactive** (Sangat ramah pengguna, bekerja di latar belakang).
6. Simpan dan dapatkan **Site Key** dan **Secret Key**.

### Langkah 2: Aktifkan CAPTCHA di Supabase Dashboard
1. Masuk ke **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Pilih Proyek CatatLaba Anda -> **Authentication** -> **Security**.
3. Pada bagian **Enable CAPTCHA Protection**, aktifkan (Toggle ON).
4. Pilih Provider: **Cloudflare Turnstile**.
5. Masukkan **Cloudflare Turnstile Secret Key**.
6. Klik **Save**.

---

## 3. Menambahkan Cloudflare Turnstile Key di Client (.env)

Tambahkan `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` pada file `.env` di proyek CatatLaba Anda:

```env
VITE_SUPABASE_URL=https://lrihnupabbjyeyzvwrwt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA... (opsional untuk Turnstile Widget)
```

---

## 4. Konfigurasi Rate Limiting di Supabase (Anti-Spam Database)

Untuk mencegah pengguna mendaftar terlalu banyak akun dalam waktu singkat:

1. Buka **Supabase Dashboard** -> **Authentication** -> **Rate Limits**.
2. Atur batas aman berikut:
   - **Email rate limit**: `30` per jam (mencegah pendaftaran massal).
   - **Token refresh rate limit**: `1800` per jam.
   - **Sign In rate limit**: `30` per 5 menit.
3. Simpan perubahan.

---

## 5. Proteksi Row Level Security (RLS) pada Database SQLite & Supabase Cloud

Setiap tabel di Supabase (`transactions`, `products`, `budgets`, `categories`, `recurring`) secara otomatis dilindungi oleh **Row Level Security (RLS)** dengan aturan kebijakan:

```sql
-- Contoh RLS Policy di Supabase PostgreSQL
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own transactions"
ON transactions FOR ALL
USING (auth.uid() = user_id);
```

Dengan RLS ini:
- Akun yang belum terverifikasi / tanpa token sah **0% tidak bisa memasukkan data** ke dalam database cloud.
- Setiap pengguna hanya memiliki akses baca/tulis ke data miliknya sendiri.

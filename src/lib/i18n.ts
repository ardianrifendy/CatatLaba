import { useLanguageStore, type LanguageCode } from '@/stores/language'

export const translations = {
  id: {
    // Navigation
    home: 'Beranda',
    transactions: 'Transaksi',
    products: 'Produk',
    reports: 'Laporan',
    settings: 'Pengaturan',

    // Beranda / Home
    welcome: 'Selamat Datang',
    totalBalance: 'SALDO TOTAL',
    monthlyNetFlow: 'Arus bersih bulan ini',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    thisMonth: 'Bulan Ini',
    trend7Days: 'GRAFIK TREN 7 HARI',
    monthlyBudget: 'ANGGARAN BULAN INI',
    usedOf: 'terpakai dari',
    databaseEmpty: 'Database Masih Kosong',
    generateSampleHint: 'Generate data sampel 7 hari untuk melihat animasi grafik dan fitur interaktif.',
    processing: 'Memproses...',
    generateSampleBtn: '⚡ Generate Sample Data',
    sampleGeneratedSuccess: 'Data sampel 7 hari berhasil dibuat!',

    // Business Profile
    businessIdentity: 'Identitas Usaha',
    businessIdentityDesc: 'Atur nama dan identitas usaha Anda untuk aplikasi CatatLaba.',
    storeName: 'Nama Toko / Usaha',
    storePhone: 'Nomor WhatsApp / Telepon Toko',
    storeAddress: 'Alamat Usaha (Opsional)',
    saveChanges: 'Simpan Perubahan',

    // Cloud Sync & Auth
    cloudSync: 'Sinkronisasi Cloud',
    signInWithGoogle: 'Masuk dengan Google',
    signUpWithGoogle: 'Daftar dengan Google',
    orEmailPhone: 'atau email / no hp',
    orEmail: 'atau email',
    fullName: 'Nama Lengkap',
    enterFullName: 'Masukkan nama lengkap Anda',
    phoneWhatsapp: 'Nomor Telepon (WhatsApp)',
    emailOrPhone: 'Email atau Nomor Telepon',
    emailAddress: 'Alamat Email',
    password: 'Kata Sandi / Password',
    confirmPassword: 'Konfirmasi Kata Sandi',
    enterConfirmPassword: 'Ketik ulang kata sandi Anda',
    passwordsDoNotMatch: 'Kata sandi dan konfirmasi kata sandi tidak cocok!',
    botProtection: 'Dilindungi Cloudflare Turnstile (Anti-Spam)',
    min6Chars: 'Minimal 6 karakter',
    signIn: 'Masuk Akun',
    signUp: 'Daftar Baru',
    dontHaveAccount: 'Belum punya akun? Klik untuk Daftar Baru',
    alreadyHaveAccount: 'Sudah punya akun? Klik untuk Masuk',

    // Presets
    searchBusinessType: 'Cari jenis usaha...',
    useThisPreset: 'Gunakan Preset Ini',
    applyingPreset: 'Menerapkan Preset...',
    presetApplied: 'Preset berhasil diterapkan!',

    // Transaksi / Transactions
    searchTransaction: 'Cari transaksi...',
    noTransactions: 'Belum ada transaksi',
    allWallets: 'Semua Dompet',
    allCategories: 'Semua Kategori',
    allTypes: 'Semua Tipe',
    filter: 'Filter',

    // Produk / Products
    productCatalog: 'Katalog Produk',
    addProduct: 'Tambah Produk',
    searchProduct: 'Cari produk...',
    stock: 'Stok',
    price: 'Harga',
    category: 'Kategori',

    // Laporan / Reports
    financialReport: 'Laporan Keuangan',
    salesSummary: 'Ringkasan Penjualan',
    exportReport: 'Ekspor Laporan',

    // Pengaturan Sections
    identitySection: 'IDENTITAS & PRESET USAHA',
    masterDataSection: 'MASTER DATA & TRANSAKSI',
    appearanceSection: 'TAMPILAN & BAHASA',
    securitySection: 'KEAMANAN & PRIVASI',
    cloudSection: 'AWAN & CADANGAN DATA',
    helpSection: 'SISTEM & BANTUAN',

    // Pengaturan Items
    manage: 'Kelola',
    myBusiness: 'Profil Usaha',
    businessPresets: 'Preset Jenis Usaha (Auto Setup)',
    wallets: 'Dompet & Rekening',
    categories: 'Kategori Transaksi',
    channels: 'Saluran Penjualan (Channel)',
    recurring: 'Transaksi Berulang',
    appearanceTheme: 'Tema Tampilan',
    appLanguage: 'Bahasa Aplikasi',
    securityLock: 'Kunci & Keamanan Aplikasi',
    cloudBackup: 'Awan & Cadangan (Cloud Sync)',
    systemHelp: 'Sistem & Bantuan',
    reportBug: 'Lapor Bug',
    supportDev: 'Dukungan Developer',
    appInfo: 'Informasi Aplikasi',

    // Security SubScreen
    appLock: 'Keamanan & Pengunci Aplikasi',
    lockMethod: 'Metode Kunci Aplikasi',
    noLock: 'Tanpa Kunci',
    pinLock: 'PIN (4 atau 6 Digit)',
    patternLock: 'Pola Matrix (Pattern)',
    passwordLock: 'Sandi Teks (Password)',
    biometrics: 'Sidik Jari / Biometrik',
    confirm: 'Konfirmasi',
    cancel: 'Batal',
    active: 'Aktif',

    // Common
    save: 'Simpan',
    delete: 'Hapus',
    edit: 'Ubah',
    success: 'Berhasil',
    error: 'Gagal',
  },
  en: {
    // Navigation
    home: 'Home',
    transactions: 'Transactions',
    products: 'Products',
    reports: 'Reports',
    settings: 'Settings',

    // Beranda / Home
    welcome: 'Welcome',
    totalBalance: 'TOTAL BALANCE',
    monthlyNetFlow: 'Monthly Net Flow',
    income: 'Income',
    expense: 'Expense',
    thisMonth: 'This Month',
    trend7Days: '7-DAY TREND CHART',
    monthlyBudget: 'THIS MONTH\'S BUDGET',
    usedOf: 'used of',
    databaseEmpty: 'Database Is Empty',
    generateSampleHint: 'Generate 7 days of sample data to experience interactive charts and insights.',
    processing: 'Processing...',
    generateSampleBtn: '⚡ Generate Sample Data',
    sampleGeneratedSuccess: '7-day sample data created successfully!',

    // Business Profile
    businessIdentity: 'Business Identity',
    businessIdentityDesc: 'Set your store name and business details for CatatLaba.',
    storeName: 'Store / Business Name',
    storePhone: 'WhatsApp / Phone Number',
    storeAddress: 'Business Address (Optional)',
    saveChanges: 'Save Changes',

    // Cloud Sync & Auth
    cloudSync: 'Cloud Sync',
    signInWithGoogle: 'Sign in with Google',
    signUpWithGoogle: 'Sign up with Google',
    orEmailPhone: 'or email / phone',
    orEmail: 'or email',
    fullName: 'Full Name',
    enterFullName: 'Enter your full name',
    phoneWhatsapp: 'Phone Number (WhatsApp)',
    emailOrPhone: 'Email or Phone Number',
    emailAddress: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    enterConfirmPassword: 'Re-enter your password',
    passwordsDoNotMatch: 'Passwords do not match!',
    botProtection: 'Protected by Cloudflare Turnstile (Anti-Spam)',
    min6Chars: 'Minimum 6 characters',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    dontHaveAccount: 'Don\'t have an account? Click to Sign Up',
    alreadyHaveAccount: 'Already have an account? Click to Sign In',

    // Presets
    searchBusinessType: 'Search business type...',
    useThisPreset: 'Use This Preset',
    applyingPreset: 'Applying Preset...',
    presetApplied: 'Preset applied successfully!',

    // Transaksi / Transactions
    searchTransaction: 'Search transactions...',
    noTransactions: 'No transactions found',
    allWallets: 'All Wallets',
    allCategories: 'All Categories',
    allTypes: 'All Types',
    filter: 'Filter',

    // Produk / Products
    productCatalog: 'Product Catalog',
    addProduct: 'Add Product',
    searchProduct: 'Search products...',
    stock: 'Stock',
    price: 'Price',
    category: 'Category',

    // Laporan / Reports
    financialReport: 'Financial Report',
    salesSummary: 'Sales Summary',
    exportReport: 'Export Report',

    // Pengaturan Sections
    identitySection: 'BUSINESS IDENTITY & PRESET',
    masterDataSection: 'MASTER DATA & TRANSACTIONS',
    appearanceSection: 'APPEARANCE & LANGUAGE',
    securitySection: 'SECURITY & PRIVACY',
    cloudSection: 'CLOUD & DATA BACKUP',
    helpSection: 'SYSTEM & SUPPORT',

    // Pengaturan Items
    manage: 'Manage',
    myBusiness: 'Business Profile',
    businessPresets: 'Business Preset (Auto Setup)',
    wallets: 'Wallets & Accounts',
    categories: 'Transaction Categories',
    channels: 'Sales Channels',
    recurring: 'Recurring Transactions',
    appearanceTheme: 'Display Theme',
    appLanguage: 'App Language',
    securityLock: 'App Lock & Security',
    cloudBackup: 'Cloud & Backup Sync',
    systemHelp: 'System & Support',
    reportBug: 'Report Bug',
    supportDev: 'Support Developer',
    appInfo: 'App Information',

    // Security SubScreen
    appLock: 'Security & App Lock',
    lockMethod: 'App Lock Method',
    noLock: 'No Lock',
    pinLock: 'PIN (4 or 6 Digits)',
    patternLock: 'Pattern Matrix',
    passwordLock: 'Text Password',
    biometrics: 'Fingerprint / Biometrics',
    confirm: 'Confirm',
    cancel: 'Cancel',
    active: 'Active',

    // Common
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    success: 'Success',
    error: 'Error',
  },
} as const

export type TranslationKey = keyof typeof translations.id

export function useTranslation() {
  const lang = useLanguageStore((s) => s.lang)

  function t(key: TranslationKey): string {
    return (translations[lang as LanguageCode] as Record<string, string>)?.[key] || translations.id[key] || key
  }

  return { t, lang }
}

// Shared user-visible copy (RULES.md: code in English, UI text in Bahasa
// Indonesia, centralized in the ui-text module). Components must import strings
// from here — never hardcode UI copy inline.
export const commonText = {
  appName: 'CatatLaba',

  // Bottom tab bar / sidebar navigation.
  navLabel: 'Navigasi utama',
  tabs: {
    beranda: 'Beranda',
    transaksi: 'Transaksi',
    produk: 'Produk',
    laporan: 'Laporan',
    pengaturan: 'Pengaturan',
  },

  // App boot (local database initialization).
  boot: {
    loading: 'Menyiapkan basis data lokal…',
    errorTitle: 'Gagal memuat aplikasi',
    errorDescription:
      'Basis data lokal tidak dapat disiapkan. Periksa ruang penyimpanan perangkat, lalu coba lagi.',
    reloadApp: 'Muat ulang aplikasi',
  },

  // Error boundary (per-page render crash).
  errorBoundary: {
    title: 'Terjadi kesalahan',
    description: 'Halaman ini mengalami gangguan tak terduga. Silakan coba lagi.',
  },

  // Generic actions reused across features.
  actions: {
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    add: 'Tambah',
    back: 'Kembali',
    retry: 'Coba lagi',
    close: 'Tutup',
    comingSoon: 'Segera hadir',
  },

  // Beranda (home) page.
  beranda: {
    totalBalanceLabel: 'Saldo total',
    summaryComingSoon:
      'Ringkasan omzet, pengeluaran, dan profit bulanan hadir di fase berikutnya.',
    balanceLoadError: 'Saldo gagal dimuat.',
  },

  // Placeholder copy for pages whose features land in later phases.
  placeholders: {
    transaksi: 'Pencatatan dan daftar transaksi hadir di fase berikutnya.',
    produk: 'Manajemen produk dan stok hadir di fase berikutnya.',
    laporan: 'Laporan dan grafik hadir di fase berikutnya.',
  },

  // Settings rows for features that are not built yet.
  settings: {
    recurring: 'Transaksi Berulang',
    accountSync: 'Akun & Sinkronisasi',
    exportImport: 'Ekspor & Impor',
  },

  // Stub feature screens awaiting their real implementation.
  underConstruction: 'Layar ini sedang dibangun.',

  // Fallback toast message when a mutation fails without a RepoError message.
  mutationErrorFallback: 'Perubahan gagal disimpan. Silakan coba lagi.',
} as const

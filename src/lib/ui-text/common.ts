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
    monthlyNetLabel: 'Arus bersih bulan ini',
    monthlyIncomeLabel: 'Pemasukan bulan ini',
    monthlyExpenseLabel: 'Pengeluaran bulan ini',
    budgetHighlightsLabel: 'Anggaran bulan ini',
    budgetSpentLabel: 'terpakai',
    noBudgets: 'Belum ada anggaran bulan ini.',
    noTransactions:
      'Belum ada transaksi. Catat pemasukan atau pengeluaran pertama Anda dari tab Transaksi.',
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
    sync: {
      title: 'Sinkronisasi cloud',
      offline: 'Supabase belum dikonfigurasi.',
      signedOut: 'Masuk untuk menyimpan backup cloud.',
      syncing: 'Sedang menyinkronkan data.',
      ready: 'Cloud siap digunakan.',
      signedInAs: 'Masuk sebagai',
      signIn: 'Masuk',
      signUp: 'Daftar',
      signOut: 'Keluar',
      syncNow: 'Sinkronkan',
      email: 'Email',
      password: 'Kata sandi',
      emailConfirmation: 'Cek email untuk konfirmasi akun.',
      syncFailed: 'Sinkronisasi gagal. Coba lagi.',
      cloudActionFailed: 'Aksi cloud gagal.',
      exportBackupFailed: 'Export backup gagal.',
      exportedBackupSuccess: 'Backup JSON tersimpan di Download/CatatLaba.',
      importBackupFailed: 'Import backup gagal.',
      accountFallback: 'akun Anda',
      importedBackupSuccess: (count: number) => `${count} data berhasil diimpor.`,
      lastSyncedAt: 'Terakhir sinkron',
      backupTitle: 'Backup lokal',
      backupDescription: 'Export menyimpan semua data, termasuk data yang diarsipkan.',
      exportJson: 'Export JSON',
      importBackup: 'Impor backup',
      backupInvalid: 'File backup tidak valid.',
      backupTableInvalid: (table: string) => `Data ${table} pada backup tidak valid.`,
      requestFailed: (status: number) => `Supabase request gagal (${status}).`,
      requestTimeout: 'Koneksi ke cloud terlalu lama. Coba lagi.',
    },
  },

  theme: {
    title: 'Tema tampilan',
    description: 'Gunakan tema perangkat atau pilih tampilan secara manual.',
    selectorLabel: 'Pilih tema tampilan',
    modes: {
      system: 'Sistem',
      light: 'Terang',
      dark: 'Gelap',
    },
  },

  // Stub feature screens awaiting their real implementation.
  underConstruction: 'Layar ini sedang dibangun.',

  // Fallback toast message when a mutation fails without a RepoError message.
  mutationErrorFallback: 'Perubahan gagal disimpan. Silakan coba lagi.',
} as const

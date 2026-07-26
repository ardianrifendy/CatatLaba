// Wallets feature copy (Bahasa Indonesia). Every user-visible string of the
// wallets screen — labels, toasts, validation, confirmations — lives here
// (RULES.md: UI text centralized in the ui-text module, never inline).
export const walletsText = {
  title: 'Dompet',
  backLabel: 'Kembali',
  addLabel: 'Tambah dompet',

  totalBalanceLabel: 'Saldo total',
  transferButton: 'Transfer',
  archivedSection: 'Diarsipkan',

  typeLabels: {
    cash: 'Tunai',
    bank: 'Bank',
    ewallet: 'E-Wallet',
  },

  loadError: 'Data dompet gagal dimuat.',
  retry: 'Coba lagi',

  empty: {
    title: 'Belum ada dompet',
    description: 'Tambahkan dompet untuk mulai mencatat uang masuk dan keluar.',
    cta: 'Tambah dompet',
  },

  form: {
    createTitle: 'Tambah dompet',
    editTitle: 'Edit dompet',
    nameLabel: 'Nama',
    namePlaceholder: 'Contoh: Kas Toko',
    typeLabel: 'Jenis',
    initialBalanceLabel: 'Saldo awal',
    initialBalancePlaceholder: '0',
    initialBalanceHint:
      'Saldo dompet dihitung otomatis dari saldo awal ditambah seluruh transaksi.',
    save: 'Simpan',
    archive: 'Arsipkan',
    unarchive: 'Aktifkan lagi',
    delete: 'Hapus',
  },

  confirmDelete: {
    title: 'Hapus dompet?',
    description: (name: string) =>
      `Dompet "${name}" akan dihapus dan tidak muncul lagi di daftar. Tindakan ini tidak dapat dibatalkan.`,
    confirm: 'Hapus',
  },

  transfer: {
    title: 'Transfer antar dompet',
    fromLabel: 'Dari',
    fromPlaceholder: 'Pilih dompet asal',
    fromSheetTitle: 'Pilih dompet asal',
    toLabel: 'Ke',
    toPlaceholder: 'Pilih dompet tujuan',
    toSheetTitle: 'Pilih dompet tujuan',
    amountLabel: 'Nominal',
    noteLabel: 'Catatan',
    notePlaceholder: 'Opsional',
    submit: 'Transfer',
    insufficientWarning:
      'Nominal melebihi saldo dompet asal. Transfer tetap bisa dicatat.',
  },

  validation: {
    nameRequired: 'Nama dompet wajib diisi.',
    nameTooLong: 'Nama dompet maksimal 40 karakter.',
    fromRequired: 'Pilih dompet asal.',
    toRequired: 'Pilih dompet tujuan.',
    sameWallet: 'Dompet asal dan tujuan tidak boleh sama.',
    amountRequired: 'Nominal wajib diisi.',
    amountPositive: 'Nominal harus bilangan bulat lebih dari nol.',
    noteTooLong: 'Catatan maksimal 200 karakter.',
  },

  toasts: {
    created: 'Dompet berhasil ditambahkan.',
    updated: 'Perubahan dompet disimpan.',
    archived: 'Dompet diarsipkan.',
    unarchived: 'Dompet diaktifkan lagi.',
    deleted: 'Dompet dihapus.',
    deleteBlocked:
      'Dompet masih dipakai transaksi, jadi tidak bisa dihapus. Arsipkan saja agar riwayat tetap aman.',
    transferSuccess: (from: string, to: string) =>
      `Transfer dari ${from} ke ${to} berhasil dicatat.`,
  },
} as const

// Channels feature copy (Bahasa Indonesia). Every user-visible string for the
// channels CRUD screen lives here (RULES.md) — components import from
// '@/lib/ui-text' and never hardcode UI text.
export const channelsText = {
  title: 'Channel',

  // Screen chrome.
  backLabel: 'Kembali',
  addLabel: 'Tambah channel',

  // List sections & states.
  archivedSection: 'Diarsipkan',
  loadError: 'Daftar channel gagal dimuat.',
  retry: 'Coba lagi',
  empty: {
    title: 'Belum ada channel',
    description:
      'Tambahkan channel penjualan seperti Shopee, Tokopedia, atau toko offline.',
    action: 'Tambah channel',
  },

  // Create / edit bottom sheet.
  form: {
    createTitle: 'Tambah channel',
    editTitle: 'Edit channel',
    nameLabel: 'Nama',
    namePlaceholder: 'Contoh: Shopee',
    nameRequired: 'Nama channel wajib diisi.',
    nameTooLong: 'Nama channel maksimal 40 karakter.',
    save: 'Simpan',
    cancel: 'Batal',
    archive: 'Arsipkan',
    unarchive: 'Aktifkan lagi',
    delete: 'Hapus',
  },

  // Destructive confirmation sheet.
  confirmDelete: {
    title: 'Hapus channel?',
    description: (name: string) =>
      `Channel "${name}" akan dihapus dan tidak muncul lagi di pilihan transaksi.`,
    confirm: 'Hapus',
  },

  // Mutation toasts.
  toasts: {
    created: 'Channel ditambahkan.',
    updated: 'Channel diperbarui.',
    archived: 'Channel diarsipkan.',
    unarchived: 'Channel diaktifkan lagi.',
    deleted: 'Channel dihapus.',
    deleteBlocked:
      'Channel masih dipakai transaksi. Arsipkan channel ini agar riwayat tetap aman.',
  },
} as const

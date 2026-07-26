// Categories feature copy (Bahasa Indonesia). RULES.md: every user-visible
// string lives in the ui-text module — components import from here and never
// hardcode UI copy inline.
export const categoriesText = {
  title: 'Kategori',

  // Screen chrome (icon-button accessible names).
  back: 'Kembali',
  add: 'Tambah kategori',

  // Type filter segmented control.
  typeFilterLabel: 'Filter tipe kategori',
  typeExpense: 'Pengeluaran',
  typeIncome: 'Pemasukan',

  // Query states.
  loadError: 'Kategori gagal dimuat.',
  retry: 'Coba lagi',

  // Empty state per type.
  empty: {
    expenseTitle: 'Belum ada kategori pengeluaran',
    incomeTitle: 'Belum ada kategori pemasukan',
    description: 'Tambahkan kategori untuk mengelompokkan transaksi usahamu.',
    cta: 'Tambah kategori',
  },

  // Create/edit bottom sheet.
  form: {
    createTitle: 'Tambah kategori',
    editTitle: 'Edit kategori',
    nameLabel: 'Nama',
    namePlaceholder: 'Contoh: Bahan Baku',
    typeLabel: 'Tipe',
    typeLockedHint: 'Tipe tidak dapat diubah setelah kategori dibuat.',
    parentLabel: 'Induk',
    parentPlaceholder: 'Pilih kategori induk',
    parentSheetTitle: 'Pilih induk',
    parentNone: 'Tanpa induk',
    parentLockedHint: 'Kategori yang memiliki sub-kategori tidak bisa diberi induk.',
    iconLabel: 'Ikon',
    iconPlaceholder: '🍜',
    iconHint: 'Emoji, opsional',
    save: 'Simpan',
    delete: 'Hapus',
  },

  // Zod validation messages (shown under the fields).
  validation: {
    nameRequired: 'Nama kategori wajib diisi.',
    nameTooLong: 'Nama kategori maksimal 40 karakter.',
    iconTooLong: 'Ikon maksimal satu emoji.',
    parentInvalid: 'Kategori induk tidak valid.',
  },

  // Delete confirmation sheet.
  confirmDelete: {
    title: 'Hapus kategori?',
    description: (name: string) =>
      `Kategori "${name}" akan dihapus. Transaksi lama tidak ikut terhapus.`,
    confirm: 'Hapus',
  },

  // Mutation toasts.
  toast: {
    created: 'Kategori berhasil dibuat.',
    updated: 'Kategori berhasil diperbarui.',
    deleted: 'Kategori berhasil dihapus.',
    deleteBlocked: 'Hapus atau pindahkan sub-kategori terlebih dahulu.',
  },
} as const

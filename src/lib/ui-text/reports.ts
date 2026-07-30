export const reportsText = {
  title: 'Laporan',
  period: {
    label: 'Periode laporan',
    previous: 'Periode sebelumnya',
    next: 'Periode berikutnya',
    month: 'Bulan',
    quarter: '3 bulan',
    year: 'Tahun',
  },
  summary: {
    revenue: 'Omzet',
    expense: 'Pengeluaran',
    profit: 'Laba',
  },
  sections: {
    profitByChannel: 'Laba per channel',
    expenseByCategory: 'Pengeluaran per kategori',
    profitTrend: 'Tren laba',
    topProducts: 'Produk terlaris',
  },
  labels: {
    transactions: 'transaksi',
    quantity: 'terjual',
    revenue: 'Omzet',
    profit: 'Laba',
    noChannel: 'Tanpa channel',
    noCategory: 'Tanpa kategori',
    unknown: 'Tidak diketahui',
    other: 'Lainnya',
  },
  empty: {
    title: 'Belum ada data laporan',
    description: 'Transaksi pada periode ini akan muncul sebagai ringkasan dan grafik.',
  },
  sectionEmpty: 'Belum ada data untuk bagian ini.',
  loadError: 'Laporan gagal dimuat.',
  retry: 'Coba lagi',
} as const

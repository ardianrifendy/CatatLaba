export type PresetGroup = 'retail' | 'fnb' | 'service' | 'online' | 'general'

export interface PresetCategory {
  name: string
  type: 'income' | 'expense'
  icon?: string
}

export interface PresetChannel {
  name: string
}

export interface PresetWallet {
  name: string
  type: 'cash' | 'bank' | 'ewallet'
}

export interface BusinessPreset {
  id: string
  name: string
  group: PresetGroup
  description: string
  icon: string
  keywords: string[]
  units: string[]
  theme: {
    gradient: string
    iconBg: string
    iconColor: string
    accentBorder: string
  }
  categories: PresetCategory[]
  channels: PresetChannel[]
  wallets: PresetWallet[]
}

export const BUSINESS_PRESETS: BusinessPreset[] = [
  {
    id: 'konter-hp',
    name: 'Konter HP & Aksesoris',
    group: 'retail',
    description: 'Untuk toko ponsel, jual pulsa, paket data, aksesoris & servis HP.',
    icon: 'Smartphone',
    keywords: ['konter', 'hp', 'handphone', 'pulsa', 'kuota', 'aksesoris', 'servis', 'voucher', 'kartu'],
    units: ['Unit', 'Pcs', 'Voucher', 'Jasa'],
    theme: {
      gradient: 'from-cyan-500/15 via-blue-500/10 to-transparent',
      iconBg: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30',
      iconColor: 'text-cyan-500 dark:text-cyan-400',
      accentBorder: 'hover:border-cyan-500/50',
    },
    categories: [
      { name: 'Penjualan HP Baru', type: 'income', icon: 'Smartphone' },
      { name: 'Penjualan HP Bekas', type: 'income', icon: 'RotateCcw' },
      { name: 'Penjualan Aksesoris', type: 'income', icon: 'Headphones' },
      { name: 'Pulsa & Paket Data', type: 'income', icon: 'Zap' },
      { name: 'Jasa Servis & Ganti Part', type: 'income', icon: 'Wrench' },
      { name: 'Kulakan Stok HP', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Kulakan Aksesoris & Part', type: 'expense', icon: 'Package' },
      { name: 'Deposit Pulsa & E-Money', type: 'expense', icon: 'CreditCard' },
      { name: 'Operasional Konter', type: 'expense', icon: 'Store' },
    ],
    channels: [
      { name: 'Toko Fisik / Konter' },
      { name: 'WhatsApp Catalog' },
      { name: 'FB Marketplace' },
      { name: 'OLX' },
    ],
    wallets: [
      { name: 'Kas Konter', type: 'cash' },
      { name: 'Bank BCA', type: 'bank' },
      { name: 'E-Wallet DANA/OVO', type: 'ewallet' },
    ],
  },
  {
    id: 'parfum-racikan',
    name: 'Toko Parfum & Refill',
    group: 'retail',
    description: 'Untuk penjual parfum bibit, racikan refill, botol & pelarut absolute.',
    icon: 'Sparkles',
    keywords: ['parfum', 'bibit', 'refill', 'racikan', 'fragrance', 'botol', 'wangi', 'aroma'],
    units: ['ml', 'Botol', 'Paket', 'Pcs'],
    theme: {
      gradient: 'from-purple-500/15 via-pink-500/10 to-transparent',
      iconBg: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      iconColor: 'text-purple-500 dark:text-purple-400',
      accentBorder: 'hover:border-purple-500/50',
    },
    categories: [
      { name: 'Parfum Ready (Jadi)', type: 'income', icon: 'Sparkles' },
      { name: 'Bibit Murni (Ecer/ml)', type: 'income', icon: 'Droplets' },
      { name: 'Botol & Aksesoris Kosong', type: 'income', icon: 'Box' },
      { name: 'Belanja Bibit Parfum', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Belanja Botol & Stiker', type: 'expense', icon: 'Tag' },
      { name: 'Bahan Pelarut & Absolute', type: 'expense', icon: 'FlaskConical' },
      { name: 'Sewa Lapak & Listrik', type: 'expense', icon: 'Home' },
    ],
    channels: [
      { name: 'Toko Offline / Booth' },
      { name: 'Shopee' },
      { name: 'TikTok Shop' },
      { name: 'WhatsApp Order' },
    ],
    wallets: [
      { name: 'Kas Laci Kasir', type: 'cash' },
      { name: 'Bank Mandiri', type: 'bank' },
      { name: 'QRIS / E-Wallet', type: 'ewallet' },
    ],
  },
  {
    id: 'dropshipper-online',
    name: 'Dropshipper & Reseller',
    group: 'online',
    description: 'Untuk pebisnis tanpa stok, toko online Shopee, TikTok & Tokopedia.',
    icon: 'PackageCheck',
    keywords: ['dropship', 'dropshipper', 'reseller', 'shopee', 'tiktok', 'tokopedia', 'online', 'supplier'],
    units: ['Pcs', 'Paket', 'Set'],
    theme: {
      gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
      iconBg: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
      iconColor: 'text-amber-500 dark:text-amber-400',
      accentBorder: 'hover:border-amber-500/50',
    },
    categories: [
      { name: 'Penjualan Marketplace', type: 'income', icon: 'ShoppingBag' },
      { name: 'Komisi Affiliate / Margin', type: 'income', icon: 'BadgePercent' },
      { name: 'Modal Supplier (COD/Transfer)', type: 'expense', icon: 'Send' },
      { name: 'Biaya Admin Marketplace', type: 'expense', icon: 'Receipt' },
      { name: 'Iklan & Promo (Ads)', type: 'expense', icon: 'Megaphone' },
      { name: 'Ongkir Retur / Selisih', type: 'expense', icon: 'Truck' },
    ],
    channels: [
      { name: 'Shopee' },
      { name: 'TikTok Shop' },
      { name: 'Tokopedia' },
      { name: 'Lazada' },
      { name: 'WhatsApp Business' },
    ],
    wallets: [
      { name: 'Saldo ShopeePay / Saldo Penjual', type: 'ewallet' },
      { name: 'Bank BCA', type: 'bank' },
      { name: 'Bank BRI', type: 'bank' },
    ],
  },
  {
    id: 'fashion-distro',
    name: 'Fashion, Clothing & Distro',
    group: 'retail',
    description: 'Untuk toko baju, distro, celana, sepatu, hijab & aksesoris pakaian.',
    icon: 'Shirt',
    keywords: ['fashion', 'baju', 'clothing', 'distro', 'celana', 'sepatu', 'hijab', 'gamis', 'kaos'],
    units: ['Pcs', 'Pasang', 'Lempit', 'Set'],
    theme: {
      gradient: 'from-rose-500/15 via-indigo-500/10 to-transparent',
      iconBg: 'from-rose-500/20 to-indigo-500/20 border-rose-500/30',
      iconColor: 'text-rose-500 dark:text-rose-400',
      accentBorder: 'hover:border-rose-500/50',
    },
    categories: [
      { name: 'Penjualan Pakaian', type: 'income', icon: 'Shirt' },
      { name: 'Penjualan Sepatu & Sandal', type: 'income', icon: 'Footprints' },
      { name: 'Penjualan Aksesoris', type: 'income', icon: 'Glasses' },
      { name: 'Kulakan / Belanja Conveksi', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Packaging (Polymailer/Dus)', type: 'expense', icon: 'Box' },
      { name: 'Gaji Karyawan Toko', type: 'expense', icon: 'Users' },
    ],
    channels: [
      { name: 'Toko Distro (Offline)' },
      { name: 'Shopee Live' },
      { name: 'TikTok Live' },
      { name: 'Instagram DM' },
    ],
    wallets: [
      { name: 'Kasir Toko', type: 'cash' },
      { name: 'Bank BCA', type: 'bank' },
      { name: 'QRIS Toko', type: 'ewallet' },
    ],
  },
  {
    id: 'warkop-cafe',
    name: 'Warkop, Cafe & Boba',
    group: 'fnb',
    description: 'Untuk kedai kopi, warkop, franchise boba/minuman & snack kekinian.',
    icon: 'Coffee',
    keywords: ['warkop', 'cafe', 'kopi', 'coffee', 'boba', 'minuman', 'es', 'teh', 'snack', 'nongkrong'],
    units: ['Cup', 'Porsi', 'Botol', 'Pcs'],
    theme: {
      gradient: 'from-amber-600/15 via-orange-500/10 to-transparent',
      iconBg: 'from-amber-600/20 to-orange-500/20 border-amber-600/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentBorder: 'hover:border-amber-600/50',
    },
    categories: [
      { name: 'Penjualan Kopi & Minuman', type: 'income', icon: 'Coffee' },
      { name: 'Penjualan Makanan & Snack', type: 'income', icon: 'Utensils' },
      { name: 'Bahan Kopi, Susu & Sirup', type: 'expense', icon: 'Milk' },
      { name: 'Cup, Sedotan & Kemasan', type: 'expense', icon: 'Box' },
      { name: 'Es Batu & Air Galon', type: 'expense', icon: 'Droplet' },
      { name: 'Sewa Tempat & Listrik/WiFi', type: 'expense', icon: 'Wifi' },
    ],
    channels: [
      { name: 'Dine-in / Kasir Warkop' },
      { name: 'Takeaway' },
      { name: 'GoFood' },
      { name: 'GrabFood' },
      { name: 'ShopeeFood' },
    ],
    wallets: [
      { name: 'Kas Laci Warkop', type: 'cash' },
      { name: 'Bank Mandiri', type: 'bank' },
      { name: 'QRIS All Payment', type: 'ewallet' },
    ],
  },
  {
    id: 'warung-makan',
    name: 'Warung Makan & Catering',
    group: 'fnb',
    description: 'Untuk rumah makan, warteg, usaha catering, nasi goreng & kuliner.',
    icon: 'UtensilsCrossed',
    keywords: ['warung', 'makan', 'warteg', 'catering', 'kuliner', 'restoran', 'nasi', 'katering', 'masakan'],
    units: ['Porsi', 'Kotak', 'Bungkus', 'Paket'],
    theme: {
      gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
      iconBg: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      accentBorder: 'hover:border-emerald-500/50',
    },
    categories: [
      { name: 'Penjualan Makanan Harian', type: 'income', icon: 'UtensilsCrossed' },
      { name: 'Pesanan Catering & Nasi Box', type: 'income', icon: 'Package' },
      { name: 'Belanja Pasar (Daging/Sayur)', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Bumbu & Minyak Goreng', type: 'expense', icon: 'Flame' },
      { name: 'Gas LPG & Air Galon', type: 'expense', icon: 'Flame' },
      { name: 'Kotak Nasi & Plastik', type: 'expense', icon: 'Box' },
    ],
    channels: [
      { name: 'Warung Offline' },
      { name: 'Pesanan WA Catering' },
      { name: 'GoFood' },
      { name: 'GrabFood' },
    ],
    wallets: [
      { name: 'Kas Warung', type: 'cash' },
      { name: 'Bank BRI', type: 'bank' },
    ],
  },
  {
    id: 'warung-sembako',
    name: 'Warung Sembako & Kelontong',
    group: 'retail',
    description: 'Untuk toko kelontong, sembako, minyak, beras, gula & kebutuhan harian.',
    icon: 'Store',
    keywords: ['sembako', 'kelontong', 'warung', 'beras', 'minyak', 'gula', 'sabun', 'toko', 'eceran'],
    units: ['kg', 'Pcs', 'Renceng', 'Dus', 'Sak'],
    theme: {
      gradient: 'from-blue-500/15 via-indigo-500/10 to-transparent',
      iconBg: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
      iconColor: 'text-blue-500 dark:text-blue-400',
      accentBorder: 'hover:border-blue-500/50',
    },
    categories: [
      { name: 'Penjualan Sembako', type: 'income', icon: 'Store' },
      { name: 'Penjualan Minuman & Sabun', type: 'income', icon: 'Package' },
      { name: 'Belanja Grosir Sembako', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Belanja Gas & Galon Refill', type: 'expense', icon: 'Truck' },
      { name: 'Operasional Warung', type: 'expense', icon: 'Home' },
    ],
    channels: [
      { name: 'Toko Kelontong Offline' },
      { name: 'Pesanan WA Tetangga' },
    ],
    wallets: [
      { name: 'Laci Uang Warung', type: 'cash' },
      { name: 'Bank BRI', type: 'bank' },
    ],
  },
  {
    id: 'laundry-kiloan',
    name: 'Laundry Kiloan & Satuan',
    group: 'service',
    description: 'Untuk usaha jasa laundry kiloan, karpet, bedcover, jas & dry clean.',
    icon: 'WashingMachine',
    keywords: ['laundry', 'cuci', 'setrika', 'kiloan', 'karpet', 'bedcover', 'pakaian', 'dry clean'],
    units: ['kg', 'Pcs', 'Set', 'Meter'],
    theme: {
      gradient: 'from-sky-400/15 via-teal-400/10 to-transparent',
      iconBg: 'from-sky-400/20 to-teal-400/20 border-sky-400/30',
      iconColor: 'text-sky-500 dark:text-sky-400',
      accentBorder: 'hover:border-sky-400/50',
    },
    categories: [
      { name: 'Jasa Laundry Kiloan', type: 'income', icon: 'WashingMachine' },
      { name: 'Jasa Laundry Satuan/Karpet', type: 'income', icon: 'Sparkles' },
      { name: 'Deterjen & Parfum Laundry', type: 'expense', icon: 'Droplets' },
      { name: 'Plastik Packing & Hanger', type: 'expense', icon: 'Package' },
      { name: 'Air PAM & Listrik Mesin', type: 'expense', icon: 'Zap' },
      { name: 'Gas LPG Dryer/Setrika', type: 'expense', icon: 'Flame' },
    ],
    channels: [
      { name: 'Outlet Laundry' },
      { name: 'Antar-Jemput WhatsApp' },
    ],
    wallets: [
      { name: 'Kasir Laundry', type: 'cash' },
      { name: 'Bank BCA', type: 'bank' },
      { name: 'QRIS Laundry', type: 'ewallet' },
    ],
  },
  {
    id: 'barbershop-salon',
    name: 'Barbershop & Salon',
    group: 'service',
    description: 'Untuk jasa pangkas rambut, salon kecantikan, pomade & skincare.',
    icon: 'Scissors',
    keywords: ['barber', 'barbershop', 'pangkas', 'cukur', 'salon', 'rambut', 'pomade', 'skincare', 'facial'],
    units: ['Orang', 'Pcs', 'Jasa', 'Botol'],
    theme: {
      gradient: 'from-violet-500/15 via-purple-600/10 to-transparent',
      iconBg: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
      iconColor: 'text-violet-500 dark:text-violet-400',
      accentBorder: 'hover:border-violet-500/50',
    },
    categories: [
      { name: 'Jasa Pangkas & Styling', type: 'income', icon: 'Scissors' },
      { name: 'Jasa Hair Treatment/Cat', type: 'income', icon: 'Sparkles' },
      { name: 'Penjualan Pomade & Skincare', type: 'income', icon: 'Package' },
      { name: 'Beli Pomade & Cat Rambut', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Silet, Handuk & Shampoo', type: 'expense', icon: 'Box' },
      { name: 'Komisi Capster / Barberman', type: 'expense', icon: 'Users' },
    ],
    channels: [
      { name: 'Kasir Barbershop' },
      { name: 'Booking Online WA' },
    ],
    wallets: [
      { name: 'Kas Laci Barber', type: 'cash' },
      { name: 'QRIS BCA', type: 'ewallet' },
    ],
  },
  {
    id: 'bengkel-servis',
    name: 'Bengkel & Servis Kendaraan',
    group: 'service',
    description: 'Untuk bengkel motor, mobil, ganti oli, cuci motor & sparepart.',
    icon: 'Wrench',
    keywords: ['bengkel', 'motor', 'mobil', 'servis', 'oli', 'sparepart', 'ban', 'cuci', 'montir'],
    units: ['Pcs', 'Botol', 'Jasa', 'Set'],
    theme: {
      gradient: 'from-red-500/15 via-orange-600/10 to-transparent',
      iconBg: 'from-red-500/20 to-orange-600/20 border-red-500/30',
      iconColor: 'text-red-500 dark:text-red-400',
      accentBorder: 'hover:border-red-500/50',
    },
    categories: [
      { name: 'Jasa Servis & Montir', type: 'income', icon: 'Wrench' },
      { name: 'Penjualan Oli & Pelumas', type: 'income', icon: 'Droplet' },
      { name: 'Penjualan Sparepart & Ban', type: 'income', icon: 'Disc' },
      { name: 'Belanja Oli & Sparepart', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Alat & Bahan Bengkel', type: 'expense', icon: 'Package' },
      { name: 'Gaji / Bagi Hasil Montir', type: 'expense', icon: 'Users' },
    ],
    channels: [
      { name: 'Bengkel Offline' },
      { name: 'Langganan WA' },
    ],
    wallets: [
      { name: 'Kas Laci Bengkel', type: 'cash' },
      { name: 'Bank Mandiri', type: 'bank' },
    ],
  },
  {
    id: 'petshop-pakan',
    name: 'Petshop & Pakan Ternak',
    group: 'retail',
    description: 'Untuk toko kebutuhan hewan, pakan kucing/anjing, grooming & obat.',
    icon: 'Dog',
    keywords: ['petshop', 'kucing', 'anjing', 'pakan', 'hewan', 'grooming', 'vet', 'pasir', 'kandang'],
    units: ['kg', 'Pcs', 'Kaleng', 'Pack'],
    theme: {
      gradient: 'from-emerald-400/15 via-lime-400/10 to-transparent',
      iconBg: 'from-emerald-400/20 to-lime-400/20 border-emerald-400/30',
      iconColor: 'text-emerald-400 dark:text-emerald-300',
      accentBorder: 'hover:border-emerald-400/50',
    },
    categories: [
      { name: 'Penjualan Pakan Kiloan/Merek', type: 'income', icon: 'Dog' },
      { name: 'Aksesoris & Pasir Kucing', type: 'income', icon: 'Package' },
      { name: 'Jasa Grooming & Mandi', type: 'income', icon: 'Sparkles' },
      { name: 'Kulakan Pakan & Vitamin', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Perlengkapan Grooming', type: 'expense', icon: 'Box' },
    ],
    channels: [
      { name: 'Toko Petshop Offline' },
      { name: 'Shopee' },
      { name: 'WhatsApp Catalog' },
    ],
    wallets: [
      { name: 'Kasir Petshop', type: 'cash' },
      { name: 'Bank BCA', type: 'bank' },
    ],
  },
  {
    id: 'apotek-obat',
    name: 'Apotek & Toko Obat',
    group: 'retail',
    description: 'Untuk toko obat, apotek, vitamin, alat kesehatan & perawatan medis.',
    icon: 'Pill',
    keywords: ['apotek', 'obat', 'vitamin', 'suplemen', 'alkes', 'kesehatan', 'resep', 'medis'],
    units: ['Strip', 'Box', 'Botol', 'Pcs'],
    theme: {
      gradient: 'from-teal-400/15 via-cyan-500/10 to-transparent',
      iconBg: 'from-teal-400/20 to-cyan-500/20 border-teal-400/30',
      iconColor: 'text-teal-400 dark:text-teal-300',
      accentBorder: 'hover:border-teal-400/50',
    },
    categories: [
      { name: 'Penjualan Obat Bebas/Resep', type: 'income', icon: 'Pill' },
      { name: 'Vitamin & Alat Kesehatan', type: 'income', icon: 'HeartPulse' },
      { name: 'Kulakan PBF Distributor', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Operasional & Sertifikasi', type: 'expense', icon: 'FileText' },
    ],
    channels: [
      { name: 'Apotek Offline' },
      { name: 'WhatsApp Order' },
      { name: 'Halodoc / GrabHealth' },
    ],
    wallets: [
      { name: 'Kas Laci Apotek', type: 'cash' },
      { name: 'Bank Mandiri', type: 'bank' },
    ],
  },
  {
    id: 'toko-bangunan',
    name: 'Toko Bangunan & Material',
    group: 'retail',
    description: 'Untuk toko material bangunan, cat, semen, kayu, besi & sanitari.',
    icon: 'Building2',
    keywords: ['bangunan', 'material', 'semen', 'cat', 'besi', 'kayu', 'pipa', 'pertukangan', 'proyek'],
    units: ['Sak', 'm3', 'Batang', 'Kaleng', 'Pcs'],
    theme: {
      gradient: 'from-stone-500/15 via-orange-500/10 to-transparent',
      iconBg: 'from-stone-500/20 to-orange-500/20 border-stone-500/30',
      iconColor: 'text-orange-500 dark:text-orange-400',
      accentBorder: 'hover:border-orange-500/50',
    },
    categories: [
      { name: 'Penjualan Semen & Pasir', type: 'income', icon: 'Building2' },
      { name: 'Penjualan Besi & Cat', type: 'income', icon: 'Paintbrush' },
      { name: 'Penjualan Alat Pertukangan', type: 'income', icon: 'Hammer' },
      { name: 'Belanja Material Pabrik', type: 'expense', icon: 'Truck' },
      { name: 'BBM & Muat Truk/Pick-up', type: 'expense', icon: 'Truck' },
    ],
    channels: [
      { name: 'Toko Material Offline' },
      { name: 'Pesanan Proyek WA' },
    ],
    wallets: [
      { name: 'Kasir Toko Bangunan', type: 'cash' },
      { name: 'Bank BCA Enterprise', type: 'bank' },
    ],
  },
  {
    id: 'toko-buah-sayur',
    name: 'Toko Buah & Sayur Segar',
    group: 'retail',
    description: 'Untuk toko buah impor/lokal, sayur segar & bumbu dapur harian.',
    icon: 'Apple',
    keywords: ['buah', 'sayur', 'segar', 'bumbu', 'organik', 'jus', 'pasar', 'harian'],
    units: ['kg', 'Gram', 'Pack', 'Ikat'],
    theme: {
      gradient: 'from-lime-500/15 via-emerald-500/10 to-transparent',
      iconBg: 'from-lime-500/20 to-emerald-500/20 border-lime-500/30',
      iconColor: 'text-lime-500 dark:text-lime-400',
      accentBorder: 'hover:border-lime-500/50',
    },
    categories: [
      { name: 'Penjualan Buah Segar', type: 'income', icon: 'Apple' },
      { name: 'Penjualan Sayur & Bumbu', type: 'income', icon: 'Carrot' },
      { name: 'Belanja Pasar Induk/Importir', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Kerusakan/Penyusutan Buah', type: 'expense', icon: 'Trash2' },
    ],
    channels: [
      { name: 'Toko Buah Offline' },
      { name: 'WhatsApp Delivery' },
    ],
    wallets: [
      { name: 'Kas Laci Toko', type: 'cash' },
      { name: 'QRIS Pembayaran', type: 'ewallet' },
    ],
  },
  {
    id: 'craft-souvenir',
    name: 'Kerajinan Tangan & Souvenir',
    group: 'retail',
    description: 'Untuk produsen hampers, souvenir pernikahan, mahar & handmade craft.',
    icon: 'Palette',
    keywords: ['craft', 'souvenir', 'hampers', 'hadiah', 'mahar', 'kerajinan', 'handmade', 'custom'],
    units: ['Pcs', 'Set', 'Paket'],
    theme: {
      gradient: 'from-fuchsia-500/15 via-pink-500/10 to-transparent',
      iconBg: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30',
      iconColor: 'text-fuchsia-500 dark:text-fuchsia-400',
      accentBorder: 'hover:border-fuchsia-500/50',
    },
    categories: [
      { name: 'Penjualan Souvenir / Gift', type: 'income', icon: 'Gift' },
      { name: 'Pesanan Custom / Hampers', type: 'income', icon: 'Palette' },
      { name: 'Bahan Baku & Accessories', type: 'expense', icon: 'Box' },
      { name: 'Pita & Kemasan Dus', type: 'expense', icon: 'Package' },
    ],
    channels: [
      { name: 'Shopee' },
      { name: 'Tokopedia' },
      { name: 'Instagram Catalogue' },
      { name: 'WhatsApp Custom Order' },
    ],
    wallets: [
      { name: 'Kas Studio', type: 'cash' },
      { name: 'Bank BCA', type: 'bank' },
    ],
  },
  {
    id: 'toko-olahraga',
    name: 'Toko Olahraga & Jersey',
    group: 'retail',
    description: 'Untuk toko jersey tim, raket, bola, sepatu olahraga & cetak sablon.',
    icon: 'Trophy',
    keywords: ['olahraga', 'jersey', 'bola', 'raket', 'badminton', 'futsal', 'sepatu', 'sablon', 'tim'],
    units: ['Pcs', 'Pasang', 'Set'],
    theme: {
      gradient: 'from-yellow-500/15 via-amber-500/10 to-transparent',
      iconBg: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      accentBorder: 'hover:border-yellow-500/50',
    },
    categories: [
      { name: 'Penjualan Jersey & Pakaian', type: 'income', icon: 'Trophy' },
      { name: 'Penjualan Peralatan Olahraga', type: 'income', icon: 'Activity' },
      { name: 'Jasa Cetak Sablon Nama', type: 'income', icon: 'Printer' },
      { name: 'Kulakan Jersey & Alat', type: 'expense', icon: 'ShoppingBag' },
      { name: 'Bahan Poliflex & Sablon', type: 'expense', icon: 'Package' },
    ],
    channels: [
      { name: 'Toko Olahraga Offline' },
      { name: 'Shopee' },
      { name: 'WhatsApp Order Tim' },
    ],
    wallets: [
      { name: 'Kas Laci Toko', type: 'cash' },
      { name: 'Bank Mandiri', type: 'bank' },
    ],
  },
  {
    id: 'umum-kustom',
    name: 'Usaha Umum / Standard UMKM',
    group: 'general',
    description: 'Preset umum serbaguna untuk segala jenis usaha pencatatan sederhana.',
    icon: 'Briefcase',
    keywords: ['umum', 'standard', 'bebas', 'kustom', 'usaha', 'dagang', 'jasa'],
    units: ['Pcs', 'Unit', 'Paket', 'Jasa'],
    theme: {
      gradient: 'from-indigo-500/15 via-blue-500/10 to-transparent',
      iconBg: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      accentBorder: 'hover:border-indigo-500/50',
    },
    categories: [
      { name: 'Penjualan Utama', type: 'income', icon: 'DollarSign' },
      { name: 'Pendapatan Lain-lain', type: 'income', icon: 'TrendingUp' },
      { name: 'Pembelian Stok / Modal', type: 'expense', icon: 'ShoppingCart' },
      { name: 'Operasional Usaha', type: 'expense', icon: 'Receipt' },
    ],
    channels: [
      { name: 'Penjualan Offline' },
      { name: 'Penjualan Online' },
      { name: 'WhatsApp Order' },
    ],
    wallets: [
      { name: 'Kas Tunai', type: 'cash' },
      { name: 'Rekening Bank', type: 'bank' },
    ],
  },
]

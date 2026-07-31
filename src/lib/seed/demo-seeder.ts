import type { Repositories } from '@/db/repositories'
import type { Category } from '@/db/local/schema'

export async function seedFullDemoDatabase(repos: Repositories): Promise<void> {
  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // 1. Wallets
    const walletsRes = await repos.wallets.list()
    if (!walletsRes.ok) return
    const existingWallets = walletsRes.value

    if (existingWallets.length <= 1) {
      await repos.wallets.create({ name: 'Kas Utama Toko', type: 'cash', initialBalance: 15000000 })
      await repos.wallets.create({ name: 'Bank BCA Business', type: 'bank', initialBalance: 45000000 })
      await repos.wallets.create({ name: 'Mandiri Operasional', type: 'bank', initialBalance: 20000000 })
      await repos.wallets.create({ name: 'ShopeePay & QRIS', type: 'ewallet', initialBalance: 12500000 })
    }
    const updatedWalletsRes = await repos.wallets.list()
    if (!updatedWalletsRes.ok) return
    const wallets = updatedWalletsRes.value
    const defaultWallet = wallets[0]

    // 2. Channels
    const channelsRes = await repos.channels.list()
    if (!channelsRes.ok) return
    const existingChannels = channelsRes.value

    if (existingChannels.length === 0) {
      await repos.channels.create({ name: 'Kasir Toko Fisik' })
      await repos.channels.create({ name: 'Shopee Store' })
      await repos.channels.create({ name: 'TikTok Shop' })
      await repos.channels.create({ name: 'WhatsApp Sales' })
    }
    const updatedChannelsRes = await repos.channels.list()
    const channels = updatedChannelsRes.ok ? updatedChannelsRes.value : []

    // 3. Categories
    const categoriesRes = await repos.categories.list()
    if (!categoriesRes.ok) return
    const existingCategories = categoriesRes.value

    if (existingCategories.length <= 2) {
      await repos.categories.create({ name: 'Penjualan Produk', type: 'income', icon: 'ShoppingBag', parentId: null })
      await repos.categories.create({ name: 'Jasa & Servis', type: 'income', icon: 'Wrench', parentId: null })
      await repos.categories.create({ name: 'Komisi Penjualan', type: 'income', icon: 'Sparkles', parentId: null })
      await repos.categories.create({ name: 'Stok & Bahan Baku', type: 'expense', icon: 'Package', parentId: null })
      await repos.categories.create({ name: 'Gaji & Bonus Staf', type: 'expense', icon: 'User', parentId: null })
      await repos.categories.create({ name: 'Operasional & Listrik', type: 'expense', icon: 'Zap', parentId: null })
    }
    const updatedCatRes = await repos.categories.list()
    if (!updatedCatRes.ok) return
    const categories = updatedCatRes.value

    const incomeCat1 = categories.find((c: Category) => c.type === 'income' && c.name.includes('Produk')) ?? categories[0]
    const incomeCat2 = categories.find((c: Category) => c.type === 'income' && c.name.includes('Jasa')) ?? categories[0]
    const expenseCat1 = categories.find((c: Category) => c.type === 'expense' && c.name.includes('Bahan')) ?? categories[0]
    const expenseCat2 = categories.find((c: Category) => c.type === 'expense' && c.name.includes('Operasional')) ?? categories[0]
    const expenseCat3 = categories.find((c: Category) => c.type === 'expense' && c.name.includes('Gaji')) ?? categories[0]

    // 4. Products
    const productsRes = await repos.products.list()
    if (!productsRes.ok) return
    const existingProducts = productsRes.value

    if (existingProducts.length === 0) {
      await repos.products.create({
        name: 'Voucher Data 10GB Axis',
        sku: 'VCH-AXIS-10G',
        unit: 'Voucher',
        salePrice: 35000,
      })
      await repos.products.create({
        name: 'Kabel Data Type-C Fast Charge 65W',
        sku: 'KBL-TYPC-65',
        unit: 'Pcs',
        salePrice: 35000,
      })
      await repos.products.create({
        name: 'Tempered Glass Privacy iPhone 13/14/15',
        sku: 'TG-PRIV-IP',
        unit: 'Pcs',
        salePrice: 45000,
      })
      await repos.products.create({
        name: 'Headset Bluetooth TWS i12',
        sku: 'TWS-I12-WHT',
        unit: 'Unit',
        salePrice: 85000,
      })
      await repos.products.create({
        name: 'Parfum Refill Vanilla 50ml',
        sku: 'PRF-VNL-50',
        unit: 'Botol',
        salePrice: 55000,
      })
      await repos.products.create({
        name: 'Kaos Distro Oversize Cotton 24s',
        sku: 'TSH-OVR-BLK',
        unit: 'Pcs',
        salePrice: 95000,
      })
    }

    // 5. Budgets for Current Month
    const budgetsRes = await repos.budgets.list()
    if (!budgetsRes.ok) return
    const existingBudgets = budgetsRes.value

    const currentMonthBudgets = existingBudgets.filter((b) => b.month === currentMonth)
    if (currentMonthBudgets.length === 0) {
      if (expenseCat1) {
        await repos.budgets.create({
          categoryId: expenseCat1.id,
          month: currentMonth,
          amount: 3500000,
        })
      }
      if (expenseCat2) {
        await repos.budgets.create({
          categoryId: expenseCat2.id,
          month: currentMonth,
          amount: 1500000,
        })
      }
      if (expenseCat3) {
        await repos.budgets.create({
          categoryId: expenseCat3.id,
          month: currentMonth,
          amount: 4000000,
        })
      }
    }

    // 6. Transactions for last 7 days
    const txRes = await repos.transactions.list()
    if (!txRes.ok) return
    const existingTxs = txRes.value

    if (existingTxs.length <= 2) {
      const txSamples = [
        { offsetDays: 6, type: 'income' as const, amount: 850000, cat: incomeCat1, note: 'Penjualan Aksesoris Kasir' },
        { offsetDays: 6, type: 'expense' as const, amount: 280000, cat: expenseCat1, note: 'Kulakan Kabel Data' },
        { offsetDays: 5, type: 'income' as const, amount: 1450000, cat: incomeCat1, note: 'Penjualan Paket Data Shopee' },
        { offsetDays: 5, type: 'expense' as const, amount: 450000, cat: expenseCat2, note: 'Token Listrik Toko' },
        { offsetDays: 4, type: 'income' as const, amount: 920000, cat: incomeCat2, note: 'Servis HP & Pasang Tempered Glass' },
        { offsetDays: 4, type: 'expense' as const, amount: 320000, cat: expenseCat1, note: 'Stok Tempered Glass' },
        { offsetDays: 3, type: 'income' as const, amount: 2100000, cat: incomeCat1, note: 'Grosir Voucher Data TikTok' },
        { offsetDays: 3, type: 'expense' as const, amount: 1200000, cat: expenseCat3, note: 'Gaji Mingguan Karyawan' },
        { offsetDays: 2, type: 'income' as const, amount: 1150000, cat: incomeCat1, note: 'Penjualan Parfum Refill QRIS' },
        { offsetDays: 2, type: 'expense' as const, amount: 240000, cat: expenseCat2, note: 'Internet & Wifi Toko' },
        { offsetDays: 1, type: 'income' as const, amount: 1780000, cat: incomeCat1, note: 'Order Kaos Distro Shopee' },
        { offsetDays: 1, type: 'expense' as const, amount: 550000, cat: expenseCat1, note: 'Restok Parfum & Botol' },
        { offsetDays: 0, type: 'income' as const, amount: 2450000, cat: incomeCat1, note: 'Penjualan Campuran Kasir' },
        { offsetDays: 0, type: 'expense' as const, amount: 380000, cat: expenseCat2, note: 'Beli Kemasan & Bubble Wrap' },
      ]

      for (const sample of txSamples) {
        const d = new Date(now)
        d.setDate(d.getDate() - sample.offsetDays)

        await repos.transactions.create({
          type: sample.type,
          amount: sample.amount,
          walletId: defaultWallet ? defaultWallet.id : '',
          categoryId: sample.cat ? sample.cat.id : null,
          channelId: channels.length > 0 ? channels[sample.offsetDays % channels.length]?.id ?? null : null,
          counterWalletId: null,
          note: sample.note,
          occurredAt: d.toISOString(),
          recurringRuleId: null,
        })
      }
    }
  } catch (err) {
    console.error('Failed to seed demo data:', err)
  }
}

import type {
  AccurateComparativeMonth,
  AccuratePurchaseItemRow,
  AccurateInventoryValuationRow,
} from '../../types/erp'

/**
 * Authentic ACCURATE Accounting System Data
 * Standard multi-period F&B Restaurant & Cafe financial audit dataset (SAK EMKM).
 */

export const ACCURATE_COMPARATIVE_MONTHS: AccurateComparativeMonth[] = [
  {
    monthName: 'Agustus 2026',
    grossRevenue: 380300200,
    commissionFee: 2324466,
    restaurantTaxPb1: 35239400,
    complimentVoucher: 0,
    netRevenue: 342736334,
    cogsFood: 122469950,
    cogsBeverage: 35932245,
    cogsProductionSupport: 15071500,
    cogsStockDiscrepancy: -765039, // negative deduction
    cogsWaste: 715915,
    cogsQc: 616616,
    cogsPackaging: 2001050,
    totalCogs: 176042237,
    grossProfit: 166694097,
    grossProfitMarginPct: 48.64,
    operatingExpenses: [
      {
        name: 'Beban Karyawan (Payroll)',
        amount: 47451794,
        pctOfNet: 13.84,
        subItems: [
          { name: 'Gaji Pokok Karyawan', amount: 44666794, pctOfNet: 13.03 },
          { name: 'Lembur Operasional', amount: 2160000, pctOfNet: 0.63 },
          { name: 'Upah Daily Worker (Part-time)', amount: 425000, pctOfNet: 0.12 },
          { name: 'Insentif Omset Kasir', amount: 200000, pctOfNet: 0.06 },
        ],
      },
      { name: 'Beban Sewa Tempat Restoran', amount: 36116835, pctOfNet: 10.54 },
      { name: 'Beban Katering & Makan Karyawan', amount: 9661000, pctOfNet: 2.82 },
      { name: 'Beban Penyusutan Mesin & Peralatan', amount: 6558314, pctOfNet: 1.91 },
      { name: 'Beban Supplies & Material Dapur', amount: 5320528, pctOfNet: 1.55 },
      { name: 'Beban Listrik PLN', amount: 2536045, pctOfNet: 0.74 },
      { name: 'Beban Supplies & Material Kebersihan', amount: 1182242, pctOfNet: 0.34 },
      { name: 'Beban Konsultan Pajak & Legal', amount: 2000000, pctOfNet: 0.58 },
      { name: 'Beban Alat Tulis & Kantor (ATK)', amount: 626301, pctOfNet: 0.18 },
      { name: 'Beban Pengiriman & Logistik Bahan', amount: 916000, pctOfNet: 0.27 },
      { name: 'Beban Langganan Software & POS ERP', amount: 931627, pctOfNet: 0.27 },
      { name: 'Beban Perbaikan & Pemeliharaan Kitchen', amount: 720000, pctOfNet: 0.21 },
      { name: 'Beban Asuransi & BPJS Karyawan', amount: 720720, pctOfNet: 0.21 },
      { name: 'Beban Marketing, Ads & Promosi', amount: 900000, pctOfNet: 0.26 },
      { name: 'Beban Iuran Lingkungan & Keamanan', amount: 250000, pctOfNet: 0.07 },
      { name: 'Beban P3K & Sanitasi Karyawan', amount: 158000, pctOfNet: 0.05 },
      { name: 'Beban Bensin, Parkir, Tol Operasional', amount: 236000, pctOfNet: 0.07 },
      { name: 'Beban Keperluan Kantor (Office)', amount: 5641000, pctOfNet: 1.65 },
    ],
    totalExpenses: 121926406,
    totalExpensesPct: 35.57,
    operatingProfit: 44767691,
    operatingProfitPct: 13.06,
    otherIncome: 5405430, // Bunga Bank 114.800 + Parkir 2.297.700 + Lainnya 2.992.930
    otherExpenses: 448960, // Adm Bank 148.960 + Lainnya 300.000
    profitBeforeTax: 49724161,
    profitBeforeTaxPct: 14.51,
    incomeTax: 939873, // PPh Final UMKM 0.5%
    netProfit: 48784288,
    netProfitMarginPct: 14.23,
  },
  {
    monthName: 'Juli 2026',
    grossRevenue: 297276200,
    commissionFee: 2383129,
    restaurantTaxPb1: 24510850,
    complimentVoucher: 50000,
    netRevenue: 270332221,
    cogsFood: 101602186,
    cogsBeverage: 25732530,
    cogsProductionSupport: 15722000,
    cogsStockDiscrepancy: 443314,
    cogsWaste: 110232,
    cogsQc: 685591,
    cogsPackaging: 550000,
    totalCogs: 144845852,
    grossProfit: 125486369,
    grossProfitMarginPct: 46.42,
    operatingExpenses: [
      {
        name: 'Beban Karyawan (Payroll)',
        amount: 49882642,
        pctOfNet: 18.45,
        subItems: [
          { name: 'Gaji Pokok Karyawan', amount: 47279642, pctOfNet: 17.49 },
          { name: 'Lembur Operasional', amount: 1953000, pctOfNet: 0.72 },
          { name: 'Upah Daily Worker (Part-time)', amount: 650000, pctOfNet: 0.24 },
        ],
      },
      { name: 'Beban Sewa Tempat Restoran', amount: 27115765, pctOfNet: 10.03 },
      { name: 'Beban Katering & Makan Karyawan', amount: 6910000, pctOfNet: 2.56 },
      { name: 'Beban Penyusutan Mesin & Peralatan', amount: 6427722, pctOfNet: 2.38 },
      { name: 'Beban Supplies & Material Dapur', amount: 5660536, pctOfNet: 2.09 },
      { name: 'Beban Listrik PLN', amount: 3043431, pctOfNet: 1.13 },
      { name: 'Beban Supplies & Material Kebersihan', amount: 967967, pctOfNet: 0.36 },
      { name: 'Beban Konsultan Pajak & Legal', amount: 2000000, pctOfNet: 0.74 },
      { name: 'Beban Alat Tulis & Kantor (ATK)', amount: 1219500, pctOfNet: 0.45 },
      { name: 'Beban Pengiriman & Logistik Bahan', amount: 1798000, pctOfNet: 0.67 },
      { name: 'Beban Langganan Software & POS ERP', amount: 931627, pctOfNet: 0.34 },
      { name: 'Beban Perbaikan & Pemeliharaan Kitchen', amount: 754290, pctOfNet: 0.28 },
      { name: 'Beban Asuransi & BPJS Karyawan', amount: 582573, pctOfNet: 0.22 },
      { name: 'Beban Marketing, Ads & Promosi', amount: 880000, pctOfNet: 0.33 },
      { name: 'Beban Iuran Lingkungan & Keamanan', amount: 610000, pctOfNet: 0.23 },
      { name: 'Beban P3K & Sanitasi Karyawan', amount: 148000, pctOfNet: 0.05 },
      { name: 'Beban Bensin, Parkir, Tol Operasional', amount: 215000, pctOfNet: 0.08 },
      { name: 'Beban Keperluan Kantor (Office)', amount: 5521250, pctOfNet: 2.04 },
    ],
    totalExpenses: 114758303,
    totalExpensesPct: 42.45,
    operatingProfit: 10728066,
    operatingProfitPct: 3.97,
    otherIncome: 6717289,
    otherExpenses: 126850,
    profitBeforeTax: 17318505,
    profitBeforeTaxPct: 6.41,
    incomeTax: 786576,
    netProfit: 16531929,
    netProfitMarginPct: 6.12,
  },
  {
    monthName: 'Juni 2026',
    grossRevenue: 331272800,
    commissionFee: 2376277,
    restaurantTaxPb1: 29222900,
    complimentVoucher: 147400,
    netRevenue: 299526223,
    cogsFood: 99683229,
    cogsBeverage: 35675473,
    cogsProductionSupport: 17318000,
    cogsStockDiscrepancy: 1028128,
    cogsWaste: 588579,
    cogsQc: 718317,
    cogsPackaging: 0,
    totalCogs: 155011726,
    grossProfit: 144514498,
    grossProfitMarginPct: 46.42,
    operatingExpenses: [
      {
        name: 'Beban Karyawan (Payroll)',
        amount: 50044500,
        pctOfNet: 16.71,
        subItems: [
          { name: 'Gaji Pokok Karyawan', amount: 45967500, pctOfNet: 15.35 },
          { name: 'Lembur Operasional', amount: 2277000, pctOfNet: 0.76 },
          { name: 'Upah Daily Worker (Part-time)', amount: 1800000, pctOfNet: 0.6 },
        ],
      },
      { name: 'Beban Sewa Tempat Restoran', amount: 30204995, pctOfNet: 10.08 },
      { name: 'Beban Katering & Makan Karyawan', amount: 6362000, pctOfNet: 2.12 },
      { name: 'Beban Penyusutan Mesin & Peralatan', amount: 6427722, pctOfNet: 2.15 },
      { name: 'Beban Supplies & Material Dapur', amount: 10313700, pctOfNet: 3.44 },
      { name: 'Beban Listrik PLN', amount: 2583695, pctOfNet: 0.86 },
      { name: 'Beban Supplies & Material Kebersihan', amount: 1143002, pctOfNet: 0.38 },
      { name: 'Beban Konsultan Pajak & Legal', amount: 2000000, pctOfNet: 0.67 },
      { name: 'Beban Alat Tulis & Kantor (ATK)', amount: 387500, pctOfNet: 0.13 },
      { name: 'Beban Pengiriman & Logistik Bahan', amount: 872500, pctOfNet: 0.29 },
      { name: 'Beban Langganan Software & POS ERP', amount: 484789, pctOfNet: 0.16 },
      { name: 'Beban Perbaikan & Pemeliharaan Kitchen', amount: 60000, pctOfNet: 0.02 },
      { name: 'Beban Asuransi & BPJS Karyawan', amount: 607930, pctOfNet: 0.2 },
      { name: 'Beban Marketing, Ads & Promosi', amount: 450000, pctOfNet: 0.15 },
      { name: 'Beban Iuran Lingkungan & Keamanan', amount: 250000, pctOfNet: 0.08 },
      { name: 'Beban P3K & Sanitasi Karyawan', amount: 9500, pctOfNet: 0.01 },
      { name: 'Beban Bensin, Parkir, Tol Operasional', amount: 267000, pctOfNet: 0.09 },
      { name: 'Beban Keperluan Kantor (Office)', amount: 5317000, pctOfNet: 1.78 },
    ],
    totalExpenses: 117800485,
    totalExpensesPct: 39.33,
    operatingProfit: 26714013,
    operatingProfitPct: 8.92,
    otherIncome: 9937098,
    otherExpenses: 90298,
    profitBeforeTax: 36560812,
    profitBeforeTaxPct: 12.21,
    incomeTax: 732085,
    netProfit: 35828727,
    netProfitMarginPct: 11.96,
  },
]

/**
 * Authentic ACCURATE Standar P&L & Payment Channels Breakdown
 */
export const ACCURATE_STANDARD_PNL = {
  paymentChannels: [
    { channel: 'QRIS BCA & Dinamis', grossAmount: 148500200, mdrFee: 1039501, pctOfTotal: 39.0 },
    { channel: 'EDC Debit Mandiri / BCA', grossAmount: 92400000, mdrFee: 1386000, pctOfTotal: 24.3 },
    { channel: 'Tunai Kasir (Cash)', grossAmount: 76800000, mdrFee: 0, pctOfTotal: 20.2 },
    { channel: 'Online Delivery (GoFood/Grab)', grossAmount: 42600000, mdrFee: 8520000, pctOfTotal: 11.2 },
    { channel: 'Katering B2B (Faktur Tempo)', grossAmount: 20000000, mdrFee: 0, pctOfTotal: 5.3 },
  ],
  cogsBreakdown: {
    food: 122469950,
    beverage: 35932245,
    productionSupport: 15071500,
    packaging: 2001050,
  },
}

/**
 * Authentic ACCURATE Neraca Induk Skontro (2-Column Balance Sheet)
 */
export const ACCURATE_SKONTRO_BALANCE_SHEET = {
  asOfDateLabel: 'Per Tgl. 31 Agu 2026',
  assets: {
    currentAssets: {
      cashAndBank: [
        { code: '1-1001', name: 'Kas Kecil (Petty Cash Kasir)', balance: 109900 },
        { code: '1-1002', name: 'Rekening BNI Operasional', balance: 197324057 },
        { code: '1-1003', name: 'Rekening BRI Operasional', balance: 39379188 },
        { code: '1-1004', name: 'Kas Fisik di Laci Resto', balance: 2775450 },
        { code: '1-1005', name: 'Rekening Mandiri Operasional', balance: 4831855.5 },
        { code: '1-1006', name: 'Rekening BCA Dhea (Owner)', balance: 27183771.5 },
        { code: '1-1007', name: 'Rekening BCA Selera Utama', balance: 39767251.74 },
        { code: '1-1008', name: 'Cadangan Kas Operasional', balance: 43522189 },
        { code: '1-1009', name: 'Modal Awal Kembalian Kasir', balance: 1500000 },
        { code: '1-1010', name: 'Shopeepay Merchant', balance: 33817 },
      ],
      totalCashAndBank: 356427479.74,

      receivables: [
        { code: '1-1101', name: 'Piutang Usaha IDR (Catering B2B)', balance: 200000 },
        { code: '1-1102', name: 'Kasbon Karyawan & Staf', balance: 8398050 },
        { code: '1-1103', name: 'Piutang Penjualan Settlement EDC', balance: 7646930 },
      ],
      totalReceivables: 16244980,

      inventory: [
        { code: '1-1201', name: 'Persediaan Bahan Makanan & Minuman', balance: 31768259.75 },
        { code: '1-1202', name: 'Persediaan Dalam Proses (WIP Kitchen)', balance: 0 },
      ],
      totalInventory: 31768259.75,

      otherCurrentAssets: [
        { code: '1-1301', name: 'Biaya Dibayar Dimuka (Sewa Gedung)', balance: 2532204.96 },
        { code: '1-1302', name: 'Piutang Transfer Antar Cabang', balance: 1249000 },
        { code: '1-1303', name: 'Piutang Staff Meal', balance: 2252000 },
      ],
      totalOtherCurrentAssets: 6033204.96,
      totalCurrentAssets: 410473924.45,
    },

    nonCurrentAssets: {
      fixedAssets: [
        { code: '1-1501', name: 'Mesin Kopi, Chiller, Kompor & Peralatan Dapur', balance: 258095407 },
      ],
      totalFixedAssetsCost: 258095407,
      contraDepreciation: [
        { code: '1-1502', name: 'Akumulasi Penyusutan Mesin & Peralatan', balance: -84280810.25 },
      ],
      totalContraDepreciation: -84280810.25,
      netFixedAssets: 173814596.75,
      otherAssets: [
        { code: '1-1601', name: 'Piutang Lainnya & Jaminan Sewa', balance: 6325585 },
      ],
      totalOtherAssets: 6325585,
      totalNonCurrentAssets: 180140181.75,
    },
    totalAssets: 590614106.2,
  },

  liabilitiesAndEquity: {
    liabilities: {
      currentLiabilities: [
        { code: '2-2001', name: 'Utang Usaha IDR (Supplier Daging & Sayur)', balance: 28508896 },
        { code: '2-2101', name: 'Hutang Pajak Restoran (PB1 10%)', balance: 207309050 },
        { code: '2-2102', name: 'Hutang Sewa Tempat Akrual', balance: 34666835 },
        { code: '2-2103', name: 'Hutang Deposit Karyawan', balance: 3890000 },
        { code: '2-2104', name: 'Hutang Pajak Penghasilan PPh Final', balance: 939873 },
      ],
      totalCurrentLiabilities: 275314653,
      longTermLiabilities: [],
      totalLiabilities: 275314653,
    },
    equity: [
      { code: '3-3001', name: 'Modal Disetor Pemilik Restoran', balance: 631420000 },
      { code: '3-3002', name: 'Laba Ditahan (Tahun-Tahun Lalu)', balance: -499478277.85 },
      { code: '3-3003', name: 'Laba Tahun Berjalan (Net Profit YTD)', balance: 183357731.05 },
    ],
    totalEquity: 315299453.2,
    totalLiabilitiesAndEquity: 590614106.2,
    isBalanced: true,
  },
}

/**
 * Authentic ACCURATE Rincian Pembelian per Barang (Supplier Item Purchases for Cafe & Resto)
 */
export const ACCURATE_PURCHASE_ITEMS: AccuratePurchaseItemRow[] = [
  { id: 'pi-1', invoiceNumber: 'PI.2026.08.00077', date: '03 Agt 2026', itemName: 'Daging Sapi Slice Tenderloin 500gr', quantity: 25, unit: 'Pack', totalAmount: 3750000, notes: 'Supplier Meat Central' },
  { id: 'pi-2', invoiceNumber: 'PI.2026.08.00031', date: '06 Agt 2026', itemName: 'Air Mineral Galon 19L & Dus', quantity: 20, unit: 'Galon', totalAmount: 480000, notes: 'Supplier Tirta Alami' },
  { id: 'pi-3', invoiceNumber: 'PI.2026.08.00009', date: '01 Agt 2026', itemName: 'Bumbu Dapur & Rempah Organik', quantity: 6, unit: 'kg', totalAmount: 240000, notes: 'Suplai Pasar Induk' },
  { id: 'pi-4', invoiceNumber: 'PI.2026.08.00343', date: '01 Agt 2026', itemName: 'Alpukat Mentega Fresh Grade A', quantity: 15, unit: 'kg', totalAmount: 375000, notes: 'Buah untuk Bar & Jus' },
  { id: 'pi-5', invoiceNumber: 'PI.2026.08.00089', date: '01 Agt 2026', itemName: 'Ayam Fillet Dada Fresh 1kg', quantity: 30, unit: 'kg', totalAmount: 1800000, notes: 'RPH Unggas Halal' },
  { id: 'pi-6', invoiceNumber: 'PI.2026.08.00090', date: '04 Agt 2026', itemName: 'Biji Kopi Espresso Blend Arabika 1kg', quantity: 15, unit: 'Bag', totalAmount: 3300000, notes: 'Roastery House Blend' },
  { id: 'pi-7', invoiceNumber: 'PI.2026.08.00097', date: '03 Agt 2026', itemName: 'Susu UHT Fresh Milk 1L Dus (12 pcs)', quantity: 10, unit: 'Dus', totalAmount: 2280000, notes: 'Barista Milk Greenfields' },
  { id: 'pi-8', invoiceNumber: 'PI.2026.08.00258', date: '11 Agt 2026', itemName: 'Sirup Vanilla & Caramel Gourmet 750ml', quantity: 8, unit: 'Botol', totalAmount: 1120000, notes: 'Monin / Denali Bar' },
  { id: 'pi-9', invoiceNumber: 'PI.2026.08.00090', date: '04 Agt 2026', itemName: 'Keju Mozzarella Block Import 2kg', quantity: 6, unit: 'Block', totalAmount: 1680000, notes: 'Bahan Pizza & Pasta' },
  { id: 'pi-10', invoiceNumber: 'PI.2026.08.00115', date: '09 Agt 2026', itemName: 'Daging Iga Sapi / Ribs Pilihan', quantity: 12, unit: 'kg', totalAmount: 1800000, notes: 'Sentra Daging Segar' },
  { id: 'pi-11', invoiceNumber: 'PI.2026.08.00032', date: '05 Agt 2026', itemName: 'Saus Sambal & Tomat Jerigen 5kg', quantity: 4, unit: 'Jirigen', totalAmount: 740000, notes: 'Pelengkap saji meja' },
  { id: 'pi-12', invoiceNumber: 'PI.2026.08.00314', date: '01 Agt 2026', itemName: 'Cabe Rawit Merah & Keriting Fresh', quantity: 18, unit: 'Kg', totalAmount: 720000, notes: 'Suplai bumbu pedas' },
  { id: 'pi-13', invoiceNumber: 'PI.2026.08.00007', date: '01 Agt 2026', itemName: 'Bawang Merah & Putih Kupas Bersih', quantity: 8, unit: 'kg', totalAmount: 240000, notes: 'Bumbu marinasi' },
  { id: 'pi-14', invoiceNumber: 'PI.2026.08.00028', date: '04 Agt 2026', itemName: 'Pasta Spaghetti & Fettuccine 500gr', quantity: 24, unit: 'Pack', totalAmount: 480000, notes: 'La Fonte Gourmet' },
  { id: 'pi-15', invoiceNumber: 'PI.2026.08.00004', date: '01 Agt 2026', itemName: 'Beras Pandan Wangi Cianjur 25Kg', quantity: 4, unit: 'Karung', totalAmount: 1520000, notes: 'Padi Cianjur Grade A' },
  { id: 'pi-16', invoiceNumber: 'PI.2026.08.00144', date: '20 Agt 2026', itemName: 'Sparkling Soda Water Botol Dus', quantity: 4, unit: 'Dus', totalAmount: 640000, notes: 'Mocktail & Cocktail Bar' },
  { id: 'pi-17', invoiceNumber: 'PI.2026.08.00018', date: '04 Agt 2026', itemName: 'Paper Cup & Lid 12oz Hot/Cold', quantity: 10, unit: 'Dus', totalAmount: 950000, notes: 'Takeaway cup kopi' },
  { id: 'pi-18', invoiceNumber: 'PI.2026.08.00017', date: '03 Agt 2026', itemName: 'Mentega / Butter Wijsman 2kg', quantity: 2, unit: 'Kaleng', totalAmount: 760000, notes: 'Pastry & Steak Searing' },
  { id: 'pi-19', invoiceNumber: 'PI.2026.08.00002', date: '01 Agt 2026', itemName: 'Kentang Goreng French Fries 2.5kg', quantity: 12, unit: 'Pack', totalAmount: 1140000, notes: 'Shoestring Golden' },
  { id: 'pi-20', invoiceNumber: 'PI.2026.08.00015', date: '03 Agt 2026', itemName: 'Mie Basah & Ramen Kenyal', quantity: 15, unit: 'kg', totalAmount: 195000, notes: 'Dapur Asian noodle' },
  { id: 'pi-21', invoiceNumber: 'PI.2026.08.00003', date: '01 Agt 2026', itemName: 'Tepung Terigu Serbaguna 25kg', quantity: 2, unit: 'Karung', totalAmount: 460000, notes: 'Segitiga Biru' },
  { id: 'pi-22', invoiceNumber: 'PI.2026.08.00163', date: '25 Agt 2026', itemName: 'Minyak Goreng Sawit 2L Dus (6 pcs)', quantity: 5, unit: 'Dus', totalAmount: 1805000, notes: 'Dapur penggorengan' },
  { id: 'pi-23', invoiceNumber: 'PI.2026.08.00014', date: '03 Agt 2026', itemName: 'Gas Elpiji Industri 50kg', quantity: 2, unit: 'Tabung', totalAmount: 2260000, notes: 'Kompor Heavy Duty Resto' },
  { id: 'pi-24', invoiceNumber: 'PI.2026.08.00103', date: '13 Agt 2026', itemName: 'Daging Se’i / Smoked Beef BBQ', quantity: 10, unit: 'kg', totalAmount: 3200000, notes: 'Menu signature resto' },
  { id: 'pi-25', invoiceNumber: 'PI.2026.08.00006', date: '01 Agt 2026', itemName: 'Telur Ayam Negeri Fresh 15kg', quantity: 2, unit: 'Peti', totalAmount: 780000, notes: 'Breakfast & baking' },
]

/**
 * Authentic ACCURATE Nilai Persediaan (Inventory Valuation for Cafe & Resto)
 */
export const ACCURATE_INVENTORY_VALUATION: AccurateInventoryValuationRow[] = [
  { itemCode: '100433', itemName: 'Air Mineral 600ml Botol', beginningQty: 264, beginningValuation: 390071, inQty: 720, inValuation: 1110000, outQty: 954, outValuation: 1454337, endingQty: 30, endingValuation: 45734 },
  { itemCode: '100435', itemName: 'Alpukat Mentega Fresh Grade A', beginningQty: 4.8, beginningValuation: 108806, inQty: 139, inValuation: 3514000, outQty: 137.8, outValuation: 3471646, endingQty: 6, endingValuation: 151160 },
  { itemCode: '100672', itemName: 'Daging Sapi Slice Tenderloin 500gr', beginningQty: 296, beginningValuation: 1924000, inQty: 2933, inValuation: 19064500, outQty: 2829, outValuation: 18388500, endingQty: 400, endingValuation: 2600000 },
  { itemCode: '100440', itemName: 'Ayam Fillet Dada Fresh 1kg', beginningQty: 421, beginningValuation: 1187228, inQty: 5318, inValuation: 15018192, outQty: 4539, outValuation: 12809188, endingQty: 1200, endingValuation: 3396232 },
  { itemCode: '100676', itemName: 'Kentang Goreng French Fries 2.5kg', beginningQty: 308, beginningValuation: 412720, inQty: 1033, inValuation: 1384220, outQty: 1041, outValuation: 1394940, endingQty: 300, endingValuation: 402000 },
  { itemCode: '100671', itemName: 'Biji Kopi Espresso Blend 1kg', beginningQty: 1775, beginningValuation: 1500024, inQty: 17927, inValuation: 15149817, outQty: 17112, outValuation: 14461074, endingQty: 2590, endingValuation: 2188767 },
  { itemCode: '100675', itemName: 'Susu UHT Fresh Milk 1L', beginningQty: 1522, beginningValuation: 4565997, inQty: 3174, inValuation: 9522000, outQty: 3606, outValuation: 10817997, endingQty: 1090, endingValuation: 3270000 },
  { itemCode: '100445', itemName: 'Keju Mozzarella Block Import', beginningQty: 13, beginningValuation: 317379, inQty: 234, inValuation: 5751000, outQty: 224, outValuation: 5503308, endingQty: 23, endingValuation: 565072 },
  { itemCode: '100447', itemName: 'Bawang Merah & Putih Kupas 5kg', beginningQty: 5, beginningValuation: 594950, inQty: 16, inValuation: 1921278, outQty: 20, outValuation: 2396408, endingQty: 1, endingValuation: 119820 },
  { itemCode: '100001', itemName: 'Beras Pandan Wangi Cianjur 25Kg', beginningQty: 0.5, beginningValuation: 190000, inQty: 6, inValuation: 2300000, outQty: 6.25, outValuation: 2394231, endingQty: 0.25, endingValuation: 95769 },
  { itemCode: '100683', itemName: 'Daging Iga Sapi / Beef Ribs', beginningQty: 5062.5, beginningValuation: 770206, inQty: 18750, inValuation: 2686855, outQty: 15937.5, outValuation: 2257038, endingQty: 7875, endingValuation: 1200023 },
  { itemCode: '100608', itemName: 'Saus Sambal & Tomat Jerigen 5kg', beginningQty: 30, beginningValuation: 1034249, inQty: 85, inValuation: 3145000, outQty: 100, outValuation: 3634129, endingQty: 15, endingValuation: 545119 },
  { itemCode: '100783', itemName: 'Cabe Rawit Merah Fresh', beginningQty: 0, beginningValuation: 0, inQty: 91, inValuation: 4308400, outQty: 59, outValuation: 2793358, endingQty: 32, endingValuation: 1515042 },
  { itemCode: '100622', itemName: 'Sayur Salad & Selada Segar', beginningQty: 11, beginningValuation: 82469, inQty: 250.5, inValuation: 1841000, outQty: 258, outValuation: 1897725, endingQty: 3.5, endingValuation: 25744 },
  { itemCode: '100681', itemName: 'Sirup Gourmet Vanilla & Caramel', beginningQty: 2883, beginningValuation: 1042724, inQty: 14364, inValuation: 6918488, outQty: 14112, outValuation: 6027751, endingQty: 3135, endingValuation: 1933461 },
  { itemCode: '100530', itemName: 'Minyak Goreng Sawit 2L Dus', beginningQty: 6, beginningValuation: 2146712, inQty: 5, inValuation: 1805000, outQty: 8, outValuation: 2873972, endingQty: 3, endingValuation: 1077740 },
  { itemCode: '100529', itemName: 'Pasta Spaghetti & Fettuccine', beginningQty: 5, beginningValuation: 63161, inQty: 95, inValuation: 1235000, outQty: 90, outValuation: 1168345, endingQty: 10, endingValuation: 129816 },
  { itemCode: '100780', itemName: 'Food Box Container Takeaway Eco', beginningQty: 2226, beginningValuation: 3561600, inQty: 0, inValuation: 0, outQty: 176, outValuation: 281600, endingQty: 2050, endingValuation: 3280000 },
  { itemCode: '100580', itemName: 'Gas Industri Elpiji 50kg', beginningQty: 0, beginningValuation: 0, inQty: 12, inValuation: 12950000, outQty: 12, outValuation: 12950000, endingQty: 0, endingValuation: 0 },
  { itemCode: '100738', itemName: 'Smoked Beef Slice BBQ', beginningQty: 14, beginningValuation: 323401, inQty: 91, inValuation: 1818180, outQty: 71, outValuation: 1462104, endingQty: 34, endingValuation: 679476 },
]

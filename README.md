# Nusantara F&B ERP & Operating System (Multi-Branch POS & SAK EMKM Accounting)

A complete, high-performance, offline-first Enterprise Resource Planning (ERP) & Point of Sale (POS) Operating System built specifically for modern Food & Beverage businesses, restaurants, cafes, coffee roasteries, and multi-outlet hospitality brands.

---

## 🌟 Key Features

### 1. Point of Sale (POS) & Table Management
- **Dine-In & Takeaway Modes**: Interactive visual table layout with real-time occupancy status.
- **Order & Bill Splitting**: Move tables, split bills, merge bills, and custom customer notes.
- **Speed & Touch Optimized**: Rapid category filtering, instant cart calculations, customizable modifiers & variants.
- **Menu Customization**: Real-time menu creator and catalog manager with recipe (BOM) linking.

### 2. Kitchen Display System (KDS)
- **High-Contrast Digital Tickets**: Legible from 2+ meters with large fonts and color-coded timers (Normal, Warning > 10m, Late > 15m).
- **Station Filtering**: Instant station routing for Bar (drinks) and Kitchen (food).
- **Thermal Ticket Printing**: Web-based ESC/POS 58mm/80mm ticket printing directly to kitchen printers.
- **Audio Chime Alerts**: Web Audio API chime notifications for new incoming orders.

### 3. Multi-Branch Isolation & Central HQ Consolidation
- **Physical Outlet Isolation**: When selecting a branch (e.g. *Cabang Senopati* or *Cabang Dago*), POS tables, orders, kitchen tickets, cashier shifts, and physical inventory deductions are strictly isolated to that outlet.
- **Central HQ Mode**: Switch to *🏢 Semua Cabang (Kantor Pusat)* to view consolidated performance, cross-branch comparison matrices, revenue contribution breakdowns, and group financial audits.
- **Multi-Warehouse Stock**: Real-time warehouse balance per outlet and aggregated stock visibility.

### 4. Bill of Materials (BOM) & Inventory Auto-Deduction
- **Automated Stock Deduction**: Automatically deducts ingredient raw materials based on recipes when orders are completed.
- **Food Cost (HPP) Calculation**: Accurate Cost of Goods Sold tracking down to milliliters and grams.
- **Stock Movement Log**: Audit trail for usage, wastage, supplier purchases, and internal warehouse transfers.

### 5. Indonesian Accounting Standards (SAK EMKM)
- **Double-Entry Journal Engine**: Automated journal generation for POS sales, purchases, payments, depreciation, and inventory adjustments.
- **Comprehensive Financial Statements**:
  - Laporan Laba Rugi (Income Statement)
  - Laporan Posisi Keuangan / Neraca (Balance Sheet)
  - Laporan Arus Kas (Cash Flow Statement)
  - Neraca Saldo (Trial Balance)
  - Buku Besar & Jurnal Umum (General Ledger)
- **Export Capabilities**: Professional financial export to Excel (.xlsx) and PDF.

### 6. Custom Branding & QRIS Integration
- **Branding Customization**: Real-time upload/configuration for Brand Logo, Legal Name, NPWP, Address, and Receipt Header/Footer.
- **Merchant QRIS**: Custom QRIS image upload and QR string support—displays directly on customer-facing payment screens.
- **Thermal Receipt Designer**: Live customizable thermal receipt format (58mm / 80mm).

### 7. Offline-First Architecture & Data Protection
- **Persistent Storage**: Robust `localStorage` engine guarantees data retention across tablet sleeps, network cuts, and browser refreshes.
- **Database Backup & Restore**: One-click JSON database export and import for seamless migrations and disaster recovery.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Document Generation**: jsPDF, jsPDF-AutoTable, ExcelJS
- **Date Handling**: date-fns

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/hallogroup-hq/fnb-erp.git
cd fnb-erp

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3033](http://localhost:3033) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## 📄 License
Private & Proprietary - Hallo Group / Nusantara ERP. All rights reserved.

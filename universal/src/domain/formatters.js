/**
 * universal/src/domain/formatters.js
 * Formateadores monetarios COP, cálculo de garantías, paleta de colores extendida y semillas de datos.
 */

export function formatCOP(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(numeric)
    .replace(/\$\s+/g, '$');
}

export function formatPriceInput(value) {
  if (value === '' || value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const numeric = Number(digits);
  if (Number.isNaN(numeric)) return '';
  return `$${numeric.toLocaleString('en-US')}`;
}

export function parsePriceInput(rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
  const digits = String(rawValue).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits);
}

/**
 * Paleta oficial ampliada y diferenciada para Proveedores y Accesorios (Apple HIG).
 */
export const SUPPLIER_COLORS = [
  { id: 'blue', hex: '#007AFF', label: 'Azul Eléctrico' },
  { id: 'purple', hex: '#AF52DE', label: 'Morado' },
  { id: 'green', hex: '#34C759', label: 'Verde Esmeralda' },
  { id: 'amber', hex: '#FF9500', label: 'Ámbar Cálido' },
  { id: 'pink', hex: '#FF2D55', label: 'Rosa Neón' },
  { id: 'cyan', hex: '#5AC8FA', label: 'Celeste' },
  { id: 'indigo', hex: '#5856D6', label: 'Índigo' },
  { id: 'red', hex: '#FF3B30', label: 'Rojo Carmesí' },
  { id: 'teal', hex: '#30B0C7', label: 'Turquesa' },
  { id: 'mint', hex: '#00C7BE', label: 'Menta' },
  { id: 'yellow', hex: '#FFCC00', label: 'Amarillo' },
  { id: 'orange', hex: '#FF6434', label: 'Naranja Vivo' },
  { id: 'coral', hex: '#FF6B6B', label: 'Coral' },
  { id: 'steel', hex: '#8E8E93', label: 'Titanio' },
];

export function getSupplierColor(supplier, index = 0) {
  if (supplier && supplier.color) return supplier.color;
  return SUPPLIER_COLORS[index % SUPPLIER_COLORS.length].hex;
}

/**
 * Calcula el estado de garantía independiente por ítem vendido.
 */
export function getWarrantyStatus(saleDateISO, warrantyDays = 15, warrantyClaimed = false) {
  const saleDate = new Date(saleDateISO);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - saleDate.getTime());
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, warrantyDays - elapsedDays);
  const progressPct =
    warrantyDays > 0 ? Math.min(100, Math.round((remainingDays / warrantyDays) * 100)) : 0;

  if (warrantyClaimed) {
    return {
      status: 'claimed',
      label: 'Garantía Aplicada',
      remainingDays,
      elapsedDays,
      progressPct,
      badgeColor: '#FF9F0A',
      badgeBg: 'rgba(255,159,10,0.16)',
    };
  }

  if (remainingDays <= 0) {
    return {
      status: 'expired',
      label: 'Cobertura Expirada',
      remainingDays: 0,
      elapsedDays,
      progressPct: 0,
      badgeColor: '#8E8E93',
      badgeBg: '#2C2C2E',
    };
  }

  return {
    status: 'active',
    label: `${remainingDays} de ${warrantyDays} días restantes`,
    remainingDays,
    elapsedDays,
    progressPct,
    badgeColor: remainingDays <= 7 ? '#FF9F0A' : '#30D158',
    badgeBg: remainingDays <= 7 ? 'rgba(255,159,10,0.16)' : 'rgba(48,209,88,0.16)',
  };
}

export const INITIAL_SUPPLIERS = [
  {
    id: 'sup-1',
    name: 'Importadora AppleCenter C.C. Monterrey',
    contact: '+57 300 412 8890',
    location: 'Local 214 - Medellín',
    notes: 'Mayorista principal de carga original y OEM 20W/35W',
    color: '#007AFF',
  },
  {
    id: 'sup-2',
    name: 'DistriTech San Andresito',
    contact: '+57 314 789 2211',
    location: 'Bodega 18 - Bogotá',
    notes: 'Especialistas en MagSafe, fundas silicona y blindaje cerámico',
    color: '#AF52DE',
  },
  {
    id: 'sup-3',
    name: 'AudioPro Mayorista Cali',
    contact: '+57 318 550 1920',
    location: 'Centro Comercial La Fortuna - Local 105',
    notes: 'Lotes de AirPods OEM, EarPods USB-C / Lightning',
    color: '#34C759',
  },
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Cubito Cargador iPhone 20W',
    category: 'Cargadores y Cables',
    specs: ['Cubito Cargador', 'iPhone', '20W', 'Carga Rápida USB-C'],
    salePrice: 65000,
    unitCost: 26000,
    stock: 18,
    defaultWarrantyDays: 15,
    supplierId: 'sup-1',
    lastAddedAt: '2026-10-14T10:30:00-05:00',
    lastSoldAt: '2026-10-20T11:45:00-05:00',
    batches: [
      {
        id: 'lot-101',
        date: '2026-10-14',
        qty: 25,
        unitCost: 26000,
        supplierId: 'sup-1',
        supplierName: 'Importadora AppleCenter C.C. Monterrey',
      },
    ],
  },
  {
    id: 'prod-2',
    name: 'Cable iPhone Tipo C a Tipo C Trenzado (60W)',
    category: 'Cargadores y Cables',
    specs: ['Tipo C a Tipo C', 'Cable Trenzado', 'iPhone', '60W'],
    salePrice: 45000,
    unitCost: 16500,
    stock: 24,
    defaultWarrantyDays: 15,
    supplierId: 'sup-1',
    lastAddedAt: '2026-10-15T09:15:00-05:00',
    lastSoldAt: '2026-10-20T12:20:00-05:00',
    batches: [
      {
        id: 'lot-102',
        date: '2026-10-15',
        qty: 30,
        unitCost: 16500,
        supplierId: 'sup-1',
        supplierName: 'Importadora AppleCenter C.C. Monterrey',
      },
    ],
  },
  {
    id: 'prod-3',
    name: 'Cargador Completo Anker 30W + Cable Tipo C a Tipo C Trenzado',
    category: 'Cargadores y Cables',
    specs: ['Anker', '30W', 'Con Cable Tipo C a Tipo C', 'Cable Trenzado'],
    salePrice: 85000,
    unitCost: 34000,
    stock: 9,
    defaultWarrantyDays: 15,
    supplierId: 'sup-2',
    lastAddedAt: '2026-10-10T16:00:00-05:00',
    lastSoldAt: '2026-10-19T18:10:00-05:00',
    batches: [
      {
        id: 'lot-103',
        date: '2026-10-10',
        qty: 12,
        unitCost: 34000,
        supplierId: 'sup-2',
        supplierName: 'DistriTech San Andresito',
      },
    ],
  },
  {
    id: 'prod-4',
    name: 'Forro Silicona Líquida (iPhone 13 / 14, iPhone 15 Pro Max)',
    category: 'Forros y Fundas',
    specs: ['iPhone 13 / 14', 'iPhone 15 Pro Max', 'Silicona Líquida'],
    salePrice: 55000,
    unitCost: 18000,
    stock: 14,
    defaultWarrantyDays: 15,
    supplierId: 'sup-2',
    lastAddedAt: '2026-10-12T14:20:00-05:00',
    lastSoldAt: '2026-10-20T10:05:00-05:00',
    batches: [
      {
        id: 'lot-104',
        date: '2026-10-12',
        qty: 20,
        unitCost: 18000,
        supplierId: 'sup-2',
        supplierName: 'DistriTech San Andresito',
      },
    ],
  },
  {
    id: 'prod-5',
    name: 'AirPods Pro 2da Generación (USB-C)',
    category: 'Audio',
    specs: ['AirPods Pro 2da Generación', 'Conexión / Estuche USB-C'],
    salePrice: 125000,
    unitCost: 48000,
    stock: 7,
    defaultWarrantyDays: 15,
    supplierId: 'sup-3',
    lastAddedAt: '2026-10-08T11:00:00-05:00',
    lastSoldAt: '2026-10-18T17:40:00-05:00',
    batches: [
      {
        id: 'lot-105',
        date: '2026-10-08',
        qty: 10,
        unitCost: 48000,
        supplierId: 'sup-3',
        supplierName: 'AudioPro Mayorista Cali',
      },
    ],
  },
  {
    id: 'prod-6',
    name: 'AirPods Pro 3ra Generación (MagSafe)',
    category: 'Audio',
    specs: ['AirPods Pro 3ra Generación', 'Conexión / Estuche MagSafe'],
    salePrice: 145000,
    unitCost: 58000,
    stock: 5,
    defaultWarrantyDays: 15,
    supplierId: 'sup-3',
    lastAddedAt: '2026-10-16T15:00:00-05:00',
    lastSoldAt: '2026-10-19T19:00:00-05:00',
    batches: [
      {
        id: 'lot-106',
        date: '2026-10-16',
        qty: 8,
        unitCost: 58000,
        supplierId: 'sup-3',
        supplierName: 'AudioPro Mayorista Cali',
      },
    ],
  },
];

export const INITIAL_SALES = [
  {
    id: 'sale-93',
    saleNumber: 93,
    customerName: 'Santiago Restrepo',
    note: 'Combo carga rápida iPhone 16 Pro con descuento de $5.000 en total.',
    paymentMethod: 'Nequi',
    createdAt: '2026-10-18T16:30:00-05:00',
    subtotalAmount: 165000,
    totalAmount: 160000,
    items: [
      {
        id: 'item-93-1',
        productId: 'prod-1',
        productName: 'Cubito Cargador iPhone 20W',
        specsSummary: '20W • USB-C',
        qty: 1,
        unitPriceCharged: 65000,
        unitCostSnapshot: 26000,
        supplierName: 'Importadora AppleCenter C.C. Monterrey',
        warrantyDays: 15,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      },
      {
        id: 'item-93-2',
        productId: 'prod-2',
        productName: 'Cable iPhone Tipo C a Tipo C Trenzado (60W)',
        specsSummary: '60W • Cable Trenzado',
        qty: 1,
        unitPriceCharged: 45000,
        unitCostSnapshot: 16500,
        supplierName: 'Importadora AppleCenter C.C. Monterrey',
        warrantyDays: 15,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      },
      {
        id: 'item-93-3',
        productId: 'prod-4',
        productName: 'Forro Silicona Líquida (iPhone 13 / 14, iPhone 15 Pro Max)',
        specsSummary: 'Silicona Líquida • iPhone 15 Pro Max',
        qty: 1,
        unitPriceCharged: 55000,
        unitCostSnapshot: 18000,
        supplierName: 'DistriTech San Andresito',
        warrantyDays: 15,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      },
    ],
  },
  {
    id: 'sale-92',
    saleNumber: 92,
    customerName: 'Cliente General',
    note: '',
    paymentMethod: 'Efectivo',
    createdAt: '2026-10-15T11:20:00-05:00',
    subtotalAmount: 210000,
    totalAmount: 210000,
    items: [
      {
        id: 'item-92-1',
        productId: 'prod-3',
        productName: 'Cargador Completo Anker 30W + Cable Tipo C a Tipo C Trenzado',
        specsSummary: 'Anker • 30W',
        qty: 1,
        unitPriceCharged: 85000,
        unitCostSnapshot: 34000,
        supplierName: 'DistriTech San Andresito',
        warrantyDays: 15,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      },
      {
        id: 'item-92-2',
        productId: 'prod-5',
        productName: 'AirPods Pro 2da Generación (USB-C)',
        specsSummary: 'AirPods Pro 2da Generación • USB-C',
        qty: 1,
        unitPriceCharged: 125000,
        unitCostSnapshot: 48000,
        supplierName: 'AudioPro Mayorista Cali',
        warrantyDays: 15,
        warrantyClaimed: true,
        warrantyClaimNote: 'Cambio directo por auricular derecho sin audio (17 Oct).',
      },
    ],
  },
  {
    id: 'sale-91',
    saleNumber: 91,
    customerName: 'Valentina Gómez',
    note: 'Entrega en mostrador',
    paymentMethod: 'Bancolombia',
    createdAt: '2026-10-11T18:05:00-05:00',
    subtotalAmount: 130000,
    totalAmount: 125000,
    items: [
      {
        id: 'item-91-1',
        productId: 'prod-1',
        productName: 'Cubito Cargador iPhone 20W',
        specsSummary: '20W • USB-C',
        qty: 2,
        unitPriceCharged: 62500,
        unitCostSnapshot: 26000,
        supplierName: 'Importadora AppleCenter C.C. Monterrey',
        warrantyDays: 15,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      },
    ],
  },
];

export const INITIAL_CLOSURES = [
  {
    id: 'cycle-02',
    periodLabel: 'Ciclo 01 Oct – 10 Oct 2026',
    closedAt: '2026-10-10T20:30:00-05:00',
    totalSold: 1840000,
    netProfit: 1065000,
    recoveredInvestment: 775000,
    remainingStockInvestment: 1920000,
    expectedCash: 1840000,
    realCashReported: 1720000,
    differenceNote: 'Retiro personal de $120.000 para pago de transporte de mercancía.',
    topSellers: [
      { id: 'prod-1', name: 'Cubito Cargador iPhone 20W', qty: 14, revenue: 910000, profit: 546000 },
      { id: 'prod-2', name: 'Cable iPhone Tipo C a Tipo C Trenzado (60W)', qty: 11, revenue: 495000, profit: 313500 },
      { id: 'prod-4', name: 'Forro Silicona Líquida', qty: 8, revenue: 440000, profit: 296000 },
    ],
    topReturned: [
      { id: 'prod-5', name: 'AirPods Pro 2da Generación (USB-C)', qty: 1, note: 'Auricular derecho sin audio' },
    ],
  },
  {
    id: 'cycle-01',
    periodLabel: 'Ciclo 15 Sep – 30 Sep 2026',
    closedAt: '2026-09-30T21:00:00-05:00',
    totalSold: 2390000,
    netProfit: 1380000,
    recoveredInvestment: 1010000,
    remainingStockInvestment: 1650000,
    expectedCash: 2390000,
    realCashReported: 2390000,
    differenceNote: 'Arqueo exacto sin desvíos.',
    topSellers: [
      { id: 'prod-1', name: 'Cubito Cargador iPhone 20W', qty: 19, revenue: 1235000, profit: 741000 },
      { id: 'prod-3', name: 'Cargador Completo Anker 30W', qty: 8, revenue: 680000, profit: 408000 },
    ],
    topReturned: [],
  },
];

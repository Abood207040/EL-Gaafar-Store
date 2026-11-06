import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ==============================================================================
// 1. ONLINE ORDERS LIFECYCLE & TRANSITIONS
// ==============================================================================
describe('1. Online Order Lifecycle & Transitions', () => {
  // Pure logic implementation of the status normalization & state machine
  function toCanonicalOrderStatus(status) {
    if (!status) return 'pending';
    const s = String(status).trim().toLowerCase();
    if (s === 'ready for pickup') return 'ready_pickup';
    return s;
  }

  function validateStatusTransition(currStatus, newStatus) {
    const curr = toCanonicalOrderStatus(currStatus);
    const target = toCanonicalOrderStatus(newStatus);

    const validStatuses = ['pending', 'confirmed', 'shipped', 'ready_pickup', 'delivered', 'cancelled'];
    if (!validStatuses.includes(target)) {
      throw new Error(`Invalid status: ${target}`);
    }

    if (curr === target) {
      return { noOp: true, restock: false };
    }

    if (curr === 'delivered') {
      throw new Error('Delivered orders cannot be cancelled directly. Use the returns workflow.');
    }

    if (target === 'cancelled') {
      if (['pending', 'confirmed', 'shipped', 'ready_pickup'].includes(curr)) {
        return { valid: true, restock: true, direction: 'add' };
      }
      throw new Error(`Cannot cancel order from status ${curr}`);
    }

    if (curr === 'cancelled' && ['pending', 'confirmed'].includes(target)) {
      return { valid: true, restock: true, direction: 'deduct' };
    }

    return { valid: true, restock: false };
  }

  it('normalizes status casing and spaces accurately', () => {
    assert.equal(toCanonicalOrderStatus('Pending'), 'pending');
    assert.equal(toCanonicalOrderStatus('READY FOR PICKUP'), 'ready_pickup');
    assert.equal(toCanonicalOrderStatus('cancelled'), 'cancelled');
    assert.equal(toCanonicalOrderStatus('Delivered'), 'delivered');
  });

  it('allows pending -> cancelled with stock restoration', () => {
    const res = validateStatusTransition('pending', 'cancelled');
    assert.equal(res.valid, true);
    assert.equal(res.restock, true);
    assert.equal(res.direction, 'add');
  });

  it('allows confirmed -> cancelled with stock restoration', () => {
    const res = validateStatusTransition('confirmed', 'cancelled');
    assert.equal(res.valid, true);
    assert.equal(res.restock, true);
    assert.equal(res.direction, 'add');
  });

  it('rejects delivered -> cancelled (must use returns workflow)', () => {
    assert.throws(() => {
      validateStatusTransition('delivered', 'cancelled');
    }, /Delivered orders cannot be cancelled/);
  });

  it('treats duplicate cancellation as a no-op (never restores stock twice)', () => {
    const res = validateStatusTransition('cancelled', 'cancelled');
    assert.equal(res.noOp, true);
    assert.equal(res.restock, false);
  });

  it('allows reopening cancelled order to confirmed with stock deduction', () => {
    const res = validateStatusTransition('cancelled', 'confirmed');
    assert.equal(res.valid, true);
    assert.equal(res.restock, true);
    assert.equal(res.direction, 'deduct');
  });
});

// ==============================================================================
// 2. OFFLINE RETURNS FINANCIAL ACCOUNTING
// ==============================================================================
describe('2. Offline Returns Financial Accounting Engine', () => {
  function calculateReturnFinancials({ remainingDebt, returnItemsTotal }) {
    const R = Math.round(returnItemsTotal * 100) / 100;
    const D = Math.round(remainingDebt * 100) / 100;

    const debtOffset = D > 0 ? Math.min(R, D) : 0;
    const cashRefund = Math.max(0, R - debtOffset);
    const newRemainingDebt = Math.max(0, D - debtOffset);

    return {
      totalReturnValue: R,
      debtOffset: Math.round(debtOffset * 100) / 100,
      cashRefund: Math.round(cashRefund * 100) / 100,
      newRemainingDebt: Math.round(newRemainingDebt * 100) / 100,
    };
  }

  function calculateUnitNetRefund({ itemLineTotal, itemQty, saleSubtotal, saleDiscountAmount }) {
    if (itemQty <= 0) throw new Error('Item quantity must be > 0');
    const unitGross = itemLineTotal / itemQty;
    const discountRatio = saleSubtotal > 0 ? Math.min(saleDiscountAmount / saleSubtotal, 1.0) : 0;
    const unitNet = unitGross * (1.0 - discountRatio);
    return Math.round(unitNet * 100) / 100;
  }

  it('validates benchmark scenario: Total 10,000, Paid 6,000, Debt 4,000, Return 5,000', () => {
    const result = calculateReturnFinancials({
      total: 10000,
      remainingDebt: 4000,
      returnItemsTotal: 5000,
    });

    assert.equal(result.totalReturnValue, 5000);
    assert.equal(result.debtOffset, 4000, '4000 offsets outstanding debt');
    assert.equal(result.cashRefund, 1000, '1000 surplus is customer cash refund');
    assert.equal(result.newRemainingDebt, 0, 'Remaining debt becomes 0');
  });

  it('handles partial return where return value is less than outstanding debt', () => {
    const result = calculateReturnFinancials({
      total: 10000,
      remainingDebt: 4000,
      returnItemsTotal: 2500,
    });

    assert.equal(result.totalReturnValue, 2500);
    assert.equal(result.debtOffset, 2500, 'All 2500 offsets debt');
    assert.equal(result.cashRefund, 0, 'No cash refund given');
    assert.equal(result.newRemainingDebt, 1500, 'Remaining debt reduced to 1500');
  });

  it('handles full return of fully paid invoice', () => {
    const result = calculateReturnFinancials({
      total: 8000,
      remainingDebt: 0,
      returnItemsTotal: 8000,
    });

    assert.equal(result.totalReturnValue, 8000);
    assert.equal(result.debtOffset, 0);
    assert.equal(result.cashRefund, 8000);
    assert.equal(result.newRemainingDebt, 0);
  });

  it('calculates unit net refund price with invoice discount allocation', () => {
    // 2 faucets at 500 each = 1000 line total. Subtotal = 2000, Invoice discount = 200 (10%).
    const unitNet = calculateUnitNetRefund({
      itemLineTotal: 1000,
      itemQty: 2,
      saleSubtotal: 2000,
      saleDiscountAmount: 200,
    });

    // Gross unit = 500. Discount ratio = 200 / 2000 = 10%. Net unit = 500 * 0.9 = 450.
    assert.equal(unitNet, 450);
  });

  it('prevents return quantity exceeding eligible sold quantity', () => {
    const item = { qty: 5, returnedQty: 3 };
    const requestQty = 3;
    const isEligible = requestQty > 0 && requestQty <= (item.qty - item.returnedQty);
    assert.equal(isEligible, false, 'Should reject returning 3 items when only 2 remain eligible');
  });
});

// ==============================================================================
// 3. POS CHECKOUT & GUEST DEBT RESTRICTION
// ==============================================================================
describe('3. POS Checkout Calculations & Business Rules', () => {
  function computePosCart(cart, invoiceDiscountType, invoiceDiscountValue) {
    let subtotal = 0;
    cart.forEach((item) => {
      const lineSubtotal = item.product.price * item.qty;
      const dValue = Number(item.discountValue) || 0;
      const lineDiscount = item.discountType === 'percentage'
        ? Math.round(lineSubtotal * (Math.min(dValue, 100) / 100) * 100) / 100
        : Math.min(dValue, lineSubtotal);
      subtotal += (lineSubtotal - lineDiscount);
    });

    const invDValue = Number(invoiceDiscountValue) || 0;
    const invoiceDiscount = invoiceDiscountType === 'percentage'
      ? Math.round(subtotal * (Math.min(invDValue, 100) / 100) * 100) / 100
      : Math.min(invDValue, subtotal);

    const total = Math.max(0, Math.round((subtotal - invoiceDiscount) * 100) / 100);
    return { subtotal, invoiceDiscount, total };
  }

  function validatePosCheckout({ cart, customer, paymentStatus, amountPaid, total }) {
    if (!cart || cart.length === 0) throw new Error('Cart is empty');
    const isGuest = !customer;
    const isPartial = paymentStatus === 'partial';

    if (isGuest && isPartial && amountPaid < total) {
      throw new Error('Guest customers cannot create debt. Full payment is required.');
    }

    const remaining = paymentStatus === 'full' ? 0 : Math.max(0, total - amountPaid);
    const change = (paymentStatus === 'full' && amountPaid > total) ? amountPaid - total : 0;
    return { valid: true, remaining, change };
  }

  it('computes cart totals accurately with line & invoice discounts', () => {
    const cart = [
      { product: { price: 200 }, qty: 2, discountType: 'fixed', discountValue: 50 }, // 400 - 50 = 350
      { product: { price: 100 }, qty: 1, discountType: 'percentage', discountValue: 20 }, // 100 - 20 = 80
    ];
    // Subtotal = 350 + 80 = 430
    // Invoice discount 10% = 43
    // Total = 387
    const { subtotal, invoiceDiscount, total } = computePosCart(cart, 'percentage', 10);
    assert.equal(subtotal, 430);
    assert.equal(invoiceDiscount, 43);
    assert.equal(total, 387);
  });

  it('blocks guest customer from creating debt on partial payment', () => {
    assert.throws(() => {
      validatePosCheckout({
        cart: [{ product: { price: 500 }, qty: 1 }],
        customer: null, // guest
        paymentStatus: 'partial',
        amountPaid: 200,
        total: 500,
      });
    }, /Guest customers cannot create debt/);
  });

  it('allows registered customer to have partial payment with debt', () => {
    const res = validatePosCheckout({
      cart: [{ product: { price: 500 }, qty: 1 }],
      customer: { id: 'cust-123', full_name: 'Ahmed' },
      paymentStatus: 'partial',
      amountPaid: 200,
      total: 500,
    });
    assert.equal(res.valid, true);
    assert.equal(res.remaining, 300);
  });

  it('computes change for full cash payment when paid exceeds total', () => {
    const res = validatePosCheckout({
      cart: [{ product: { price: 350 }, qty: 1 }],
      customer: null,
      paymentStatus: 'full',
      amountPaid: 400,
      total: 350,
    });
    assert.equal(res.change, 50);
    assert.equal(res.remaining, 0);
  });
});

// ==============================================================================
// 4. BARCODE SCANNER LOGIC
// ==============================================================================
describe('4. POS Barcode Scanner Resolution', () => {
  const products = [
    { id: '1', barcode: '123456789012', sku: 'AJ-VAL-001', nameEn: 'Angle Valve 1/2', stock: 10 },
    { id: '2', barcode: '987654321098', sku: 'AJ-PIP-002', nameEn: 'PPR Pipe 25mm', stock: 0 },
    { id: '3', barcode: '555666777888', sku: 'AJ-MIX-003', nameEn: 'Bath Mixer', stock: 5 },
  ];

  function resolveBarcode(code, catalog) {
    const raw = String(code || '').trim().toLowerCase();
    if (!raw) return null;

    let match = catalog.find((p) => p.barcode && p.barcode.trim().toLowerCase() === raw);
    if (!match) {
      match = catalog.find((p) => p.sku && p.sku.trim().toLowerCase() === raw);
    }
    return match || null;
  }

  it('resolves exact barcode match with high priority', () => {
    const item = resolveBarcode('123456789012', products);
    assert.ok(item);
    assert.equal(item.id, '1');
  });

  it('resolves exact SKU when barcode is not matched', () => {
    const item = resolveBarcode('aj-mix-003', products);
    assert.ok(item);
    assert.equal(item.id, '3');
  });

  it('handles spaces and casing cleanly', () => {
    const item = resolveBarcode('  AJ-VAL-001  ', products);
    assert.ok(item);
    assert.equal(item.id, '1');
  });

  it('detects out of stock condition for matched barcode', () => {
    const item = resolveBarcode('987654321098', products);
    assert.ok(item);
    assert.equal(item.stock, 0);
  });
});

// ==============================================================================
// 5. DYNAMIC TECHNICAL SPECIFICATIONS
// ==============================================================================
describe('5. Dynamic Technical Specifications Normalization & Bilingual Display', () => {
  function normalizeTechnicalSpecs(specs, isArabic) {
    if (!Array.isArray(specs)) return [];
    return specs
      .filter((s) => (s.name_en || s.nameEn || s.name_ar || s.nameAr) && (s.value_en || s.valueEn || s.value_ar || s.valueAr))
      .map((s) => {
        const label = isArabic
          ? (s.name_ar || s.nameAr || s.name_en || s.nameEn)
          : (s.name_en || s.nameEn || s.name_ar || s.nameAr);
        const val = isArabic
          ? (s.value_ar || s.valueAr || s.value_en || s.valueEn)
          : (s.value_en || s.valueEn || s.value_ar || s.valueAr);
        return { label, val };
      });
  }

  const sampleSpecs = [
    { name_en: 'Size', name_ar: 'المقاس', value_en: '3/4 inch', value_ar: '3/4 بوصة' },
    { name_en: 'Material', name_ar: 'الخامة', value_en: 'Solid Brass', value_ar: 'نحاس نقي' },
    { name_en: 'Warranty', name_ar: 'الضمان', value_en: '5 Years', value_ar: '5 سنوات' },
  ];

  it('renders Arabic labels and values when language is Arabic', () => {
    const normalized = normalizeTechnicalSpecs(sampleSpecs, true);
    assert.equal(normalized[0].label, 'المقاس');
    assert.equal(normalized[0].val, '3/4 بوصة');
    assert.equal(normalized[1].label, 'الخامة');
    assert.equal(normalized[1].val, 'نحاس نقي');
  });

  it('renders English labels and values when language is English', () => {
    const normalized = normalizeTechnicalSpecs(sampleSpecs, false);
    assert.equal(normalized[0].label, 'Size');
    assert.equal(normalized[0].val, '3/4 inch');
    assert.equal(normalized[1].label, 'Material');
    assert.equal(normalized[1].val, 'Solid Brass');
  });

  it('falls back gracefully when one language is omitted', () => {
    const partial = [{ name_en: 'Pressure Rating', value_en: '16 Bar' }];
    const arabicView = normalizeTechnicalSpecs(partial, true);
    assert.equal(arabicView[0].label, 'Pressure Rating');
    assert.equal(arabicView[0].val, '16 Bar');
  });
});

// ==============================================================================
// 6. BRANDING INTEGRITY ACROSS CODEBASE
// ==============================================================================
describe('6. Branding Integrity & Official Arabic Name Verification', () => {
  it('ensures store.js uses official Arabic name: شركة الجعفر', async () => {
    const storeConstPath = path.join(projectRoot, 'src', 'constants', 'store.js');
    const content = fs.readFileSync(storeConstPath, 'utf8');
    assert.match(content, /nameAr:\s*['"]شركة الجعفر['"]/);
  });

  it('verifies zero occurrences of deprecated Arabic store names in src/', () => {
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && /\.(jsx?|html)$/.test(entry.name)) {
          const text = fs.readFileSync(fullPath, 'utf8');
          assert.doesNotMatch(
            text,
            /متجر الجعفر|مؤسسة الجعفر/,
            `Deprecated brand name found in ${fullPath}`
          );
        }
      }
    }
    scanDir(path.join(projectRoot, 'src'));
  });
});

// ==============================================================================
// 7. SQL MIGRATION SECURITY & SYNTAX VALIDATION
// ==============================================================================
describe('7. SQL Migration Integrity & Security Audits', () => {
  it('verifies phase15_order_lifecycle_and_returns.sql structure and security rules', () => {
    const sqlPath = path.join(projectRoot, 'phase15_order_lifecycle_and_returns.sql');
    assert.ok(fs.existsSync(sqlPath), 'phase15 migration file must exist');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 1. Transaction wrapping
    assert.match(sql, /^BEGIN;/m, 'Must begin transaction');
    assert.match(sql, /COMMIT;$/m, 'Must commit transaction');

    // 2. Security Definier search path hardening
    assert.match(sql, /SECURITY DEFINER\s+SET search_path = public, pg_temp/m, 'SECURITY DEFINER must set search_path');

    // 3. Admin authorization checks inside RPCs
    assert.match(sql, /role = 'admin'/m, 'Must verify admin role');

    // 4. Row locking to prevent race conditions
    assert.match(sql, /FOR UPDATE/m, 'Must use FOR UPDATE row locking');

    // 5. Graceful column upgrades for pre-existing tables
    assert.match(sql, /ALTER TABLE public\.offline_returns[\s\S]+?ADD COLUMN IF NOT EXISTS customer_id/);
    assert.match(sql, /ALTER TABLE public\.offline_returns[\s\S]+?ADD COLUMN IF NOT EXISTS return_number/);
    assert.match(sql, /ALTER TABLE public\.offline_return_items[\s\S]+?ADD COLUMN IF NOT EXISTS sale_item_id/);
  });

  it('verifies phase16_dynamic_technical_specs.sql structure', () => {
    const sqlPath = path.join(projectRoot, 'phase16_dynamic_technical_specs.sql');
    assert.ok(fs.existsSync(sqlPath), 'phase16 migration file must exist');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    assert.match(sql, /ADD COLUMN IF NOT EXISTS technical_specs JSONB/m);
    assert.match(sql, /jsonb_agg\(spec\)/m);
  });
});

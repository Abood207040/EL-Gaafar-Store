import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { listOfflineProducts, createOfflineSale, holdSale } from '../../services/adminOfflineService.js';
import { useLocalization } from '../../i18n/Localization.jsx';

const PosContext = createContext(null);

export function PosProvider({ children, navigate, activeShift, onShiftEnded }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { parseRpcError } = useLocalization();
  
  // Catalog filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Cart & Sale State
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null); // null means 'Walk-in Customer'
  
  const [invoiceDiscountType, setInvoiceDiscountType] = useState('fixed'); // 'fixed' | 'percentage'
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('full'); // 'full' | 'partial'
  const [amountPaid, setAmountPaid] = useState('');
  
  // Processing
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Completed Sale info for Receipt
  const [completedSaleData, setCompletedSaleData] = useState(null); 

  useEffect(() => {
    let ignore = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await listOfflineProducts();
        if (!ignore) setProducts(data);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load POS products.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchProducts();
    return () => { ignore = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const s = search.toLowerCase().trim();
      const matchSearch = !s || 
        p.barcode?.toLowerCase().includes(s) ||
        p.nameEn?.toLowerCase().includes(s) || 
        p.nameAr?.toLowerCase().includes(s) || 
        p.sku?.toLowerCase().includes(s);
      
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      
      return matchSearch && matchCategory && matchBrand;
    });
  }, [products, search, selectedCategory, selectedBrand]);

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1, discountType: 'fixed', discountValue: '' }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty > item.product.stock) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter((item) => item.qty > 0)
    );
  };

  const setQty = (productId, newQty) => {
     setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (newQty > item.product.stock) return { ...item, qty: item.product.stock };
          return { ...item, qty: newQty };
        }
        return item;
      }).filter((item) => item.qty > 0)
    );
  }
  
  const updateItemDiscount = (productId, type, value) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, discountType: type, discountValue: value };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setInvoiceDiscountType('fixed');
    setInvoiceDiscountValue('');
    setAmountPaid('');
    setPaymentStatus('full');
    setPaymentMethod('cash');
    setCustomer(null);
  };

  const holdCartLocally = async () => {
    if (cart.length === 0) return;
    const notes = prompt('Enter a note for this held cart (e.g. Customer name):') || '';
    await holdSale(customer?.id || null, cart, notes);
    clearCart();
  };

  // --- Authoritative Frontend Preview Calculations ---
  // Must match exactly what create_offline_sale RPC does

  const cartCalculations = useMemo(() => {
    let subtotal = 0;
    
    cart.forEach(item => {
      const lineSubtotal = item.product.price * item.qty;
      let lineDiscount;
      const dValue = Number(item.discountValue) || 0;
      
      if (item.discountType === 'percentage') {
        const cappedValue = Math.min(dValue, 100);
        lineDiscount = Number((lineSubtotal * (cappedValue / 100)).toFixed(2));
      } else {
        lineDiscount = Math.min(dValue, lineSubtotal);
      }
      
      subtotal += (lineSubtotal - lineDiscount);
    });

    let invoiceDiscount;
    const invDValue = Number(invoiceDiscountValue) || 0;
    if (invoiceDiscountType === 'percentage') {
      const cappedValue = Math.min(invDValue, 100);
      invoiceDiscount = Number((subtotal * (cappedValue / 100)).toFixed(2));
    } else {
      invoiceDiscount = Math.min(invDValue, subtotal);
    }

    const total = Math.max(0, subtotal - invoiceDiscount);
    return { subtotal, invoiceDiscount, total };
  }, [cart, invoiceDiscountType, invoiceDiscountValue]);

  const { subtotal, total, invoiceDiscount } = cartCalculations;
  
  const safeAmountPaid = Number(amountPaid) || 0;
  
  // Change calculation is ONLY relevant if they give us more cash than the total and we want to show change.
  // The backend ledger will cap the actual paid amount to the total.
  const changeAmount = (paymentMethod === 'cash' && paymentStatus === 'full') ? Math.max(0, safeAmountPaid - total) : 0;
  
  const remainingBalance = paymentStatus === 'full' ? 0 : Math.max(0, total - safeAmountPaid);
  
  // Validation constraints
  const isGuest = !customer;
  const isPartialPayment = paymentStatus === 'partial';
  const guestDebtBlocked = isGuest && isPartialPayment && safeAmountPaid < total;
  
  const canCheckout = cart.length > 0 && !processing && !guestDebtBlocked && (
    paymentStatus === 'partial' ? (safeAmountPaid >= 0 && safeAmountPaid < total) : (safeAmountPaid >= total || safeAmountPaid === 0 /* UX fallback, if full we might auto-fill */)
  );

  const handleCheckout = async () => {
    // Determine the actual amount to record
    let finalAmountToRecord = safeAmountPaid;
    if (paymentStatus === 'full') {
       // If they selected full, and typed 0 or left it blank, or typed EXACTLY total, or typed MORE than total, we record exactly total
       if (safeAmountPaid === 0 || safeAmountPaid >= total) {
         finalAmountToRecord = total;
       }
    } else {
       // Partial payment, they must have typed something less than total
       if (finalAmountToRecord >= total) {
          alert("For partial payment, amount paid must be less than total.");
          return;
       }
    }

    if (isGuest && finalAmountToRecord < total) {
      alert("Guest customers cannot create debt. Full payment is required.");
      return;
    }

    if (!cart.length) return;
    
    setProcessing(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const newSaleId = await createOfflineSale(
        cart, 
        paymentMethod, 
        customer?.id || null, 
        invoiceDiscountType,
        Number(invoiceDiscountValue) || 0,
        finalAmountToRecord,
        paymentStatus === 'partial' ? 'Partial initial payment' : ''
      );
      
      setCompletedSaleData({
        id: newSaleId,
        date: new Date().toISOString(),
        customer,
        items: [...cart],
        subtotal,
        invoiceDiscount,
        total,
        paymentMethod,
        amountReceived: finalAmountToRecord,
        changeAmount,
        remainingBalance: total - finalAmountToRecord
      });

      setProducts(prevProducts => prevProducts.map(p => {
        const cartItem = cart.find(c => c.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.qty };
        }
        return p;
      }));

      clearCart();
    } catch (err) {
      setError(parseRpcError(err));
    } finally {
      setProcessing(false);
    }
  };

  const closeReceipt = () => {
    setCompletedSaleData(null);
  };

  const value = {
    products, loading, error, setError,
    search, setSearch,
    selectedCategory, setSelectedCategory,
    selectedBrand, setSelectedBrand,
    filteredProducts,
    
    cart, addToCart, updateQty, setQty, updateItemDiscount, removeFromCart, clearCart, holdCartLocally,
    customer, setCustomer,
    
    invoiceDiscountType, setInvoiceDiscountType,
    invoiceDiscountValue, setInvoiceDiscountValue,
    
    paymentMethod, setPaymentMethod,
    paymentStatus, setPaymentStatus,
    amountPaid, setAmountPaid,
    
    subtotal, total, changeAmount, remainingBalance, guestDebtBlocked,
    canCheckout, processing, handleCheckout, successMessage,
    
    completedSaleData, closeReceipt,
    navigate, activeShift, onShiftEnded
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within a PosProvider');
  return context;
}

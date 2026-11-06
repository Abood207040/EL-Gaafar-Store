import { useState, useEffect, useCallback } from 'react';
import { listHeldSales, deleteHeldSale } from '../../services/adminOfflineService.js';
import { usePos } from './PosContext.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function HeldSalesModal() {
  const { t, isArabic } = useLocalization();
  const { cart, setCart, setCustomer } = usePos();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHeldSales();
      setSales(data);
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Listen for modal open
  useEffect(() => {
    const dialog = document.getElementById('held-sales-modal');
    if (!dialog) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'open' && dialog.hasAttribute('open')) {
          fetchSales();
        }
      });
    });
    
    observer.observe(dialog, { attributes: true });
    return () => observer.disconnect();
  }, [fetchSales]);

  const close = () => {
    document.getElementById('held-sales-modal')?.close();
  };

  const handleResume = async (sale) => {
    if (cart.length > 0) {
      const confirmMsg = t('resumeSaleConfirm');
      if (!window.confirm(confirmMsg)) return;
    }
    
    try {
      // Restore state
      setCart(sale.cart_json);
      if (sale.customer_id) {
        setCustomer({ id: sale.customer_id, full_name: sale.customers?.full_name });
      } else {
        setCustomer(null);
      }
      
      // Delete from held sales table since it's now active
      await deleteHeldSale(sale.id);
      close();
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteHeldSaleConfirm'))) return;
    try {
      await deleteHeldSale(id);
      setSales(sales.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    }
  };

  return (
    <dialog id="held-sales-modal" className="modal">
      <div className="modal-content" style={{ maxWidth: '600px', width: '100%', padding: '1.5rem', background: 'var(--bg-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('heldSales')}</h3>
          <button className="btn-close" onClick={close} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        
        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>{t('loading')}...</p>
        ) : sales.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>{t('noHeldCarts')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {sales.map(sale => (
              <div key={sale.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>{sale.notes || t('noNotes')}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
                    {new Date(sale.created_at).toLocaleString()} • {sale.cart_json?.length || 0} {isArabic ? 'عناصر' : 'items'}
                    {sale.customers?.full_name ? ` • ${isArabic ? 'العميل: ' : 'Customer: '}${sale.customers.full_name}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleResume(sale)}>{t('resumeSale')}</button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(sale.id)}>{t('delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}

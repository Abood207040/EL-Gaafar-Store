import { usePos } from './PosContext.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import PosCartItem from './PosCartItem.jsx';
import PosCheckout from './PosCheckout.jsx';
import PosCustomerSelector from './PosCustomerSelector.jsx';
import { useState } from 'react';

export default function PosCart() {
  const { t } = useLocalization();
  const { cart, clearCart, processing, holdCartLocally } = usePos();
  const [holding, setHolding] = useState(false);

  const handleHoldCart = async () => {
    if (cart.length === 0) return;
    setHolding(true);
    try {
      await holdCartLocally();
    } catch (err) {
      alert(err.message || 'Failed to hold cart');
    } finally {
      setHolding(false);
    }
  };

  return (
    <div className="card pos-cart-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', borderRadius: '12px', border: 'none' }}>
      <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          {t('currentSale') || 'Current Sale'}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={handleHoldCart} 
            disabled={cart.length === 0 || processing || holding}
            style={{ fontWeight: 600, padding: '0.4rem 0.75rem', borderRadius: '6px' }}
          >
            {holding ? 'Holding...' : 'Hold Cart'}
          </button>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={clearCart} 
            disabled={cart.length === 0 || processing || holding}
            style={{ fontWeight: 600, padding: '0.4rem 0.75rem', borderRadius: '6px', color: cart.length > 0 ? '#ef4444' : 'inherit', borderColor: cart.length > 0 ? '#fecaca' : 'inherit' }}
          >
            {t('clearSale') || 'Clear'}
          </button>
        </div>
      </div>
      
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <PosCustomerSelector />
      </div>
      
      <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', background: '#f8fafc' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '50%' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Cart is empty</p>
              <p style={{ fontSize: '0.9rem' }}>Scan barcodes or click products to add.</p>
            </div>
          </div>
        ) : (
          <div className="pos-cart-list" style={{ padding: '0 1.25rem' }}>
            {cart.map((item) => (
              <PosCartItem key={item.product.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <PosCheckout />
    </div>
  );
}

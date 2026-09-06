import { useState, useEffect } from 'react';
import { usePos } from './PosContext.jsx';
import PosHeader from './PosHeader.jsx';
import PosCatalog from './PosCatalog.jsx';
import PosCart from './PosCart.jsx';
import PosReceipt from './PosReceipt.jsx';
import HeldSalesModal from './HeldSalesModal.jsx';

export default function PosLayout() {
  const { completedSaleData, cart, total } = usePos();
  const [isMobilePos, setIsMobilePos] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'cart'

  useEffect(() => {
    const checkWidth = () => {
      setIsMobilePos(window.innerWidth < 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (completedSaleData) {
    return <PosReceipt />;
  }

  const cartItemCount = cart.reduce((acc, item) => acc + (item.qty || 1), 0);

  return (
    <div className="pos-layout-wrapper">
      <PosHeader />

      {/* Segmented View Controls for Responsive mobile/tablet POS (< 1024px) */}
      {isMobilePos && (
        <nav className="pos-mobile-nav" aria-label="POS Views">
          <button
            type="button"
            className={`pos-mobile-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Catalog</span>
          </button>
          <button
            type="button"
            className={`pos-mobile-tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>Cart ({cartItemCount})</span>
            {total > 0 && <span style={{ opacity: 0.9, fontSize: '0.8rem' }}>EGP {total.toFixed(0)}</span>}
          </button>
        </nav>
      )}

      {/* Main Content: Side-by-side on >= 1024px, or Segmented on < 1024px */}
      <div className="pos-main-content">
        {!isMobilePos ? (
          <>
            <PosCatalog />
            <PosCart />
          </>
        ) : activeTab === 'catalog' ? (
          <PosCatalog />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setActiveTab('catalog')}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
            >
              ← Back to Catalog
            </button>
            <PosCart />
          </div>
        )}
      </div>

      {/* Persistent Action / Total Bar when browsing Catalog on < 1024px */}
      {isMobilePos && activeTab === 'catalog' && cart.length > 0 && (
        <aside className="pos-mobile-action-bar animate-slideUp">
          <div className="pos-mobile-action-bar-info">
            <span className="pos-mobile-action-bar-total">EGP {total.toFixed(2)}</span>
            <span className="pos-mobile-action-bar-count">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in current sale
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('cart')}
            style={{ fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '8px' }}
          >
            Review & Checkout →
          </button>
        </aside>
      )}

      <HeldSalesModal />
    </div>
  );
}

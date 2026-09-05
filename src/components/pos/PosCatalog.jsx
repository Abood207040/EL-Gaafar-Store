import { usePos } from './PosContext.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import PosProductCard from './PosProductCard.jsx';

export default function PosCatalog() {
  const { t } = useLocalization();
  const { 
    search, setSearch, 
    filteredProducts, 
    loading, 
    addToCart 
  } = usePos();

  return (
    <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="search"
          className="input"
          placeholder={t('searchProducts') + " (Name, SKU, Barcode)..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ flex: 1 }}
        />
        {/* Categories/Brands filters can be added here in the future */}
      </div>
      
      <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg-color)' }}>
        {loading ? (
          <p>{t('loading')}...</p>
        ) : filteredProducts.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>No products found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {filteredProducts.map((p) => (
              <PosProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

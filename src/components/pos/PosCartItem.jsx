import { usePos } from './PosContext.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function PosCartItem({ item }) {
  const { productName, t } = useLocalization();
  const { updateQty, setQty, removeFromCart, updateItemDiscount } = usePos();
  
  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setQty(item.product.id, val);
    }
  };

  const lineSubtotal = item.product.price * item.qty;
  
  let displayLineTotal = lineSubtotal;
  let discountAmount = 0;
  if (item.discountValue > 0) {
    if (item.discountType === 'percentage') {
      discountAmount = (lineSubtotal * item.discountValue) / 100;
    } else {
      discountAmount = item.discountValue;
    }
    displayLineTotal = Math.max(0, lineSubtotal - discountAmount);
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      marginBottom: '1rem', 
      background: 'var(--bg-color)',
      border: '1px solid var(--border-color)', 
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
            {productName(item.product)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', background: 'var(--surface-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              SKU: {item.product.sku}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              EGP {item.product.price.toFixed(2)} / {t('unit') || 'unit'} 
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {discountAmount > 0 && (
              <span style={{ display: 'inline-block', fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--muted)' }}>
                EGP {lineSubtotal.toFixed(2)}
              </span>
            )}
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: discountAmount > 0 ? 'var(--success)' : 'var(--text-color)' }}>
              EGP {displayLineTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
        
        {/* Discount Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>{t('discount') || 'Discount'}:</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <select 
              style={{ padding: '0.25rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', background: 'var(--bg-color)', borderRadius: '4px' }}
              value={item.discountType || 'fixed'} 
              onChange={(e) => updateItemDiscount(item.product.id, e.target.value, item.discountValue)}
            >
              <option value="fixed">EGP</option>
              <option value="percentage">%</option>
            </select>
            <input 
              type="number" 
              placeholder="0"
              style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' }}
              value={item.discountValue || ''}
              onChange={(e) => updateItemDiscount(item.product.id, item.discountType || 'fixed', e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Quantity Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--surface-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <button style={{ padding: '0.3rem 0.6rem', color: 'var(--text-color)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => updateQty(item.product.id, -1)}>-</button>
          
          <input 
            type="number"
            value={item.qty}
            onChange={handleQtyChange}
            style={{ width: '45px', textAlign: 'center', border: 'none', borderInlineStart: '1px solid var(--border-color)', borderInlineEnd: '1px solid var(--border-color)', background: 'transparent', fontSize: '0.9rem', fontWeight: 'bold' }}
            min="1"
            max={item.product.stock}
          />
          
          <button style={{ padding: '0.3rem 0.6rem', color: 'var(--text-color)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => updateQty(item.product.id, 1)}>+</button>
          
          <button 
            style={{ padding: '0.3rem 0.6rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', borderInlineStart: '1px solid var(--border-color)' }} 
            onClick={() => removeFromCart(item.product.id)}
            title={t('remove') || "Remove item"}
          >
            ✕
          </button>
        </div>

      </div>
    </div>
  );
}

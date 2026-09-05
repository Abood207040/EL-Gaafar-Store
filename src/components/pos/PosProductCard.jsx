import { useLocalization } from '../../i18n/Localization.jsx';
import placeholderImg from '../../assets/main-image.png';

export default function PosProductCard({ product, onAdd }) {
  const { productName } = useLocalization();
  const outOfStock = product.stock <= 0;

  return (
    <button
      className="pos-product-card card"
      onClick={onAdd}
      disabled={outOfStock}
      style={{
        padding: '0.5rem',
        textAlign: 'left',
        cursor: outOfStock ? 'not-allowed' : 'pointer',
        opacity: outOfStock ? 0.6 : 1,
        border: '1px solid var(--border-color)',
        transition: 'transform 0.1s',
        position: 'relative'
      }}
      onMouseDown={(e) => { if (!outOfStock) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <img 
        src={product.image || placeholderImg} 
        alt={productName(product)} 
        style={{ width: '100%', height: '100px', objectFit: 'contain', marginBottom: '0.5rem', borderRadius: '4px' }} 
      />
      <p style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {productName(product)}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{product.sku}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>EGP {product.price.toFixed(2)}</span>
        <span style={{ fontSize: '0.75rem', color: outOfStock ? 'var(--danger)' : 'var(--success)' }}>
          {product.stock} {outOfStock ? 'Out' : 'In'}
        </span>
      </div>
    </button>
  );
}

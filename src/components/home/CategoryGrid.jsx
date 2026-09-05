import { useLocalization } from '../../i18n/Localization.jsx';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';

export default function CategoryGrid({ navigate }) {
  const { t, translateCategory } = useLocalization();
  const { categoryObjects } = useCatalogOptions();

  // Filter to active categories, exclude "All", and limit to 8
  const displayCategories = (categoryObjects || [])
    .filter(c => c.is_active && c.name_en.toLowerCase() !== 'all')
    .slice(0, 8);

  if (displayCategories.length === 0) return null;

  return (
    <section className="category-section bg-white" id="category-grid" aria-label={t('popularCategories')}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t('popularCategories')}</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('shop')}>
            {t('shopAllProducts')} &rarr;
          </button>
        </div>

        <div className="category-grid">
          {displayCategories.map(cat => {
            const hasImage = Boolean(cat.image_url && cat.image_url.trim() !== '');
            const displayName = translateCategory(cat.name_en);

            return (
              <button
                key={cat.id || cat.name_en}
                type="button"
                className="category-card"
                onClick={() => navigate('shop', { category: cat.name_en })}
                aria-label={displayName}
                style={{ overflow: 'hidden', padding: 0, border: '1px solid var(--border)' }}
              >
                <div className="category-card-img-wrap">
                  {hasImage ? (
                    <img
                      src={cat.image_url}
                      alt={displayName}
                      className="category-card-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div
                    style={{
                      display: hasImage ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      gap: '0.5rem',
                    }}
                  >
                    <img
                      src="/images/transparentlogo.png"
                      alt="Ga3for"
                      style={{ maxWidth: '64px', opacity: 0.65, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
                    />
                  </div>
                </div>

                <div className="category-card-inner" style={{ padding: '0.875rem 1rem', width: '100%', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <span className="category-card-name">{displayName}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

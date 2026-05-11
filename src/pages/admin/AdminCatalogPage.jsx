import { useEffect, useMemo, useState } from 'react';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { listAdminProducts } from '../../services/productsService.js';

function OptionManager({
  title,
  description,
  options,
  customOptions,
  countByOption,
  onAdd,
  onRemove,
}) {
  const { t } = useLocalization();
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const added = await onAdd({ nameEn, nameAr });
      setMessage(added ? t('added', nameEn.trim()) : t('enterUniqueName'));
      if (added) {
        setNameEn('');
        setNameAr('');
      }
    } catch (error) {
      setMessage(error.message || t('enterUniqueName'));
    }
  };

  return (
    <section className="card catalog-manager-card">
      <div className="card-header">
        <div>
          <h2 style={{ fontSize: '1rem' }}>{title}</h2>
          <p className="section-subtitle">{description}</p>
        </div>
        <span className="badge badge-muted">{t('totalLabel', options.filter((item) => item !== 'All').length)}</span>
      </div>
      <div className="card-body">
        <form className="catalog-add-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor={`${title}-name-en`}>English Name</label>
            <input
              id={`${title}-name-en`}
              className="input"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              placeholder="English name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${title}-name-ar`}>Arabic Name</label>
            <input
              id={`${title}-name-ar`}
              className="input"
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
              placeholder="الاسم العربي"
              dir="rtl"
            />
          </div>
          <button className="btn btn-primary" type="submit">{t('add')}</button>
        </form>
        {message && <p className="form-hint catalog-form-message">{message}</p>}

        <div className="catalog-option-list" aria-label={`${title} list`}>
          {options.filter((item) => item !== 'All').map((item) => {
            const isCustom = customOptions.includes(item);
            return (
              <div key={item} className="catalog-option-row">
                <div>
                  <p className="catalog-option-name">{item}</p>
                  <p className="form-hint">
                    {t('productCountType', countByOption(item), isCustom ? t('custom') : t('default'))}
                  </p>
                </div>
                {isCustom ? (
                  <button className="btn btn-danger btn-sm" type="button" onClick={async () => onRemove(item)}>
                    {t('remove')}
                  </button>
                ) : (
                  <span className="badge badge-muted">{t('default')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function AdminCatalogPage() {
  const { t } = useLocalization();
  const [products, setProducts] = useState([]);
  const {
    categories,
    brands,
    customCategories,
    customBrands,
    catalogWarnings,
    addCategory,
    addBrand,
    removeCategory,
    removeBrand,
  } = useCatalogOptions();

  useEffect(() => {
    let ignore = false;
    const loadProducts = async () => {
      try {
        const rows = await listAdminProducts();
        if (!ignore) setProducts(rows);
      } catch {
        if (!ignore) setProducts([]);
      }
    };
    loadProducts();
    return () => {
      ignore = true;
    };
  }, []);

  const counts = useMemo(() => {
    const byCategory = new Map();
    const byBrand = new Map();
    for (const product of products) {
      const category = product.category || '';
      const brand = product.brand || '';
      if (category) byCategory.set(category, (byCategory.get(category) || 0) + 1);
      if (brand) byBrand.set(brand, (byBrand.get(brand) || 0) + 1);
    }
    return { byCategory, byBrand };
  }, [products]);

  const countByCategory = (category) => counts.byCategory.get(category) || 0;
  const countByBrand = (brand) => counts.byBrand.get(brand) || 0;

  return (
    <div className="admin-page animate-fadeIn">
      {catalogWarnings.length > 0 ? (
        <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          {catalogWarnings.join(' ')}
        </p>
      ) : null}
      <div className="catalog-manager-grid">
        <OptionManager
          title={t('categories')}
          description={t('categoriesDescription')}
          options={categories}
          customOptions={customCategories}
          countByOption={countByCategory}
          onAdd={addCategory}
          onRemove={removeCategory}
        />
        <OptionManager
          title={t('brands')}
          description={t('brandsDescription')}
          options={brands}
          customOptions={customBrands}
          countByOption={countByBrand}
          onAdd={addBrand}
          onRemove={removeBrand}
        />
      </div>
    </div>
  );
}

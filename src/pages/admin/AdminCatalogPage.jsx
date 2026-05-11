import { useState } from 'react';
import { products } from '../../data/products.js';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';

function OptionManager({
  title,
  description,
  inputLabel,
  placeholder,
  options,
  customOptions,
  countByOption,
  onAdd,
  onRemove,
}) {
  const { t } = useLocalization();
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const added = onAdd(value);
    setMessage(added ? t('added', value.trim()) : t('enterUniqueName'));
    if (added) setValue('');
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
            <label className="form-label" htmlFor={`${title}-name`}>{inputLabel}</label>
            <input
              id={`${title}-name`}
              className="input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
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
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => onRemove(item)}>
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
  const {
    categories,
    brands,
    customCategories,
    customBrands,
    addCategory,
    addBrand,
    removeCategory,
    removeBrand,
  } = useCatalogOptions();

  const countByCategory = (category) => products.filter((product) => product.category === category).length;
  const countByBrand = (brand) => products.filter((product) => product.brand === brand).length;

  return (
    <div className="admin-page animate-fadeIn">
      <div className="catalog-manager-grid">
        <OptionManager
          title={t('categories')}
          description={t('categoriesDescription')}
          inputLabel={t('newCategory')}
          placeholder={t('addCategory')}
          options={categories}
          customOptions={customCategories}
          countByOption={countByCategory}
          onAdd={addCategory}
          onRemove={removeCategory}
        />
        <OptionManager
          title={t('brands')}
          description={t('brandsDescription')}
          inputLabel={t('newBrand')}
          placeholder={t('addBrand')}
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

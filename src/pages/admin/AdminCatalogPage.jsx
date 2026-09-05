import { useEffect, useMemo, useState, useRef } from 'react';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { listAdminProducts } from '../../services/productsService.js';
import { uploadCategoryImage } from '../../services/storageService.js';

function CategoryRowItem({ item, catObj, isCustom, productCount, onRemove, onUpdateImage }) {
  const { t } = useLocalization();
  const fileInputRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !catObj?.id || !onUpdateImage) return;
    setIsUpdating(true);
    try {
      const url = await uploadCategoryImage(file);
      await onUpdateImage(catObj.id, url);
    } catch (err) {
      alert(err.message || 'Failed to update category image');
    } finally {
      setIsUpdating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="catalog-option-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {catObj && (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {catObj.image_url ? (
              <img src={catObj.image_url} alt={item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.25rem', opacity: 0.6 }}>📦</span>
            )}
          </div>
        )}
        <div>
          <p className="catalog-option-name" style={{ margin: 0, fontWeight: 600 }}>{item}</p>
          <p className="form-hint" style={{ margin: 0, fontSize: '0.75rem' }}>
            {t('productCountType', productCount, isCustom ? t('custom') : t('default'))}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {catObj && onUpdateImage && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg, image/png, image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isUpdating}
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              {isUpdating ? '...' : (catObj.image_url ? 'Change Image' : 'Add Image')}
            </button>
          </>
        )}
        {isCustom ? (
          <button className="btn btn-danger btn-sm" type="button" onClick={() => onRemove(item)}>
            {t('remove')}
          </button>
        ) : (
          <span className="badge badge-muted">{t('default')}</span>
        )}
      </div>
    </div>
  );
}

function OptionManager({
  title,
  description,
  options,
  customOptions,
  countByOption,
  onAdd,
  onRemove,
  allowImageUpload,
  categoryObjects,
  onUpdateCategoryImage,
}) {
  const { t } = useLocalization();
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsUploading(true);
    setMessage('');
    try {
      let imageUrl = null;
      if (allowImageUpload && imageFile) {
        imageUrl = await uploadCategoryImage(imageFile);
      }
      const added = await onAdd({ nameEn, nameAr, imageUrl });
      setMessage(added ? t('added', nameEn.trim()) : t('enterUniqueName'));
      if (added) {
        setNameEn('');
        setNameAr('');
        setImageFile(null);
      }
    } catch (error) {
      setMessage(error.message || t('enterUniqueName'));
    } finally {
      setIsUploading(false);
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
        <form className="catalog-add-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor={`${title}-name-en`}>English Name</label>
              <input
                id={`${title}-name-en`}
                className="input"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="English name"
                required
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
                required
              />
            </div>
          </div>
          {allowImageUpload && (
            <div className="form-group">
              <label className="form-label" htmlFor={`${title}-image`}>Category Cover Image</label>
              <input
                id={`${title}-image`}
                type="file"
                className="input"
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => setImageFile(e.target.files[0] || null)}
              />
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading & Adding...' : t('add')}
          </button>
        </form>
        {message && <p className="form-hint catalog-form-message">{message}</p>}

        <div className="catalog-option-list" aria-label={`${title} list`} style={{ marginTop: '1.25rem' }}>
          {options.filter((item) => item !== 'All').map((item) => {
            const isCustom = customOptions.includes(item);
            const catObj = categoryObjects?.find(
              (c) => c.name_en?.toLowerCase() === item.toLowerCase() || c.name_ar === item
            );

            return (
              <CategoryRowItem
                key={item}
                item={item}
                catObj={allowImageUpload ? catObj : null}
                isCustom={isCustom}
                productCount={countByOption(item)}
                onRemove={onRemove}
                onUpdateImage={allowImageUpload ? onUpdateCategoryImage : null}
              />
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
    updateCategoryImage,
    categoryObjects,
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
          allowImageUpload={true}
          categoryObjects={categoryObjects}
          onUpdateCategoryImage={updateCategoryImage}
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

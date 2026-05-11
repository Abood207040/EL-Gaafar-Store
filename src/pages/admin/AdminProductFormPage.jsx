// src/pages/admin/AdminProductFormPage.jsx
import { useState } from 'react';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { createAdminProduct, updateAdminProduct } from '../../services/productsService.js';

export default function AdminProductFormPage({ navigate, product }) {
  const { t } = useLocalization();
  const { categories, brands, addCategory, addBrand } = useCatalogOptions();
  const isEditMode = Boolean(product?.id);
  const [active, setActive] = useState(product?.active !== false);
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [form, setForm] = useState({
    nameEn: product?.nameEn || '',
    nameAr: product?.nameAr || '',
    descEn: product?.description || '',
    descAr: '',
    category: product?.category || '',
    brand: product?.brand || '',
    price: product?.price ?? '',
    stock: product?.stock ?? '',
    sku: product?.sku || '',
    size: product?.specs?.size || '',
    material: product?.specs?.material || '',
    usage: product?.specs?.usage || '',
    color: product?.specs?.color || '',
    pressureRating: product?.specs?.pressureRating || '',
    warranty: product?.specs?.warranty || '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const generateSKU = () => {
    const cat = form.category ? form.category.slice(0, 3).toUpperCase() : 'GEN';
    const rand = Math.floor(Math.random() * 900 + 100);
    setForm(f => ({ ...f, sku: `AJ-${cat}-${rand}` }));
  };

  const addCategoryFromForm = () => {
    if (addCategory(newCategory)) {
      setForm(f => ({ ...f, category: newCategory.trim().replace(/\s+/g, ' ') }));
      setNewCategory('');
    }
  };

  const addBrandFromForm = () => {
    if (addBrand(newBrand)) {
      setForm(f => ({ ...f, brand: newBrand.trim().replace(/\s+/g, ' ') }));
      setNewBrand('');
    }
  };

  const handleSave = async () => {
    setSaveError('');
    if (!form.nameEn.trim() || !form.nameAr.trim() || !form.category || !form.brand) {
      setSaveError(t('fillRequiredFields'));
      return;
    }
    setSaving(true);
    const payload = {
      nameEn: form.nameEn.trim(),
      nameAr: form.nameAr.trim(),
      category: form.category,
      brand: form.brand,
      price: form.price,
      stock: form.stock,
      sku: form.sku.trim(),
      description: form.descEn.trim() || form.descAr.trim(),
      specs: {
        size: form.size.trim(),
        material: form.material.trim(),
        usage: form.usage.trim(),
        color: form.color.trim(),
        pressureRating: form.pressureRating.trim(),
        warranty: form.warranty.trim(),
      },
      featured,
      active,
    };

    try {
      if (isEditMode) {
        await updateAdminProduct(product.id, payload);
      } else {
        await createAdminProduct(payload);
      }
      navigate('admin-products');
    } catch (error) {
      setSaveError(error.message || t('saveProductFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-form-layout">
        {/* Main Form */}
        <div className="admin-form-main">
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('productInformation')}</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name-en" className="form-label">{t('productNameEnglish')} <span aria-hidden="true">*</span></label>
                  <input id="name-en" className="input" placeholder="e.g. Brass Ball Valve 3/4&quot;" value={form.nameEn} onChange={set('nameEn')} required />
                </div>
                <div className="form-group">
                  <label htmlFor="name-ar" className="form-label">{t('productNameArabic')} <span aria-hidden="true">*</span></label>
                  <input id="name-ar" className="input" dir="rtl" placeholder='مثال: صمام كروي نحاسي 3/4"' value={form.nameAr} onChange={set('nameAr')} required />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="desc-en" className="form-label">{t('descriptionEnglish')}</label>
                <textarea id="desc-en" className="textarea" rows={3} placeholder="Product description in English..." value={form.descEn} onChange={set('descEn')} />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="desc-ar" className="form-label">{t('descriptionArabic')}</label>
                <textarea id="desc-ar" className="textarea" dir="rtl" rows={3} placeholder="وصف المنتج بالعربية..." value={form.descAr} onChange={set('descAr')} />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('classification')}</h2>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate('admin-catalog')}>
                {t('manageCategoriesBrands')}
              </button>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">{t('category')} <span aria-hidden="true">*</span></label>
                  <select id="category" className="select" value={form.category} onChange={set('category')} required>
                    <option value="">{t('selectCategory')}</option>
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="inline-add-row">
                    <input
                      className="input"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder={t('addCategory')}
                    />
                    <button className="btn btn-outline btn-sm" type="button" onClick={addCategoryFromForm}>
                      {t('add')}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="brand" className="form-label">{t('brand')} <span aria-hidden="true">*</span></label>
                  <select id="brand" className="select" value={form.brand} onChange={set('brand')} required>
                    <option value="">{t('selectBrand')}</option>
                    {brands.filter(b => b !== 'All').map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="inline-add-row">
                    <input
                      className="input"
                      value={newBrand}
                      onChange={e => setNewBrand(e.target.value)}
                      placeholder={t('addBrand')}
                    />
                    <button className="btn btn-outline btn-sm" type="button" onClick={addBrandFromForm}>
                      {t('add')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('pricingInventory')}</h2>
            </div>
            <div className="card-body">
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label htmlFor="price" className="form-label">{t('unitPriceSar')} <span aria-hidden="true">*</span></label>
                  <input id="price" className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={set('price')} required />
                </div>
                <div className="form-group">
                  <label htmlFor="stock" className="form-label">{t('inventoryCount')} <span aria-hidden="true">*</span></label>
                  <input id="stock" className="input" type="number" min="0" placeholder="0" value={form.stock} onChange={set('stock')} required />
                </div>
                <div className="form-group">
                  <label htmlFor="sku" className="form-label">SKU</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input id="sku" className="input" placeholder="AJ-VAL-001" value={form.sku} onChange={set('sku')} />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={generateSKU}
                      title="Auto-generate SKU"
                      style={{ flexShrink: 0 }}
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('technicalSpecs')}</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="size" className="form-label">{t('size')}</label>
                  <input id="size" className="input" placeholder='e.g. 3/4 inch, 25mm' value={form.size} onChange={set('size')} />
                </div>
                <div className="form-group">
                  <label htmlFor="material" className="form-label">{t('material')}</label>
                  <input id="material" className="input" placeholder="e.g. Brass, PVC, Stainless Steel" value={form.material} onChange={set('material')} />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="usage" className="form-label">{t('usage')}</label>
                  <input id="usage" className="input" placeholder="e.g. Water Shutoff, Shower" value={form.usage} onChange={set('usage')} />
                </div>
                <div className="form-group">
                  <label htmlFor="color" className="form-label">{t('color')}</label>
                  <input id="color" className="input" placeholder="e.g. Chrome, White, Bronze" value={form.color} onChange={set('color')} />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="pressure" className="form-label">{t('pressureRating')} <span className="form-hint-inline">({t('optional')})</span></label>
                  <input id="pressure" className="input" placeholder="e.g. 16 Bar" value={form.pressureRating} onChange={set('pressureRating')} />
                </div>
                <div className="form-group">
                  <label htmlFor="warranty" className="form-label">{t('warranty')} <span className="form-hint-inline">({t('optional')})</span></label>
                  <input id="warranty" className="input" placeholder="e.g. 2 Years" value={form.warranty} onChange={set('warranty')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="admin-form-sidebar">
          {/* Image Upload */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('productImage')}</h2>
            </div>
            <div className="card-body">
              <div className="image-upload-zone">
                <div className="image-upload-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <p>{t('uploadImage')}</p>
                <p className="form-hint">{t('uploadHint')}</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>
                  {t('browseFiles')}
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('productStatus')}</h2>
            </div>
            <div className="card-body">
              <div className="toggle-group">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('activeProduct')}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{t('visibleInShop')}</p>
                </div>
                <label className="toggle" aria-label="Active product toggle">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <hr className="divider" />
              <div className="toggle-group">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('featuredProduct')}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{t('highlightedInShop')}</p>
                </div>
                <label className="toggle" aria-label="Featured product toggle">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={e => setFeatured(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {saveError ? (
                <p style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>{saveError}</p>
              ) : null}
              <button
                className="btn btn-primary w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('saving') : (isEditMode ? t('updateProduct') : t('saveProduct'))}
              </button>
              <button
                className="btn btn-outline w-full"
                onClick={() => navigate('admin-products')}
              >
                {t('discardChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

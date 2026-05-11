// src/pages/admin/AdminProductFormPage.jsx
import { useEffect, useState } from 'react';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { createAdminProduct, updateAdminProduct } from '../../services/productsService.js';
import { uploadProductImage } from '../../services/storageService.js';

function mapUiFormToProductPayload(form, flags) {
  return {
    nameEn: form.nameEn.trim(),
    nameAr: form.nameAr.trim(),
    categoryId: form.categoryId || undefined,
    category: form.category,
    brand: form.brand,
    price: form.price,
    stock: form.stock,
    sku: form.sku.trim(),
    image: form.imageUrl.trim(),
    imageUrl: form.imageUrl.trim(),
    description: form.descEn.trim() || form.descAr.trim(),
    descriptionEn: form.descEn.trim(),
    descriptionAr: form.descAr.trim(),
    specs: {
      size: form.size.trim(),
      material: form.material.trim(),
      usage: form.usage.trim(),
      color: form.color.trim(),
      pressureRating: form.pressureRating.trim(),
      warranty: form.warranty.trim(),
    },
    featured: Boolean(flags.featured),
    active: flags.active !== false,
  };
}

export default function AdminProductFormPage({ navigate, product }) {
  const { t } = useLocalization();
  const { categories, brands, addCategory, addBrand } = useCatalogOptions();

  const isEditMode = Boolean(product?.id);
  const [active, setActive] = useState(product?.active !== false);
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const [newCategoryEn, setNewCategoryEn] = useState('');
  const [newCategoryAr, setNewCategoryAr] = useState('');
  const [newBrandEn, setNewBrandEn] = useState('');
  const [newBrandAr, setNewBrandAr] = useState('');

  const [form, setForm] = useState({
    nameEn: product?.nameEn || '',
    nameAr: product?.nameAr || '',
    descEn: product?.descriptionEn || product?.description || '',
    descAr: product?.descriptionAr || '',
    category: product?.category || '',
    categoryId: product?.categoryId || '',
    brand: product?.brand || '',
    price: product?.price ?? '',
    stock: product?.stock ?? '',
    sku: product?.sku || '',
    imageUrl: product?.image || '',
    size: product?.specs?.size || '',
    material: product?.specs?.material || '',
    usage: product?.specs?.usage || '',
    color: product?.specs?.color || '',
    pressureRating: product?.specs?.pressureRating || '',
    warranty: product?.specs?.warranty || '',
  });

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const generateSKU = () => {
    const cat = form.category ? form.category.slice(0, 3).toUpperCase() : 'GEN';
    const rand = Math.floor(Math.random() * 900 + 100);
    setForm((prev) => ({ ...prev, sku: `AJ-${cat}-${rand}` }));
  };

  const addCategoryFromForm = async () => {
    setSaveError('');
    try {
      const added = await addCategory({
        nameEn: newCategoryEn,
        nameAr: newCategoryAr,
      });
      if (added) {
        setForm((prev) => ({ ...prev, category: newCategoryEn.trim().replace(/\s+/g, ' ') }));
        setNewCategoryEn('');
        setNewCategoryAr('');
      }
    } catch (error) {
      setSaveError(error.message || t('saveProductFailed'));
    }
  };

  const addBrandFromForm = async () => {
    setSaveError('');
    try {
      const added = await addBrand({
        nameEn: newBrandEn,
        nameAr: newBrandAr,
      });
      if (added) {
        setForm((prev) => ({ ...prev, brand: newBrandEn.trim().replace(/\s+/g, ' ') }));
        setNewBrandEn('');
        setNewBrandAr('');
      }
    } catch (error) {
      setSaveError(error.message || t('saveProductFailed'));
    }
  };

  const onFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setImageUploadError('');
    setSaveError('');
    setImageFile(nextFile);
  };

  const handleSave = async () => {
    setSaveError('');
    setImageUploadError('');

    if (!form.nameEn.trim() || !form.nameAr.trim() || !form.category || !form.brand) {
      setSaveError(t('fillRequiredFields'));
      return;
    }

    setSaving(true);
    let uploadedInThisAttempt = false;
    try {
      let nextImageUrl = form.imageUrl;

      if (imageFile) {
        setUploadingImage(true);
        try {
          nextImageUrl = await uploadProductImage(imageFile);
          uploadedInThisAttempt = true;
          setForm((prev) => ({ ...prev, imageUrl: nextImageUrl }));
        } catch (uploadError) {
          setImageUploadError(uploadError.message || 'Image upload failed.');
          setSaveError(uploadError.message || 'Image upload failed.');
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = mapUiFormToProductPayload(
        { ...form, imageUrl: nextImageUrl },
        { featured, active }
      );

      if (isEditMode) {
        await updateAdminProduct(product.id, payload);
      } else {
        await createAdminProduct(payload);
      }
      navigate('admin-products');
    } catch (error) {
      if (uploadedInThisAttempt) {
        setSaveError(`Image uploaded, but product save failed: ${error.message || t('saveProductFailed')}`);
      } else {
        setSaveError(error.message || t('saveProductFailed'));
      }
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const previewSrc = imagePreviewUrl || form.imageUrl || '';

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-form-layout">
        <div className="admin-form-main">
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('productInformation')}</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name-en" className="form-label">{t('productNameEnglish')} <span aria-hidden="true">*</span></label>
                  <input id="name-en" className="input" placeholder='e.g. Brass Ball Valve 3/4"' value={form.nameEn} onChange={set('nameEn')} required />
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
                    {categories.filter((item) => item !== 'All').map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <div className="inline-add-row">
                    <input className="input" value={newCategoryEn} onChange={(event) => setNewCategoryEn(event.target.value)} placeholder="Category EN" />
                    <input className="input" value={newCategoryAr} onChange={(event) => setNewCategoryAr(event.target.value)} placeholder="التصنيف بالعربية" dir="rtl" />
                    <button className="btn btn-outline btn-sm" type="button" onClick={addCategoryFromForm}>{t('add')}</button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="brand" className="form-label">{t('brand')} <span aria-hidden="true">*</span></label>
                  <select id="brand" className="select" value={form.brand} onChange={set('brand')} required>
                    <option value="">{t('selectBrand')}</option>
                    {brands.filter((item) => item !== 'All').map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <div className="inline-add-row">
                    <input className="input" value={newBrandEn} onChange={(event) => setNewBrandEn(event.target.value)} placeholder="Brand EN" />
                    <input className="input" value={newBrandAr} onChange={(event) => setNewBrandAr(event.target.value)} placeholder="العلامة بالعربية" dir="rtl" />
                    <button className="btn btn-outline btn-sm" type="button" onClick={addBrandFromForm}>{t('add')}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    <button type="button" className="btn btn-outline btn-sm" onClick={generateSKU} style={{ flexShrink: 0 }}>
                      Auto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('technicalSpecs')}</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="size" className="form-label">{t('size')}</label>
                  <input id="size" className="input" placeholder="e.g. 3/4 inch, 25mm" value={form.size} onChange={set('size')} />
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

        <div className="admin-form-sidebar">
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('productImage')}</h2>
            </div>
            <div className="card-body">
              <div className="image-upload-zone">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Product preview"
                    style={{
                      width: '100%',
                      maxHeight: '180px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      marginBottom: '0.75rem',
                    }}
                  />
                ) : null}
                <p>{t('uploadImage')}</p>
                <p className="form-hint">JPG, PNG, or WEBP. Max 2MB.</p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="input"
                  onChange={onFileChange}
                  style={{ marginTop: '0.75rem' }}
                />
                {imageFile ? (
                  <p className="form-hint" style={{ marginTop: '0.5rem' }}>
                    Selected: {imageFile.name}
                  </p>
                ) : null}

                <input
                  className="input"
                  style={{ marginTop: '0.75rem' }}
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={set('imageUrl')}
                />
                {imageUploadError ? (
                  <p style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.8125rem' }}>
                    {imageUploadError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

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
                  <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
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
                  <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {saveError ? (
                <p style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>{saveError}</p>
              ) : null}
              <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving || uploadingImage}>
                {uploadingImage ? 'Uploading image...' : saving ? t('saving') : isEditMode ? t('updateProduct') : t('saveProduct')}
              </button>
              <button className="btn btn-outline w-full" onClick={() => navigate('admin-products')} disabled={saving || uploadingImage}>
                {t('discardChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

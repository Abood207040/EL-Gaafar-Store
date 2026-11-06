// src/pages/admin/AdminProductFormPage.jsx
import { useEffect, useState } from 'react';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { createAdminProduct, updateAdminProduct, adjustProductStock, getAdminProductById } from '../../services/productsService.js';
import { uploadProductImage } from '../../services/storageService.js';
import { useParams } from 'react-router-dom';

function mapUiFormToProductPayload(form, flags, technicalSpecs = []) {
  const dynamicSpecsFormatted = technicalSpecs
    .filter((s) => (s.nameEn?.trim() || s.nameAr?.trim()) && (s.valueEn?.trim() || s.valueAr?.trim()))
    .map((s) => ({
      name_en: (s.nameEn || s.nameAr || '').trim(),
      name_ar: (s.nameAr || s.nameEn || '').trim(),
      value_en: (s.valueEn || s.valueAr || '').trim(),
      value_ar: (s.valueAr || s.valueEn || '').trim(),
    }));

  const findSpecVal = (enKeyword, arKeyword) => {
    const item = technicalSpecs.find(
      (s) =>
        s.nameEn?.toLowerCase().includes(enKeyword.toLowerCase()) ||
        s.nameAr?.includes(arKeyword)
    );
    return item ? (item.valueEn || item.valueAr || '').trim() : '';
  };

  return {
    nameEn: form.nameEn.trim(),
    nameAr: form.nameAr.trim(),
    categoryId: form.categoryId || undefined,
    category: form.category,
    brand: form.brand,
    price: form.price,
    cost: form.cost,
    barcode: form.barcode,
    lowStockThreshold: form.lowStockThreshold,
    stock: form.stock,
    sku: form.sku.trim(),
    image: form.imageUrl.trim(),
    imageUrl: form.imageUrl.trim(),
    description: form.descEn.trim() || form.descAr.trim(),
    descriptionEn: form.descEn.trim(),
    descriptionAr: form.descAr.trim(),
    specs: {
      size: findSpecVal('size', 'مقاس') || form.size?.trim() || '',
      material: findSpecVal('material', 'خام') || form.material?.trim() || '',
      usage: findSpecVal('usage', 'استخدام') || form.usage?.trim() || '',
      color: findSpecVal('color', 'لون') || form.color?.trim() || '',
      pressureRating: findSpecVal('pressure', 'ضغط') || form.pressureRating?.trim() || '',
      warranty: findSpecVal('warranty', 'ضمان') || form.warranty?.trim() || '',
    },
    technicalSpecs: dynamicSpecsFormatted,
    featured: Boolean(flags.featured),
    active: flags.active !== false,
    availableOnline: flags.availableOnline !== false,
    availableOffline: flags.availableOffline !== false,
    isDeliveryAvailable: Boolean(flags.isDeliveryAvailable),
    isPickupAvailable: flags.isPickupAvailable !== false,
    deliveryClass: flags.isDeliveryAvailable ? (flags.deliveryClass || 'medium') : null,
  };
}

export default function AdminProductFormPage({ navigate, product: propProduct }) {
  const { id } = useParams();
  const { t, isArabic, parseRpcError } = useLocalization();
  const [product, setProduct] = useState(propProduct || null);
  const { categories, brands, addCategory, addBrand } = useCatalogOptions();

  const productId = id || propProduct?.id;

  useEffect(() => {
    if (productId && !propProduct) {
      let ignore = false;
      const fetchProduct = async () => {
        try {
          const data = await getAdminProductById(productId);
          if (!ignore) setProduct(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchProduct();
      return () => { ignore = true; };
    }
  }, [productId, propProduct]);

  const isEditMode = Boolean(product?.id);
  const [active, setActive] = useState(product?.active !== false);
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [availableOnline, setAvailableOnline] = useState(product?.availableOnline !== false);
  const [availableOffline, setAvailableOffline] = useState(product?.availableOffline !== false);
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(Boolean(product?.isDeliveryAvailable));
  const [isPickupAvailable, setIsPickupAvailable] = useState(product ? product.isPickupAvailable !== false : true);
  const [deliveryClass, setDeliveryClass] = useState(product?.deliveryClass || 'medium');
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

  const [technicalSpecs, setTechnicalSpecs] = useState([]);

  const addSpecRow = (preset) => {
    const newRow = preset
      ? { id: `spec-${Date.now()}-${Math.random()}`, nameEn: preset.nameEn, nameAr: preset.nameAr, valueEn: '', valueAr: '' }
      : { id: `spec-${Date.now()}-${Math.random()}`, nameEn: '', nameAr: '', valueEn: '', valueAr: '' };
    setTechnicalSpecs((prev) => [...prev, newRow]);
  };

  const updateSpecRow = (id, field, value) => {
    setTechnicalSpecs((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeSpecRow = (id) => {
    setTechnicalSpecs((prev) => prev.filter((row) => row.id !== id));
  };

  const moveSpecRow = (index, direction) => {
    setTechnicalSpecs((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Stock Adjustment Modal State
  const [showStockModal, setShowStockModal] = useState(false);
  const [adjType, setAdjType] = useState('restock');
  const [adjQty, setAdjQty] = useState('');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjError, setAdjError] = useState('');

  const [form, setForm] = useState({
    nameEn: product?.nameEn || '',
    nameAr: product?.nameAr || '',
    descEn: product?.descriptionEn || product?.description || '',
    descAr: product?.descriptionAr || '',
    category: product?.category || '',
    categoryId: product?.categoryId || '',
    brand: product?.brand || '',
    price: product?.price ?? '',
    cost: product?.cost ?? '',
    barcode: product?.barcode || '',
    lowStockThreshold: product?.lowStockThreshold ?? 5,
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

  useEffect(() => {
    if (product) {
       
      setActive(product.active !== false);
      setFeatured(Boolean(product.featured));
      setAvailableOnline(product.availableOnline !== false);
      setAvailableOffline(product.availableOffline !== false);
      setIsDeliveryAvailable(Boolean(product.isDeliveryAvailable));
      setIsPickupAvailable(product.isPickupAvailable !== false);
      setDeliveryClass(product.deliveryClass || 'medium');
      setForm({
        nameEn: product.nameEn || '',
        nameAr: product.nameAr || '',
        descEn: product.descriptionEn || product.description || '',
        descAr: product.descriptionAr || '',
        category: product.category || '',
        categoryId: product.categoryId || '',
        brand: product.brand || '',
        price: product.price ?? '',
        cost: product.cost ?? '',
        barcode: product.barcode || '',
        lowStockThreshold: product.lowStockThreshold ?? 5,
        stock: product.stock ?? '',
        sku: product.sku || '',
        imageUrl: product.image || '',
        size: product.specs?.size || '',
        material: product.specs?.material || '',
        usage: product.specs?.usage || '',
        color: product.specs?.color || '',
        pressureRating: product.specs?.pressureRating || '',
        warranty: product.specs?.warranty || '',
      });

      if (Array.isArray(product.technicalSpecs) && product.technicalSpecs.length > 0) {
        setTechnicalSpecs(
          product.technicalSpecs.map((s, idx) => ({
            id: `spec-${idx}-${Date.now()}`,
            nameEn: s.name_en || s.nameEn || '',
            nameAr: s.name_ar || s.nameAr || '',
            valueEn: s.value_en || s.valueEn || '',
            valueAr: s.value_ar || s.valueAr || '',
          }))
        );
      } else {
        const legacy = [];
        if (product.specs?.size) legacy.push({ id: 's1', nameEn: 'Size', nameAr: 'المقاس', valueEn: product.specs.size, valueAr: product.specs.size });
        if (product.specs?.material) legacy.push({ id: 's2', nameEn: 'Material', nameAr: 'الخامة', valueEn: product.specs.material, valueAr: product.specs.material });
        if (product.specs?.usage) legacy.push({ id: 's3', nameEn: 'Usage', nameAr: 'الاستخدام', valueEn: product.specs.usage, valueAr: product.specs.usage });
        if (product.specs?.color) legacy.push({ id: 's4', nameEn: 'Color', nameAr: 'اللون', valueEn: product.specs.color, valueAr: product.specs.color });
        if (product.specs?.pressureRating) legacy.push({ id: 's5', nameEn: 'Pressure Rating', nameAr: 'ضغط التشغيل', valueEn: product.specs.pressureRating, valueAr: product.specs.pressureRating });
        if (product.specs?.warranty) legacy.push({ id: 's6', nameEn: 'Warranty', nameAr: 'فترة الضمان', valueEn: product.specs.warranty, valueAr: product.specs.warranty });
        setTechnicalSpecs(legacy);
      }
    }
  }, [product]);

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

  const generateBarcode = () => {
    const num = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setForm((prev) => ({ ...prev, barcode: num }));
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

    if (isDeliveryAvailable && !deliveryClass) {
      setSaveError(isArabic ? 'يرجى اختيار فئة التوصيل للمنتج طالما أن التوصيل متاح.' : 'Please select a delivery class since delivery is enabled.');
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
        { featured, active, availableOnline, availableOffline, isDeliveryAvailable, isPickupAvailable, deliveryClass },
        technicalSpecs
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

  const handleAdjustStock = async () => {
    setAdjError('');
    if (!adjQty) return;
    
    let change = Number(adjQty);
    if (adjType === 'damage' || adjType === 'loss') {
      if (change > 0) change = -change; // force negative
    } else if (adjType === 'restock') {
      if (change < 0) change = -change; // force positive
    }

    if (change === 0) {
      setAdjError('Quantity change cannot be zero.');
      return;
    }

    setAdjSaving(true);
    try {
      const newStock = await adjustProductStock(product.id, change, adjType, adjNotes);
      setForm(prev => ({ ...prev, stock: newStock }));
      setShowStockModal(false);
      setAdjQty('');
      setAdjNotes('');
    } catch (err) {
      setAdjError(parseRpcError(err));
    } finally {
      setAdjSaving(false);
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
                  <label htmlFor="cost" className="form-label">{t('cost')} <span className="form-hint-inline">({t('optional')})</span></label>
                  <input id="cost" className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={set('cost')} />
                </div>
                <div className="form-group">
                  <label htmlFor="stock" className="form-label">{t('inventoryCount')} <span aria-hidden="true">*</span></label>
                  {isEditMode ? (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', height: '42px' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{form.stock}</span>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowStockModal(true)}>
                        {t('adjustStock')}
                      </button>
                    </div>
                  ) : (
                    <input id="stock" className="input" type="number" min="0" placeholder="0" value={form.stock} onChange={set('stock')} required />
                  )}
                </div>
              </div>
              <div className="form-row form-row-3" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="sku" className="form-label">{t('sku') || 'SKU'}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input id="sku" className="input" placeholder="AJ-VAL-001" value={form.sku} onChange={set('sku')} />
                    <button type="button" className="btn btn-outline btn-sm" onClick={generateSKU} style={{ flexShrink: 0 }}>
                      {t('auto')}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="barcode" className="form-label">{t('barcode')} <span className="form-hint-inline">({t('optional')})</span></label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input id="barcode" className="input" placeholder={t('scanOrEnterBarcode')} value={form.barcode} onChange={set('barcode')} />
                    <button type="button" className="btn btn-outline btn-sm" onClick={generateBarcode} style={{ flexShrink: 0 }}>
                      {t('generate')}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="lowStockThreshold" className="form-label">{t('lowStockThreshold')}</label>
                  <input id="lowStockThreshold" className="input" type="number" min="0" placeholder="5" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} required />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('technicalSpecs') || (isArabic ? 'المواصفات الفنية الديناميكية' : 'Dynamic Technical Specifications')}</h2>
                <p className="form-hint" style={{ margin: '0.25rem 0 0 0' }}>
                  {isArabic
                    ? 'أضف أي عدد من المواصفات الفنية باللغتين العربية والإنجليزية لتظهر بتنسيق منظم في متجر العميل.'
                    : 'Add custom technical specifications in English & Arabic. Will render automatically on product page.'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => addSpecRow()}
              >
                + {isArabic ? 'إضافة مواصفة يدوية' : 'Add Custom Spec'}
              </button>
            </div>
            <div className="card-body">
              {/* Quick Template Presets */}
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>
                  {isArabic ? '⚡ قوالب جاهزة سريعة للأدوات الصحية:' : '⚡ Quick Templates for Sanitary Ware:'}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[
                    { nameEn: 'Size', nameAr: 'المقاس' },
                    { nameEn: 'Material', nameAr: 'الخامة' },
                    { nameEn: 'Color / Finish', nameAr: 'اللون / التشطيب' },
                    { nameEn: 'Usage / Application', nameAr: 'الاستخدام' },
                    { nameEn: 'Pressure Rating', nameAr: 'ضغط التشغيل' },
                    { nameEn: 'Warranty', nameAr: 'فترة الضمان' },
                    { nameEn: 'Country of Origin', nameAr: 'بلد المنشأ' },
                    { nameEn: 'Installation Type', nameAr: 'نوع التثبيت' },
                  ].map((preset) => (
                    <button
                      key={preset.nameEn}
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => addSpecRow(preset)}
                    >
                      + {isArabic ? preset.nameAr : preset.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {technicalSpecs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', border: '1px dashed var(--line)', borderRadius: '8px' }}>
                  <p style={{ margin: 0 }}>
                    {isArabic
                      ? 'لا توجد مواصفات فنية مضافة لهذا المنتج بعد. اختر من القوالب أعلاه أو اضغط إضافة مواصفة.'
                      : 'No technical specifications added yet. Choose from quick templates above or click Add Custom Spec.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {technicalSpecs.map((row, index) => (
                    <div
                      key={row.id}
                      style={{
                        padding: '0.85rem',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>
                          {isArabic ? 'اسم المواصفة (EN)' : 'Spec Name (EN)'}
                        </label>
                        <input
                          className="input"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                          placeholder="e.g. Size, Material"
                          value={row.nameEn}
                          onChange={(e) => updateSpecRow(row.id, 'nameEn', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>
                          {isArabic ? 'اسم المواصفة (AR)' : 'Spec Name (AR)'}
                        </label>
                        <input
                          className="input"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                          placeholder="مثال: المقاس، الخامة"
                          value={row.nameAr}
                          onChange={(e) => updateSpecRow(row.id, 'nameAr', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>
                          {isArabic ? 'القيمة (EN)' : 'Value (EN)'}
                        </label>
                        <input
                          className="input"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                          placeholder="e.g. 3/4 inch, Brass"
                          value={row.valueEn}
                          onChange={(e) => updateSpecRow(row.id, 'valueEn', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>
                          {isArabic ? 'القيمة (AR)' : 'Value (AR)'}
                        </label>
                        <input
                          className="input"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                          placeholder="مثال: 3/4 بوصة، نحاس"
                          value={row.valueAr}
                          onChange={(e) => updateSpecRow(row.id, 'valueAr', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', paddingTop: '1rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.5rem', lineHeight: 1 }}
                          disabled={index === 0}
                          onClick={() => moveSpecRow(index, -1)}
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.5rem', lineHeight: 1 }}
                          disabled={index === technicalSpecs.length - 1}
                          onClick={() => moveSpecRow(index, 1)}
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => removeSpecRow(row.id)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DELIVERY & FULFILLMENT SECTION */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🚚</span>
                <span>{isArabic ? 'التوصيل والاستلام' : 'DELIVERY & FULFILLMENT'}</span>
              </h2>
            </div>
            <div className="card-body">
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{t('deliveryAvailable') || (isArabic ? 'التوصيل متاح' : 'Delivery Available')}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>
                        {isDeliveryAvailable ? (isArabic ? 'متاح للشحن والتوصيل للعملاء' : 'Eligible for customer delivery') : (isArabic ? 'غير متاح للتوصيل' : 'Delivery disabled')}
                      </p>
                    </div>
                    <label className="toggle" aria-label="Delivery Available toggle">
                      <input type="checkbox" checked={isDeliveryAvailable} onChange={(e) => setIsDeliveryAvailable(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{t('pickupAvailable') || (isArabic ? 'الاستلام من المعرض متاح' : 'Pickup Available')}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>
                        {isPickupAvailable ? (isArabic ? 'متاح للاستلام المباشر' : 'Showroom pickup enabled') : (isArabic ? 'غير متاح للاستلام' : 'Pickup disabled')}
                      </p>
                    </div>
                    <label className="toggle" aria-label="Pickup Available toggle">
                      <input type="checkbox" checked={isPickupAvailable} onChange={(e) => setIsPickupAvailable(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label htmlFor="deliveryClass" className="form-label">
                  {t('deliveryClass') || (isArabic ? 'فئة التوصيل' : 'Delivery Class')} {isDeliveryAvailable && <span aria-hidden="true" style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                <select
                  id="deliveryClass"
                  className="input"
                  value={deliveryClass}
                  onChange={(e) => setDeliveryClass(e.target.value)}
                  disabled={!isDeliveryAvailable}
                  style={!isDeliveryAvailable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  required={isDeliveryAvailable}
                >
                  <option value="small">{isArabic ? 'صغير (Small) - حنفيات وقطع صغيرة' : 'Small (Rank 1 - Faucets, small fittings, accessories)'}</option>
                  <option value="medium">{isArabic ? 'متوسط (Medium) - خلاطات ومستلزمات قياسية' : 'Medium (Rank 2 - Mixers, standard fixtures)'}</option>
                  <option value="large">{isArabic ? 'كبير (Large) - أحواض وسخانات ومواسير طويلة' : 'Large (Rank 3 - Sinks, water heaters, long pipes)'}</option>
                  <option value="oversized">{isArabic ? 'ضخم (Oversized) - أطقم حمامات وسيراميك ثقيل' : 'Oversized (Rank 4 - Ceramic toilet suites, bathtubs)'}</option>
                  <option value="special">{isArabic ? 'خاص (Special) - يتطلب عرض سعر يدوي' : 'Special (Rank 5 - Requires Manual Quote)'}</option>
                </select>
                <p className="form-hint" style={{ marginTop: '0.45rem' }}>
                  {isArabic
                    ? 'تُستخدم لتحديد رسوم التوصيل بناءً على منطقة العميل. لا يحتوي المنتج على سعر توصيل ثابت بل تُدار الأسعار من إدارة التوصيل.'
                    : 'Used to determine the delivery fee based on the customer\'s area. The product only has a delivery class, not a hardcoded fee.'}
                </p>
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
              <hr className="divider" />
              <div className="toggle-group">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('availableOnline')}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{t('availableOnlineDesc')}</p>
                </div>
                <label className="toggle" aria-label="Available Online toggle">
                  <input type="checkbox" checked={availableOnline} onChange={(event) => setAvailableOnline(event.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <hr className="divider" />
              <div className="toggle-group">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('availableOffline')}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{t('availableOfflineDesc')}</p>
                </div>
                <label className="toggle" aria-label="Available Offline toggle">
                  <input type="checkbox" checked={availableOffline} onChange={(event) => setAvailableOffline(event.target.checked)} />
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
                {uploadingImage ? t('uploadingImage') : saving ? t('saving') : isEditMode ? t('updateProduct') : t('saveProduct')}
              </button>
              <button className="btn btn-outline w-full" onClick={() => navigate('admin-products')} disabled={saving || uploadingImage}>
                {t('discardChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showStockModal && (
        <div className="modal-overlay" onClick={() => !adjSaving && setShowStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{t('adjustStock')}</h3>
              <button className="btn-close" onClick={() => !adjSaving && setShowStockModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">{t('currentStock')}: <span style={{ fontWeight: 600 }}>{form.stock}</span></label>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">{t('transactionType')}</label>
                <select className="select" value={adjType} onChange={(e) => setAdjType(e.target.value)}>
                  <option value="restock">{t('restockType')}</option>
                  <option value="damage">{t('damageType')}</option>
                  <option value="loss">{t('lossType')}</option>
                  <option value="manual_adjustment">{t('manualAdjustmentType')}</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">{t('quantity')}</label>
                <input 
                  type="number" 
                  className="input" 
                  placeholder={adjType === 'restock' ? '+50' : adjType === 'damage' || adjType === 'loss' ? '-5' : '10 or -10'} 
                  value={adjQty} 
                  onChange={(e) => setAdjQty(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">{t('notes')}</label>
                <input type="text" className="input" placeholder={t('adjustmentReason')} value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} />
              </div>
              {adjError && <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{adjError}</p>}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowStockModal(false)} disabled={adjSaving}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleAdjustStock} disabled={adjSaving || !adjQty}>
                {adjSaving ? t('processing') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

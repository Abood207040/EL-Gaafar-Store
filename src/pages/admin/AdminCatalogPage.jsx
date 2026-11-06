import { useEffect, useMemo, useState, useRef } from 'react';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { listAdminProducts } from '../../services/productsService.js';
import { uploadCategoryImage } from '../../services/storageService.js';

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ item, type, onSave, onClose }) {
  const { t } = useLocalization();
  const [nameEn, setNameEn] = useState(item.nameEn);
  const [nameAr, setNameAr] = useState(item.nameAr);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      setErr(t('fillRequiredFields'));
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onSave(item.id, { nameEn: nameEn.trim(), nameAr: nameAr.trim() });
      onClose();
    } catch (error) {
      setErr(error.message || t('ERR_UNKNOWN'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fadeIn" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem' }}>
            {type === 'category' ? t('editCategory') : t('editBrand')}: <em>{item.nameEn}</em>
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">{t('productNameEnglish')} *</label>
              <input
                className="input"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="English name"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('productNameArabic')} *</label>
              <input
                className="input"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="الاسم العربي"
                dir="rtl"
                required
              />
            </div>
            {err && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{err}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '0 1.25rem 1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('saving') : t('confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function DeleteModal({ item, type, productCount, onConfirm, onClose }) {
  const { t } = useLocalization();
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  const handleConfirm = async () => {
    setDeleting(true);
    setErr('');
    try {
      await onConfirm(item.nameEn);
      onClose();
    } catch (error) {
      setErr(error.message || t('ERR_UNKNOWN'));
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fadeIn" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', color: 'var(--danger)' }}>🗑️ {t('delete')} {type === 'category' ? t('category') : t('brand')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            {t('confirmDeleteProduct', item.nameEn)}
          </p>
          {productCount > 0 && (
            <div style={{ padding: '0.85rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#991B1B' }}>
              ⚠️ {t('deleteWarningProducts', productCount)}
            </div>
          )}
          {err && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>{t('cancel')}</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirm}
              disabled={deleting}
            >
              {deleting ? t('processing') : t('delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row Item ──────────────────────────────────────────────────────────────────
function CatalogRowItem({ item, catObj, isCategory, productCount, onEdit, onRemove, onUpdateImage }) {
  const { t } = useLocalization();
  const fileInputRef = useRef(null);
  const [isUpdatingImg, setIsUpdatingImg] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !catObj?.id || !onUpdateImage) return;
    setIsUpdatingImg(true);
    try {
      const url = await uploadCategoryImage(file);
      await onUpdateImage(catObj.id, url);
    } catch (err) {
      alert(err.message || 'Failed to update image');
    } finally {
      setIsUpdatingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="catalog-option-row"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 1rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        {catObj && (
          <div style={{
            width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden',
            backgroundColor: '#f1f5f9', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {catObj.image_url
              ? <img src={catObj.image_url} alt={item.nameEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '1.25rem', opacity: 0.6 }}>📦</span>
            }
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.925rem' }}>{item.nameEn}</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', direction: 'rtl', textAlign: 'start' }}>{item.nameAr}</p>
          <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--muted-light)' }}>
            {t('productCountType', productCount, isCategory ? t('categories') : t('brands'))}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Image upload for categories */}
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
              className="btn btn-ghost btn-sm"
              disabled={isUpdatingImg}
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.75rem' }}
              title={catObj.image_url ? t('uploadImage') : t('uploadImage')}
            >
              🖼️
            </button>
          </>
        )}

        {/* Edit button */}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onEdit(item)}
        >
          {t('edit')}
        </button>

        {/* Delete button */}
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => onRemove(item)}
        >
          {t('delete')}
        </button>
      </div>
    </div>
  );
}

// ── Add Form ──────────────────────────────────────────────────────────────────
function AddForm({ title, allowImageUpload, onAdd }) {
  const { t } = useLocalization();
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [messageType, setMessageType] = useState('muted');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage('');
    try {
      let imageUrl = null;
      if (allowImageUpload && imageFile) {
        imageUrl = await uploadCategoryImage(imageFile);
      }
      const added = await onAdd({ nameEn, nameAr, imageUrl });
      if (added) {
        setMessage(t('added', nameEn.trim()));
        setMessageType('success');
        setNameEn('');
        setNameAr('');
        setImageFile(null);
      } else {
        setMessage(t('enterUniqueName'));
        setMessageType('warning');
      }
    } catch (error) {
      setMessage(error.message || t('ERR_UNKNOWN'));
      setMessageType('danger');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        + {t('add')} {title}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor={`${title}-en`}>{t('productNameEnglish')}</label>
          <input
            id={`${title}-en`}
            className="input"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="English name"
            required
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor={`${title}-ar`}>{t('productNameArabic')}</label>
          <input
            id={`${title}-ar`}
            className="input"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="الاسم العربي"
            dir="rtl"
            required
          />
        </div>
      </div>
      {allowImageUpload && (
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor={`${title}-img`}>{t('productImage')} ({t('optional')})</label>
          <input
            id={`${title}-img`}
            type="file"
            className="input"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => setImageFile(e.target.files[0] || null)}
          />
        </div>
      )}
      <button className="btn btn-primary btn-sm" type="submit" disabled={isUploading}>
        {isUploading ? t('saving') : `+ ${t('add')}`}
      </button>
      {message && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: `var(--${messageType})` }}>{message}</p>
      )}
    </form>
  );
}

// ── Manager Panel ─────────────────────────────────────────────────────────────
function OptionManager({ title, description, items, isCategory, countByOption, onAdd, onEdit, onRemove, onUpdateImage, allowImageUpload }) {
  const { t } = useLocalization();

  return (
    <section className="card catalog-manager-card">
      <div className="card-header">
        <div>
          <h2 style={{ fontSize: '1rem' }}>{title}</h2>
          <p className="section-subtitle">{description}</p>
        </div>
        <span className="badge badge-muted">{t('totalLabel', items.length)}</span>
      </div>

      <AddForm title={title} allowImageUpload={allowImageUpload} onAdd={onAdd} />

      <div className="catalog-option-list" style={{ maxHeight: '480px', overflowY: 'auto' }}>
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>{t('noItemsFound')}</p>
        ) : (
          items.map((item) => (
            <CatalogRowItem
              key={item.id}
              item={item}
              catObj={isCategory ? item : null}
              isCategory={isCategory}
              productCount={countByOption(item.nameEn)}
              onEdit={onEdit}
              onRemove={onRemove}
              onUpdateImage={allowImageUpload ? onUpdateImage : null}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminCatalogPage() {
  const { t } = useLocalization();
  const [products, setProducts] = useState([]);

  const {
    catalogWarnings,
    addCategory, addBrand,
    removeCategory, removeBrand,
    updateCategoryImage, updateCategory, updateBrand,
    categoryObjects, brandObjects,
  } = useCatalogOptions();

  // Modal state
  const [editModal, setEditModal] = useState(null);   // { item, type }
  const [deleteModal, setDeleteModal] = useState(null); // { item, type, count }

  useEffect(() => {
    let ignore = false;
    listAdminProducts()
      .then((rows) => { if (!ignore) setProducts(rows); })
      .catch(() => { if (!ignore) setProducts([]); });
    return () => { ignore = true; };
  }, []);

  const counts = useMemo(() => {
    const byCategory = new Map();
    const byBrand = new Map();
    for (const p of products) {
      if (p.category) byCategory.set(p.category, (byCategory.get(p.category) || 0) + 1);
      if (p.brand) byBrand.set(p.brand, (byBrand.get(p.brand) || 0) + 1);
    }
    return { byCategory, byBrand };
  }, [products]);

  const countByCategory = (nameEn) => counts.byCategory.get(nameEn) || 0;
  const countByBrand = (nameEn) => counts.byBrand.get(nameEn) || 0;

  // Build normalized item objects
  const categoryItems = categoryObjects.map((row) => ({
    id: row.id,
    nameEn: row.name_en || '',
    nameAr: row.name_ar || '',
    image_url: row.image_url,
    slug: row.slug,
  }));

  const brandItems = brandObjects.map((row) => ({
    id: row.id,
    nameEn: row.name_en || '',
    nameAr: row.name_ar || '',
    slug: row.slug,
  }));

  // Handlers
  const handleEditCategory = (item) => setEditModal({ item, type: 'category' });
  const handleEditBrand = (item) => setEditModal({ item, type: 'brand' });

  const handleDeleteCategory = (item) =>
    setDeleteModal({ item, type: 'category', count: countByCategory(item.nameEn) });
  const handleDeleteBrand = (item) =>
    setDeleteModal({ item, type: 'brand', count: countByBrand(item.nameEn) });

  const handleConfirmDelete = async (nameEn) => {
    if (deleteModal.type === 'category') {
      await removeCategory(nameEn);
    } else {
      await removeBrand(nameEn);
    }
  };

  const handleSaveEdit = async (id, updates) => {
    if (editModal.type === 'category') {
      await updateCategory(id, updates);
    } else {
      await updateBrand(id, updates);
    }
  };

  return (
    <div className="admin-page animate-fadeIn">
      {catalogWarnings.length > 0 && (
        <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          {catalogWarnings.join(' ')}
        </p>
      )}

      <div className="catalog-manager-grid">
        <OptionManager
          title={t('categories')}
          description={t('categoriesDescription')}
          items={categoryItems}
          isCategory={true}
          countByOption={countByCategory}
          onAdd={addCategory}
          onEdit={handleEditCategory}
          onRemove={handleDeleteCategory}
          onUpdateImage={updateCategoryImage}
          allowImageUpload={true}
        />
        <OptionManager
          title={t('brands')}
          description={t('brandsDescription')}
          items={brandItems}
          isCategory={false}
          countByOption={countByBrand}
          onAdd={addBrand}
          onEdit={handleEditBrand}
          onRemove={handleDeleteBrand}
          allowImageUpload={false}
        />
      </div>

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          item={editModal.item}
          type={editModal.type}
          onSave={handleSaveEdit}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <DeleteModal
          item={deleteModal.item}
          type={deleteModal.type}
          productCount={deleteModal.count}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}

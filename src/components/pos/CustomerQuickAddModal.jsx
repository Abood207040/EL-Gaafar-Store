import { useState } from 'react';
import { createCustomer } from '../../services/adminCustomersService.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function CustomerQuickAddModal({ onClose, onCustomerCreated }) {
  const { t, isArabic } = useLocalization();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    area: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name) {
      setError(t('fullNameRequired') || (isArabic ? 'الاسم الكامل مطلوب' : 'Name is required'));
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const newCustomer = await createCustomer(formData);
      onCustomerCreated({
        id: newCustomer.id,
        full_name: newCustomer.full_name,
        phone: newCustomer.phone
      });
      onClose();
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>{t('newCustomer')}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('customerName')} *</label>
              <input 
                type="text" 
                className="input" 
                value={formData.full_name} 
                onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input 
                type="text" 
                className="input" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isArabic ? 'المدينة / المحافظة' : 'City'}</label>
              <input 
                type="text" 
                className="input" 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isArabic ? 'المنطقة / الحي' : 'Area'}</label>
              <input 
                type="text" 
                className="input" 
                value={formData.area} 
                onChange={e => setFormData({ ...formData, area: e.target.value })} 
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={processing} style={{ marginTop: '0.5rem' }}>
              {processing ? (t('savingCustomer') || 'Saving...') : (t('saveCustomer') || 'Save Customer')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

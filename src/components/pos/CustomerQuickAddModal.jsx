import { useState } from 'react';
import { createCustomer } from '../../services/adminCustomersService.js';

export default function CustomerQuickAddModal({ onClose, onCustomerCreated }) {
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
      setError('Name is required');
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
      setError(err.message || 'Failed to create customer');
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>New Customer</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                className="input" 
                value={formData.full_name} 
                onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="text" 
                className="input" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                type="text" 
                className="input" 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Area</label>
              <input 
                type="text" 
                className="input" 
                value={formData.area} 
                onChange={e => setFormData({ ...formData, area: e.target.value })} 
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={processing} style={{ marginTop: '0.5rem' }}>
              {processing ? 'Saving...' : 'Save Customer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

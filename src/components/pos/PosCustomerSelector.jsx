import { useState, useEffect } from 'react';
import { usePos } from './PosContext.jsx';
import { getAdminCustomers } from '../../services/adminCustomersService.js';
import CustomerQuickAddModal from './CustomerQuickAddModal.jsx';

export default function PosCustomerSelector() {
  const { customer, setCustomer } = usePos();
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    let ignore = false;
    const loadCustomers = async () => {
      try {
        const data = await getAdminCustomers();
        if (!ignore) setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };
    loadCustomers();
    return () => { ignore = true; };
  }, []);

  const handleSelect = (e) => {
    const id = e.target.value;
    if (!id) {
      setCustomer(null);
      return;
    }
    const selected = customers.find(c => c.id === id);
    if (selected) {
      setCustomer({ id: selected.id, full_name: selected.name, phone: selected.phone });
    }
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [{ id: newCustomer.id, name: newCustomer.full_name, phone: newCustomer.phone }, ...prev]);
    setCustomer(newCustomer);
  };

  return (
    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <select 
        className="input" 
        style={{ flex: 1, padding: '0.4rem', fontSize: '0.875rem' }} 
        value={customer?.id || ''} 
        onChange={handleSelect}
      >
        <option value="">Walk-in Customer</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
        ))}
      </select>
      <button 
        className="btn btn-outline btn-sm" 
        style={{ whiteSpace: 'nowrap' }} 
        onClick={() => setShowAddModal(true)}
      >
        + New
      </button>

      {showAddModal && (
        <CustomerQuickAddModal 
          onClose={() => setShowAddModal(false)} 
          onCustomerCreated={handleCustomerCreated} 
        />
      )}
    </div>
  );
}

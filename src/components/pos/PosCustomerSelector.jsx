import { useState, useEffect, useMemo, useRef } from 'react';
import { usePos } from './PosContext.jsx';
import { getAdminCustomers } from '../../services/adminCustomersService.js';
import CustomerQuickAddModal from './CustomerQuickAddModal.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function PosCustomerSelector() {
  const { isArabic, formatCurrency, t } = useLocalization();
  const { customer, setCustomer } = usePos();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 15);
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.phoneNormalized && c.phoneNormalized.includes(q))
    ).slice(0, 15);
  }, [customers, search]);

  const handleSelectCustomer = (selected) => {
    setCustomer({ id: selected.id, full_name: selected.name, phone: selected.phone, debt: selected.totalDebt || 0 });
    setIsOpen(false);
    setSearch('');
  };

  const handleClearCustomer = () => {
    setCustomer(null);
    setSearch('');
  };

  const handleCustomerCreated = (newCustomer) => {
    const custObj = { id: newCustomer.id, name: newCustomer.full_name, phone: newCustomer.phone, totalDebt: 0 };
    setCustomers(prev => [custObj, ...prev]);
    setCustomer(newCustomer);
  };

  return (
    <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)', position: 'relative' }} ref={dropdownRef}>
      {customer ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-color)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ fontSize: '1rem' }}>👤</span>
            <div>
              <strong style={{ fontSize: '0.875rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {customer.full_name || customer.name}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {customer.phone || (isArabic ? 'بدون هاتف' : 'No phone')}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClearCustomer}
            style={{ border: 'none', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}
            title={isArabic ? 'إلغاء اختيار العميل (زبون عابر)' : 'Reset to Walk-in customer'}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              placeholder={isArabic ? '🔍 بحث عن عميل (الاسم أو الهاتف)...' : '🔍 Search customer by name or phone...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />

            {isOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1050,
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxHeight: '220px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                <div 
                  style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}
                  onClick={() => {
                    setCustomer(null);
                    setIsOpen(false);
                  }}
                >
                  {isArabic ? 'زبون عابر (بدون حساب / نقدي فقط)' : 'Walk-in Customer (Cash only)'}
                </div>

                {filtered.length === 0 ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {t('noMatchingCustomers')}
                  </div>
                ) : (
                  filtered.map(c => (
                    <div 
                      key={c.id} 
                      style={{ 
                        padding: '0.5rem 0.75rem', 
                        borderBottom: '1px solid var(--border-light)', 
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={() => handleSelectCustomer(c)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block' }}>{c.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.phone}</span>
                      </div>
                      {c.totalDebt > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                          {isArabic ? `دين: ${formatCurrency(c.totalDebt)}` : `Debt: ${formatCurrency(c.totalDebt)}`}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button 
            type="button"
            className="btn btn-outline btn-sm" 
            style={{ whiteSpace: 'nowrap', padding: '0.45rem 0.65rem' }} 
            onClick={() => setShowAddModal(true)}
          >
            {isArabic ? '+ عميل جديد' : '+ New Customer'}
          </button>
        </div>
      )}

      {showAddModal && (
        <CustomerQuickAddModal 
          onClose={() => setShowAddModal(false)} 
          onCustomerCreated={handleCustomerCreated} 
        />
      )}
    </div>
  );
}

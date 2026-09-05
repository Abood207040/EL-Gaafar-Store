import { useState, useMemo } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import BarcodePrintLayout from './BarcodePrintLayout.jsx';

export default function PrintBarcodesModal({ selectedProducts, onClose }) {
  const { t, productName } = useLocalization();
  const [bulkQty, setBulkQty] = useState(1);
  // State to hold quantity for each product id
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    selectedProducts.forEach(p => initial[p.id] = 1);
    return initial;
  });

  const handleApplyToAll = () => {
    const val = parseInt(bulkQty, 10);
    if (!isNaN(val) && val >= 1 && val <= 500) {
      const newQuantities = {};
      selectedProducts.forEach(p => newQuantities[p.id] = val);
      setQuantities(newQuantities);
    }
  };

  const handleQtyChange = (id, value) => {
    if (value === '') {
      setQuantities(prev => ({ ...prev, [id]: '' }));
      return;
    }
    const val = parseInt(value, 10);
    if (!isNaN(val) && val >= 1 && val <= 500) {
      setQuantities(prev => ({ ...prev, [id]: val }));
    }
  };

  const handleQtyBlur = (id, value) => {
    if (value === '' || isNaN(parseInt(value, 10))) {
      setQuantities(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const totalStickers = useMemo(() => {
    return Object.values(quantities).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
  }, [quantities]);

  const handlePrint = () => {
    window.print();
  };

  // Generate the flattened array of products to print based on quantities
  const printItems = useMemo(() => {
    const items = [];
    selectedProducts.forEach(p => {
      const qty = parseInt(quantities[p.id], 10) || 0;
      for (let i = 0; i < qty; i++) {
        items.push(p);
      }
    });
    return items;
  }, [selectedProducts, quantities]);

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h2>{t('printBarcodes')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('cancel')}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: '8px' }}>
            <span style={{ fontWeight: 600 }}>{t('applyToAll')}:</span>
            <input 
              type="number" 
              className="input" 
              style={{ width: '100px' }}
              min="1" 
              max="500" 
              value={bulkQty} 
              onChange={(e) => setBulkQty(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleApplyToAll}>
              {t('applyToAll')}
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{t('productName')}</th>
                <th>{t('barcode')}</th>
                <th style={{ width: '100px' }}>{t('quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map(p => (
                <tr key={p.id}>
                  <td>
                    <p style={{ fontWeight: 600 }}>{productName(p)}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{p.sku}</p>
                  </td>
                  <td>{p.barcode || <span style={{ color: 'var(--danger)' }}>{t('unavailable')}</span>}</td>
                  <td>
                    <input 
                      type="number" 
                      className="input" 
                      min="1" 
                      max="500" 
                      value={quantities[p.id]} 
                      onChange={(e) => handleQtyChange(p.id, e.target.value)}
                      onBlur={(e) => handleQtyBlur(p.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <strong style={{ fontSize: '1.25rem' }}>{t('totalStickers')}: {totalStickers}</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={totalStickers === 0}>{t('printNow')}</button>
        </div>
      </div>
      
      {/* Hidden print layout */}
      <BarcodePrintLayout items={printItems} />
    </div>
  );
}

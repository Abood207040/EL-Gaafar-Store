import { useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { usePos } from './PosContext.jsx';
import { closeShift } from '../../services/adminOfflineService.js';

export default function PosHeader() {
  const { t } = useLocalization();
  const { navigate, activeShift, onShiftEnded } = usePos();
  
  const [showEndShift, setShowEndShift] = useState(false);
  const [endingCash, setEndingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleEndShift = async () => {
    if (!activeShift) return;
    setProcessing(true);
    setError('');
    try {
      await closeShift(activeShift.id, endingCash, activeShift.starting_cash, notes);
      setShowEndShift(false);
      if (onShiftEnded) onShiftEnded();
    } catch (err) {
      setError(err.message || 'Failed to close shift');
      setProcessing(false);
    }
  };

  return (
    <div className="pos-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      padding: '0.75rem clamp(0.75rem, 2vw, 1.5rem)',
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }} className="pos-header-actions">
        <h1 style={{ fontSize: '1.25rem', margin: 0, paddingInlineEnd: '0.75rem', borderInlineEnd: '1px solid var(--border-color)' }}>
          {t('pos')}
        </h1>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/pos')}>
          {t('newSale')}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => document.getElementById('held-sales-modal')?.showModal()}>
          {t('heldSales')}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/offline-sales')}>
          {t('salesHistory')}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          <span>{t('cashier')}: </span>
          <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>
            Admin
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setShowEndShift(true)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          End Shift
        </button>
      </div>

      {showEndShift && (
        <div className="modal-overlay" onClick={() => !processing && setShowEndShift(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>End Shift</h3>
              <button className="btn-close" onClick={() => !processing && setShowEndShift(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                Starting Cash: EGP {Number(activeShift?.starting_cash || 0).toFixed(2)}
              </p>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Actual Ending Cash (EGP)</label>
                <input 
                  type="number" 
                  className="input" 
                  placeholder="0.00" 
                  value={endingCash} 
                  onChange={e => setEndingCash(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Notes (Discrepancy reason)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowEndShift(false)} disabled={processing}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEndShift} disabled={processing}>
                {processing ? 'Closing...' : 'Close Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

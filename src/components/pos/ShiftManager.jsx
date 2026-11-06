import { useState, useEffect } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getCurrentShift, openShift } from '../../services/adminOfflineService.js';

export default function ShiftManager({ onShiftStarted }) {
  const { t, isArabic } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [startingCash, setStartingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const checkShift = async () => {
      try {
        const shift = await getCurrentShift();
        if (shift && !ignore) {
          onShiftStarted(shift);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    checkShift();
    return () => { ignore = true; };
  }, [onShiftStarted]);

  const handleStartShift = async (e) => {
    e.preventDefault();
    if (!startingCash) {
      setError(t('enterStartingCash'));
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const newShift = await openShift(startingCash, notes);
      onShiftStarted(newShift);
    } catch (err) {
      setError(err.message || t('failedStartShift'));
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--muted)' }}>{t('checkingShiftStatus')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.25rem', textAlign: 'center', width: '100%', margin: 0 }}>
            {t('startShift')}
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleStartShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('startingCash')}</label>
              <input 
                type="number" 
                className="input" 
                placeholder={t('startingCashPlaceholder')} 
                value={startingCash} 
                onChange={e => setStartingCash(e.target.value)} 
                min="0" 
                step="0.01"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('notesOptional')}</label>
              <input 
                type="text" 
                className="input" 
                placeholder={isArabic ? 'أي ملاحظات عند بدء الوردية' : 'Any observations upon opening'} 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={processing} style={{ marginTop: '0.5rem' }}>
              {processing ? t('openingRegister') : t('openRegister')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

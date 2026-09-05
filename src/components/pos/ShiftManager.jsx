import { useState, useEffect } from 'react';
import { getCurrentShift, openShift } from '../../services/adminOfflineService.js';
export default function ShiftManager({ onShiftStarted }) {
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
      setError('Please enter starting cash amount');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const newShift = await openShift(startingCash, notes);
      onShiftStarted(newShift);
    } catch (err) {
      setError(err.message || 'Failed to start shift');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--muted)' }}>Checking shift status...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.25rem', textAlign: 'center', width: '100%' }}>Start Shift</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleStartShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Starting Cash in Drawer (EGP)</label>
              <input 
                type="number" 
                className="input" 
                placeholder="e.g. 500" 
                value={startingCash} 
                onChange={e => setStartingCash(e.target.value)} 
                min="0" 
                step="0.01"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Any observations" 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={processing} style={{ marginTop: '0.5rem' }}>
              {processing ? 'Opening Register...' : 'Open Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

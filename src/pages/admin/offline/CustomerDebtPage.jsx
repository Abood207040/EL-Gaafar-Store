import { useState, useEffect } from 'react';
import { useLocalization } from '../../../i18n/Localization.jsx';
import { listCustomerDebts, recordOfflineSalePayment } from '../../../services/adminOfflineService.js';

export default function CustomerDebtPage() {
  const { t, formatCurrency } = useLocalization();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal State
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const data = await listCustomerDebts();
      setDebts(data);
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await listCustomerDebts();
        if (!ignore) setDebts(data);
      } catch (err) {
        if (!ignore) setError(err.message || t('ERR_UNKNOWN'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [t]);

  const totalOutstanding = debts.reduce((sum, d) => sum + Number(d.remaining_balance), 0);

  // Group by customer for display
  const debtsByCustomer = debts.reduce((acc, curr) => {
    const custId = curr.customer_id;
    if (!acc[custId]) {
      acc[custId] = {
        customer: curr.customers,
        totalDebt: 0,
        invoices: []
      };
    }
    acc[custId].totalDebt += Number(curr.remaining_balance);
    acc[custId].invoices.push(curr);
    return acc;
  }, {});

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;
    
    setProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      await recordOfflineSalePayment(
        selectedSale.id, 
        paymentAmount, 
        paymentMethod, 
        paymentNotes
      );
      setSuccessMessage(t('paymentRecorded'));
      setSelectedSale(null);
      setPaymentAmount('');
      setPaymentNotes('');
      // Refresh list
      fetchDebts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-page animate-fadeIn">
      <div className="section-header">
        <h1 className="section-title">{t('customerDebts')}</h1>
        <p className="section-subtitle">{t('customerDebtsSub')}</p>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-card-body">
            <div className="stat-icon" style={{ background: '#EF444422', color: '#EF4444' }}>EGP</div>
            <div>
              <p className="stat-label">{t('totalOutstandingDebt')}</p>
              <p className="stat-value" style={{ color: 'var(--danger)' }}>
                {loading ? '...' : formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
      {successMessage && (
        <p style={{ color: 'var(--success)', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
          {successMessage}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? (
          <p>{t('loadingDebts')}</p>
        ) : Object.keys(debtsByCustomer).length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--success)' }}>{t('noOutstandingDebts')}</h3>
            <p style={{ color: 'var(--muted)' }}>{t('allCustomersPaid')}</p>
          </div>
        ) : (
          Object.values(debtsByCustomer).map((group, idx) => (
            <div key={idx} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>{group.customer?.full_name || t('unknownCustomer')}</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{group.customer?.phone || t('noPhone')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{t('customerTotalDebt')}</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{formatCurrency(group.totalDebt)}</p>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('invoiceHash')}</th>
                      <th>{t('date')}</th>
                      <th>{t('total')}</th>
                      <th>{t('paidCol')}</th>
                      <th>{t('remainingCol')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.sale_number}</td>
                        <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td>{formatCurrency(inv.total)}</td>
                        <td>{formatCurrency(inv.total_paid)}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                          {formatCurrency(inv.remaining_balance)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedSale(inv);
                              setPaymentAmount(inv.remaining_balance);
                              setError('');
                            }}
                          >
                            {t('recordPaymentBtn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {selectedSale && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{t('recordPaymentFor', selectedSale.sale_number)}</h2>
              <button className="close-btn" onClick={() => setSelectedSale(null)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
                <p><strong>{t('customerLabel')}:</strong> {selectedSale.customers?.full_name}</p>
                <p><strong>{t('invoiceTotal')}:</strong> {formatCurrency(selectedSale.total)}</p>
                <p><strong>{t('alreadyPaid')}:</strong> {formatCurrency(selectedSale.total_paid)}</p>
                <p style={{ color: 'var(--danger)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                  <strong>{t('remainingBalance2')}: {formatCurrency(selectedSale.remaining_balance)}</strong>
                </p>
              </div>

              <div className="form-group">
                <label>{t('paymentAmountLabel')}</label>
                <input 
                  type="number"
                  className="input"
                  required
                  min="0.01"
                  max={selectedSale.remaining_balance}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('paymentMethodLabel')}</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">{t('cash')}</option>
                  <option value="card">{t('card')}</option>
                  <option value="fawry">{t('fawry')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('notesOptional')}</label>
                <input 
                  type="text"
                  className="input"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedSale(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                  {processing ? t('recording') : t('confirmPayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

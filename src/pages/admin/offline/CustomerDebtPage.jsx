import { useState, useEffect } from 'react';
import { listCustomerDebts, recordOfflineSalePayment } from '../../../services/adminOfflineService.js';

export default function CustomerDebtPage() {
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
      setError(err.message || 'Failed to load customer debts.');
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
        if (!ignore) setError(err.message || 'Failed to load customer debts.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

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
      setSuccessMessage('Payment recorded successfully.');
      setSelectedSale(null);
      setPaymentAmount('');
      setPaymentNotes('');
      // Refresh list
      fetchDebts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-page animate-fadeIn">
      <div className="section-header">
        <h1 className="section-title">Customer Debts</h1>
        <p className="section-subtitle">Manage outstanding balances and record partial payments</p>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-card-body">
            <div className="stat-icon" style={{ background: '#EF444422', color: '#EF4444' }}>EGP</div>
            <div>
              <p className="stat-label">Total Outstanding Debt</p>
              <p className="stat-value" style={{ color: 'var(--danger)' }}>
                {loading ? '...' : `EGP ${totalOutstanding.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
      {successMessage && <p style={{ color: 'var(--success)', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '4px' }}>{successMessage}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? (
          <p>Loading debts...</p>
        ) : Object.keys(debtsByCustomer).length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--success)' }}>No Outstanding Debts!</h3>
            <p style={{ color: 'var(--muted)' }}>All customers are fully paid.</p>
          </div>
        ) : (
          Object.values(debtsByCustomer).map((group, idx) => (
            <div key={idx} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>{group.customer?.full_name || 'Unknown Customer'}</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{group.customer?.phone || 'No phone'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Customer Total Debt</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>EGP {group.totalDebt.toFixed(2)}</p>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.sale_number}</td>
                        <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td>EGP {Number(inv.total).toFixed(2)}</td>
                        <td>EGP {Number(inv.total_paid).toFixed(2)}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                          EGP {Number(inv.remaining_balance).toFixed(2)}
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
                            Record Payment
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
              <h2>Record Payment for {selectedSale.sale_number}</h2>
              <button className="close-btn" onClick={() => setSelectedSale(null)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
                <p><strong>Customer:</strong> {selectedSale.customers?.full_name}</p>
                <p><strong>Invoice Total:</strong> EGP {Number(selectedSale.total).toFixed(2)}</p>
                <p><strong>Already Paid:</strong> EGP {Number(selectedSale.total_paid).toFixed(2)}</p>
                <p style={{ color: 'var(--danger)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                  <strong>Remaining Balance: EGP {Number(selectedSale.remaining_balance).toFixed(2)}</strong>
                </p>
              </div>

              <div className="form-group">
                <label>Payment Amount (EGP)</label>
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
                <label>Payment Method</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="fawry">Fawry</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <input 
                  type="text"
                  className="input"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid by brother"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedSale(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                  {processing ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

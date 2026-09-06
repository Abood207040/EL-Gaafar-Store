import { useState, useEffect } from 'react';
import { listOfflineSales } from '../../../services/adminOfflineService.js';


export default function AdminOfflineSalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchSales = async () => {
      setLoading(true);
      try {
        const data = await listOfflineSales();
        if (!ignore) setSales(data);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load offline sales.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchSales();
    return () => { ignore = true; };
  }, []);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="section-header">
        <h1 className="section-title">Offline Sales History</h1>
        <p className="section-subtitle">Track and review all physical store transactions</p>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card card">
          <div className="stat-card-body">
            <div className="stat-icon" style={{ background: '#0EA5E922', color: '#0EA5E9' }}>POS</div>
            <div>
              <p className="stat-label">Total Transactions</p>
              <p className="stat-value">{loading ? '...' : sales.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-body">
            <div className="stat-icon" style={{ background: '#F6711322', color: '#F67113' }}>EGP</div>
            <div>
              <p className="stat-label">Total Offline Revenue</p>
              <p className="stat-value">{loading ? '...' : `EGP ${totalRevenue.toFixed(2)}`}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 min(100%, 500px)', minWidth: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Sale Number</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading sales...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No offline sales found.</td></tr>
                ) : (
                  sales.map((sale) => (
                    <tr 
                      key={sale.id} 
                      onClick={() => setSelectedSale(sale)}
                      style={{ cursor: 'pointer', background: selectedSale?.id === sale.id ? 'var(--bg-color)' : 'transparent' }}
                    >
                      <td><span className="sku-text">{sale.sale_number}</span></td>
                      <td>{new Date(sale.created_at).toLocaleString()}</td>
                      <td>
                        <span className="badge" style={{ textTransform: 'uppercase' }}>
                          {sale.payment_method}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>EGP {Number(sale.total).toFixed(2)}</td>
                      <td>{sale.offline_sale_items?.length || 0} items</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedSale && (
          <div className="card animate-fadeIn" style={{ flex: '1 1 min(100%, 360px)', position: 'sticky', top: '100px', minWidth: 0 }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem' }}>Receipt: {selectedSale.sale_number}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedSale(null)}>✕</button>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {new Date(selectedSale.created_at).toLocaleString()}
                <br/>
                {selectedSale.customers && (
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Customer: {selectedSale.customers.full_name}</span>
                )}
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>Items</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(selectedSale.offline_sale_items || []).map((item) => (
                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <div>
                        <span>{item.qty}x {item.product_name}</span>
                        {item.sku && <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.sku}</p>}
                        {item.discount_amount > 0 && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Discount: -EGP {Number(item.discount_amount).toFixed(2)}</p>
                        )}
                      </div>
                      <span>EGP {Number(item.line_total).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>EGP {Number(selectedSale.subtotal).toFixed(2)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Invoice Discount</span>
                    <span>- EGP {Number(selectedSale.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span>Total</span>
                  <span>EGP {Number(selectedSale.total).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                 <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>Payment Status</h3>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>Status:</span>
                    <span className="badge" style={{ 
                      background: selectedSale.payment_status === 'PAID' ? 'var(--success)' : (selectedSale.payment_status === 'UNPAID' ? 'var(--danger)' : 'var(--warning)')
                    }}>{selectedSale.payment_status}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>Total Paid:</span>
                    <span style={{ fontWeight: 'bold' }}>EGP {Number(selectedSale.total_paid).toFixed(2)}</span>
                 </div>
                 {selectedSale.remaining_balance > 0 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--danger)' }}>
                      <span>Remaining Debt:</span>
                      <span style={{ fontWeight: 'bold' }}>EGP {Number(selectedSale.remaining_balance).toFixed(2)}</span>
                   </div>
                 )}
              </div>

              {selectedSale.offline_sale_payments && selectedSale.offline_sale_payments.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>Payment Ledger</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {selectedSale.offline_sale_payments.map((payment) => (
                      <li key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{payment.payment_method}</span>
                          <p style={{ color: 'var(--muted)' }}>{new Date(payment.created_at).toLocaleString()}</p>
                          {payment.notes && <p style={{ fontStyle: 'italic' }}>{payment.notes}</p>}
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>+EGP {Number(payment.amount).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

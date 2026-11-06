import { useEffect, useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getCustomerDetails } from '../../services/adminCustomersService.js';
import { OrderStatusBadge } from '../ui/StatusBadge.jsx';

export default function CustomerDetailsModal({ customerId, onClose }) {
  const { t, formatCurrency, translateOrderStatus, translatePaymentStatus } = useLocalization();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'offline' | 'debt'

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getCustomerDetails(customerId);
        if (!ignore) setData(res);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load customer details');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [customerId]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content animate-fadeIn" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              {data?.customer?.full_name || t('customerDetails') || 'Customer Profile'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              ID: {customerId}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <p>{t('loading')}...</p>
            </div>
          ) : error ? (
            <div style={{ color: 'var(--danger)', padding: '1.5rem', background: '#FEF2F2', borderRadius: '8px' }}>
              {error}
            </div>
          ) : (
            <>
              {/* Customer Info Card */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                background: 'var(--bg-color)', 
                padding: '1rem 1.25rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>{t('phone')}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{data.customer.phone || '—'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>{t('email')}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{data.customer.email || '—'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>{t('location')}</span>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {data.customer.area ? `${data.customer.area}, ` : ''}{data.customer.city || '—'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>{t('customerTotalDebt') || 'Total Debt'}</span>
                  <strong style={{ fontSize: '1.1rem', color: data.totalDebt > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatCurrency(data.totalDebt)}
                  </strong>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  {t('onlineOrdersTab')} ({data.onlineOrders.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'offline' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveTab('offline')}
                >
                  {t('showroomSalesTab')} ({data.offlineSales.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'debt' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveTab('debt')}
                >
                  {t('debtPaymentsTab')}
                </button>
              </div>

              {/* Tab 1: Online Orders */}
              {activeTab === 'orders' && (
                <div>
                  {data.onlineOrders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                      {t('noOnlineOrdersCustomer')}
                    </p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{t('orderNumber') || 'Order #'}</th>
                            <th>{t('date')}</th>
                            <th>{t('total')}</th>
                            <th>{t('status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.onlineOrders.map((o) => (
                            <tr key={o.id}>
                              <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                              <td>{o.date}</td>
                              <td style={{ fontWeight: 'bold' }}>{formatCurrency(o.total)}</td>
                              <td>
                                <OrderStatusBadge status={o.status} label={translateOrderStatus(o.status)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Showroom Sales (POS) */}
              {activeTab === 'offline' && (
                <div>
                  {data.offlineSales.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                      {t('noShowroomSalesCustomer')}
                    </p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{t('saleNumber') || 'Receipt #'}</th>
                            <th>{t('date')}</th>
                            <th>{t('total')}</th>
                            <th>{t('paidCol')}</th>
                            <th>{t('remainingCol')}</th>
                            <th>{t('paymentStatus')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.offlineSales.map((s) => (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 600 }}>{s.sale_number}</td>
                              <td>{new Date(s.created_at).toLocaleDateString()}</td>
                              <td style={{ fontWeight: 'bold' }}>{formatCurrency(s.total)}</td>
                              <td>{formatCurrency(s.total_paid)}</td>
                              <td style={{ color: s.remaining_balance > 0 ? 'var(--danger)' : 'inherit', fontWeight: s.remaining_balance > 0 ? 'bold' : 'normal' }}>
                                {formatCurrency(s.remaining_balance)}
                              </td>
                              <td>
                                <span className={`badge ${s.payment_status === 'PAID' ? 'badge-success' : s.payment_status === 'UNPAID' ? 'badge-danger' : 'badge-warning'}`}>
                                  {translatePaymentStatus(s.payment_status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Debt & Payments */}
              {activeTab === 'debt' && (
                <div>
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: data.totalDebt > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{t('currentOutstandingDebt')} </span>
                    <strong style={{ fontSize: '1.2rem', color: data.totalDebt > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {formatCurrency(data.totalDebt)}
                    </strong>
                  </div>

                  {data.offlineSales.filter(s => Number(s.remaining_balance) > 0).length === 0 ? (
                    <p style={{ color: 'var(--success)', textAlign: 'center', padding: '1.5rem' }}>
                      ✓ {t('noDebtOnCustomer')}
                    </p>
                  ) : (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>{t('unpaidInvoices')}:</h4>
                      <div className="table-wrapper">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>{t('saleNumber') || 'Invoice'}</th>
                              <th>{t('date')}</th>
                              <th>{t('total')}</th>
                              <th>{t('paidCol') || 'Paid'}</th>
                              <th>{t('remainingCol') || 'Debt'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.offlineSales.filter(s => Number(s.remaining_balance) > 0).map((inv) => (
                              <tr key={inv.id}>
                                <td style={{ fontWeight: 600 }}>{inv.sale_number}</td>
                                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                <td>{formatCurrency(inv.total)}</td>
                                <td>{formatCurrency(inv.total_paid)}</td>
                                <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(inv.remaining_balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


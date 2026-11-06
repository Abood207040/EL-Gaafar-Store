import { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '../../../i18n/Localization.jsx';
import { listCustomerDebts, recordOfflineSalePayment } from '../../../services/adminOfflineService.js';

export default function CustomerDebtPage() {
  const { t, formatCurrency, isArabic } = useLocalization();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('debt-desc');

  // Payment Modal State
  const [selectedSale, setSelectedSale] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
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

  const totalOutstanding = useMemo(() => {
    return debts.reduce((sum, d) => sum + Number(d.remaining_balance || 0), 0);
  }, [debts]);

  // Filter debts by search term (customer name, ID, phone, invoice number, date)
  const filteredDebts = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return debts.filter((inv) => {
      const custName = inv.customers?.full_name?.toLowerCase() || '';
      const custPhone = inv.customers?.phone || '';
      const custPhoneNorm = inv.customers?.phone_normalized || '';
      const custEmail = inv.customers?.email?.toLowerCase() || '';
      const custId = inv.customer_id?.toLowerCase() || '';
      const saleNum = inv.sale_number?.toLowerCase() || '';
      const saleId = inv.id?.toLowerCase() || '';
      const isoDate = (inv.created_at || '').slice(0, 10);
      const dateStr = new Date(inv.created_at).toLocaleDateString().toLowerCase();

      const matchText = !q ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        custPhoneNorm.includes(q) ||
        custEmail.includes(q) ||
        custId.includes(q) ||
        saleNum.includes(q) ||
        saleId.includes(q) ||
        isoDate.includes(q) ||
        dateStr.includes(q);

      const matchDate = !dateFilter || isoDate === dateFilter;

      return matchText && matchDate;
    });
  }, [debts, search, dateFilter]);

  // Group filtered debts by customer and apply sorting
  const debtsByCustomer = useMemo(() => {
    const grouped = filteredDebts.reduce((acc, curr) => {
      const custId = curr.customer_id || 'unassigned';
      if (!acc[custId]) {
        acc[custId] = {
          customerId: custId,
          customer: curr.customers,
          totalDebt: 0,
          latestDate: curr.created_at,
          invoices: []
        };
      }
      acc[custId].totalDebt += Number(curr.remaining_balance || 0);
      if (new Date(curr.created_at) > new Date(acc[custId].latestDate)) {
        acc[custId].latestDate = curr.created_at;
      }
      acc[custId].invoices.push(curr);
      return acc;
    }, {});

    const groupsList = Object.values(grouped);

    groupsList.sort((a, b) => {
      if (sortBy === 'debt-desc') {
        return b.totalDebt - a.totalDebt;
      }
      if (sortBy === 'debt-asc') {
        return a.totalDebt - b.totalDebt;
      }
      if (sortBy === 'date-desc') {
        return new Date(b.latestDate) - new Date(a.latestDate);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.latestDate) - new Date(b.latestDate);
      }
      if (sortBy === 'name-asc') {
        const nameA = a.customer?.full_name || '';
        const nameB = b.customer?.full_name || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name-desc') {
        const nameA = a.customer?.full_name || '';
        const nameB = b.customer?.full_name || '';
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return groupsList;
  }, [filteredDebts, sortBy]);

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
      fetchDebts();
      setTimeout(() => setSuccessMessage(''), 3500);
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

      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
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

      {/* Search and Controls */}
      <div className="admin-controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ minWidth: '280px', flex: 1 }}>
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={isArabic ? 'بحث باسم العميل، المعرف، الهاتف، رقم الفاتورة، أو التاريخ...' : 'Search by customer name, ID, phone, invoice #, or date...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            📅 {isArabic ? 'التاريخ:' : 'Date:'}
          </label>
          <input
            type="date"
            className="input"
            style={{ width: 'auto', padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setDateFilter('')}
              title={isArabic ? 'مسح فلتر التاريخ' : 'Clear Date Filter'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            ↕ {isArabic ? 'ترتيب:' : 'Sort:'}
          </label>
          <select
            className="input select"
            style={{ width: 'auto', minWidth: '180px', padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="debt-desc">{isArabic ? '⚠️ المديونية: الأعلى أولاً' : 'Debt: Highest First'}</option>
            <option value="debt-asc">{isArabic ? '💰 المديونية: الأقل أولاً' : 'Debt: Lowest First'}</option>
            <option value="date-desc">{isArabic ? '📅 أحدث فاتورة أولاً' : 'Date: Newest First'}</option>
            <option value="date-asc">{isArabic ? '📅 أقدم فاتورة أولاً' : 'Date: Oldest First'}</option>
            <option value="name-asc">{isArabic ? '👤 اسم العميل (أ - ي)' : 'Customer: A - Z'}</option>
            <option value="name-desc">{isArabic ? '👤 اسم العميل (ي - أ)' : 'Customer: Z - A'}</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
      {successMessage && (
        <p style={{ color: 'var(--success)', marginBottom: '1rem', padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px' }}>
          ✓ {successMessage}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <p>{t('loadingDebts')}</p>
        ) : Object.keys(debtsByCustomer).length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--success)' }}>
              {search ? (isArabic ? 'لم يتم العثور على فواتير تطابق البحث' : 'No invoices matched your search.') : t('noOutstandingDebts')}
            </h3>
            <p style={{ color: 'var(--muted)' }}>{search ? '' : t('allCustomersPaid')}</p>
          </div>
        ) : (
          Object.values(debtsByCustomer).map((group, idx) => (
            <div key={idx} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>👤</span>
                    <span>{group.customer?.full_name || t('unknownCustomer')}</span>
                  </h2>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem', fontSize: '0.825rem', color: 'var(--muted)' }}>
                    <span>📞 {group.customer?.phone || t('noPhone')}</span>
                    {group.customerId && group.customerId !== 'unassigned' && (
                      <span style={{ fontFamily: 'monospace' }}>ID: {group.customerId.slice(0, 8)}...</span>
                    )}
                    <span>🧾 ({group.invoices.length} {isArabic ? 'فواتير متبقية' : 'invoices'})</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>{t('customerTotalDebt')}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>{formatCurrency(group.totalDebt)}</p>
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
                        <td>
                          <span className="sku-text" style={{ fontWeight: 600 }}>{inv.sale_number}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)' }}>
                            ID: {inv.id?.slice(0, 8)}...
                          </span>
                        </td>
                        <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td>{formatCurrency(inv.total)}</td>
                        <td>{formatCurrency(inv.total_paid)}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                          {formatCurrency(inv.remaining_balance)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setViewingInvoice(inv)}
                            >
                              {isArabic ? 'تفاصيل' : 'Details'}
                            </button>
                            <button 
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setSelectedSale(inv);
                                setPaymentAmount(inv.remaining_balance);
                                setError('');
                              }}
                            >
                              {t('recordPaymentBtn')}
                            </button>
                          </div>
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

      {/* Invoice Details Modal */}
      {viewingInvoice && (
        <div className="modal-backdrop" onClick={() => setViewingInvoice(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fadeIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{t('receiptHeader', viewingInvoice.sale_number)}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {new Date(viewingInvoice.created_at).toLocaleString()}
                </span>
              </div>
              <button className="close-btn" onClick={() => setViewingInvoice(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('customerLabel')}</span>
                  <p style={{ margin: 0, fontWeight: 600 }}>{viewingInvoice.customers?.full_name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('remainingBalance2')}</span>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--danger)', fontSize: '1rem' }}>
                    {formatCurrency(viewingInvoice.remaining_balance)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                {t('itemsListLabel') || 'Items Purchased'}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem' }}>
                {(viewingInvoice.offline_sale_items || []).map((it) => (
                  <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{it.qty}x {it.product_name}</strong>
                      {it.sku && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>SKU: {it.sku}</span>}
                    </div>
                    <span>{formatCurrency(it.line_total)}</span>
                  </li>
                ))}
              </ul>

              {/* Payment Ledger */}
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                {t('paymentLedger') || 'Recorded Payments'}
              </h4>
              {(viewingInvoice.offline_sale_payments || []).length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No previous payments recorded.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {viewingInvoice.offline_sale_payments.map((p) => (
                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '4px', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                      <div>
                        <strong style={{ textTransform: 'uppercase' }}>{p.payment_method}</strong>
                        <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.75rem' }}>{new Date(p.created_at).toLocaleString()}</span>
                        {p.notes && <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>{p.notes}</span>}
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>+{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setViewingInvoice(null)}>
                {t('cancel')}
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedSale(viewingInvoice);
                  setPaymentAmount(viewingInvoice.remaining_balance);
                  setViewingInvoice(null);
                }}
              >
                {t('recordPaymentBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedSale && (
        <div className="modal-backdrop" onClick={() => setSelectedSale(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fadeIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.15rem' }}>{t('recordPaymentFor', selectedSale.sale_number)}</h2>
              <button className="close-btn" onClick={() => setSelectedSale(null)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 0.4rem' }}><strong>{t('customerLabel')}:</strong> {selectedSale.customers?.full_name}</p>
                <p style={{ margin: '0 0 0.4rem' }}><strong>{t('invoiceTotal')}:</strong> {formatCurrency(selectedSale.total)}</p>
                <p style={{ margin: '0 0 0.4rem' }}><strong>{t('alreadyPaid')}:</strong> {formatCurrency(selectedSale.total_paid)}</p>
                <p style={{ color: 'var(--danger)', fontSize: '1.05rem', margin: '0.5rem 0 0' }}>
                  <strong>{t('remainingBalance2')}: {formatCurrency(selectedSale.remaining_balance)}</strong>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">{t('paymentAmountLabel')}</label>
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
                <label className="form-label">{t('paymentMethodLabel')}</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">{t('cash')}</option>
                  <option value="card">{t('card')}</option>
                  <option value="fawry">{t('fawry')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('notesOptional')}</label>
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

import { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '../../../i18n/Localization.jsx';
import { listOfflineSales } from '../../../services/adminOfflineService.js';

export default function AdminOfflineSalesPage() {
  const { t, formatCurrency, isArabic } = useLocalization();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    let ignore = false;
    const fetchSales = async () => {
      setLoading(true);
      try {
        const data = await listOfflineSales();
        if (!ignore) setSales(data);
      } catch (err) {
        if (!ignore) setError(err.message || t('ERR_UNKNOWN'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchSales();
    return () => { ignore = true; };
  }, [t]);

  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  }, [sales]);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    const result = sales.filter((sale) => {
      const saleNum = sale.sale_number?.toLowerCase() || '';
      const saleId = sale.id?.toLowerCase() || '';
      const custId = sale.customer_id?.toLowerCase() || '';
      const custName = sale.customers?.full_name?.toLowerCase() || '';
      const custPhone = sale.customers?.phone || '';
      const method = sale.payment_method?.toLowerCase() || '';
      const status = sale.payment_status?.toLowerCase() || '';
      const dateStr = new Date(sale.created_at).toLocaleDateString().toLowerCase();
      const isoDate = (sale.created_at || '').slice(0, 10);

      const matchText = !q || 
        saleNum.includes(q) ||
        saleId.includes(q) ||
        custId.includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        method.includes(q) ||
        status.includes(q) ||
        dateStr.includes(q) ||
        isoDate.includes(q);

      const matchDate = !dateFilter || isoDate === dateFilter;

      return matchText && matchDate;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === 'total-desc') {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      if (sortBy === 'total-asc') {
        return Number(a.total || 0) - Number(b.total || 0);
      }
      if (sortBy === 'debt-desc') {
        return Number(b.remaining_balance || 0) - Number(a.remaining_balance || 0);
      }
      if (sortBy === 'name-asc') {
        const nameA = a.customers?.full_name || (isArabic ? 'ي' : 'z');
        const nameB = b.customers?.full_name || (isArabic ? 'ي' : 'z');
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name-desc') {
        const nameA = a.customers?.full_name || (isArabic ? 'أ' : 'a');
        const nameB = b.customers?.full_name || (isArabic ? 'أ' : 'a');
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [sales, search, dateFilter, sortBy, isArabic]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="section-header">
        <h1 className="section-title">{t('offlineSalesHistory')}</h1>
        <p className="section-subtitle">{t('offlineSalesHistorySub')}</p>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card card">
          <div className="stat-card-body">
            <div className="stat-icon" style={{ background: '#0EA5E922', color: '#0EA5E9' }}>POS</div>
            <div>
              <p className="stat-label">{t('totalTransactions')}</p>
              <p className="stat-value">{loading ? '...' : sales.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-body">
            <div className="stat-icon" style={{ background: '#F6711322', color: '#F67113' }}>EGP</div>
            <div>
              <p className="stat-label">{t('totalOfflineRevenue')}</p>
              <p className="stat-value">{loading ? '...' : formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="admin-controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ minWidth: '280px', flex: 1 }}>
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={isArabic ? 'بحث برقم الفاتورة، اسم العميل، المعرف، الهاتف، أو التاريخ...' : 'Search by receipt #, customer name, ID, phone, or date...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="date-desc">{isArabic ? '📅 الأحدث أولاً (افتراضي)' : 'Date: Newest First'}</option>
            <option value="date-asc">{isArabic ? '📅 الأقدم أولاً' : 'Date: Oldest First'}</option>
            <option value="total-desc">{isArabic ? '💰 المبلغ: من الأعلى للأدنى' : 'Total: High to Low'}</option>
            <option value="total-asc">{isArabic ? '💰 المبلغ: من الأدنى للأعلى' : 'Total: Low to High'}</option>
            <option value="debt-desc">{isArabic ? '⚠️ المديونية: الأعلى أولاً' : 'Debt: Highest First'}</option>
            <option value="name-asc">{isArabic ? '👤 اسم العميل (أ - ي)' : 'Customer: A - Z'}</option>
            <option value="name-desc">{isArabic ? '👤 اسم العميل (ي - أ)' : 'Customer: Z - A'}</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 min(100%, 540px)', minWidth: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('saleNumber')}</th>
                  <th>{t('date')}</th>
                  <th>{t('customerLabel') || 'Customer'}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                  <th>{isArabic ? 'الكاشير' : 'Cashier'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>{t('loadingSales')}</td></tr>
                ) : paginatedSales.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>{t('noOfflineSalesFound')}</td></tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr 
                      key={sale.id} 
                      onClick={() => setSelectedSale(sale)}
                      style={{ cursor: 'pointer', background: selectedSale?.id === sale.id ? 'var(--bg-color)' : 'transparent' }}
                    >
                      <td>
                        <span className="sku-text" style={{ fontWeight: 600 }}>{sale.sale_number}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)' }}>
                          ID: {sale.id?.slice(0, 8)}...
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(sale.created_at).toLocaleString()}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {sale.customers?.full_name || (
                            <span className="badge" style={{ background: '#F1F5F9', color: '#64748B', fontWeight: 500 }}>
                              {isArabic ? 'زبون عابر (كاش)' : 'Walk-in'}
                            </span>
                          )}
                        </div>
                        {sale.customers?.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            📞 {sale.customers.phone}
                          </div>
                        )}
                        {sale.customer_id && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                            ID: {sale.customer_id.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{formatCurrency(sale.total)}</td>
                      <td>
                        <span className={`badge ${sale.payment_status === 'PAID' ? 'badge-success' : sale.payment_status === 'UNPAID' ? 'badge-danger' : 'badge-warning'}`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {sale.profiles?.full_name || 'Staff'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {t('prevPage')}
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
                {t('pageOf', page, totalPages)}
              </span>
              <button
                className="btn btn-sm btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                {t('nextPage')}
              </button>
            </div>
          )}
        </div>

        {selectedSale && (
          <div className="card animate-fadeIn" style={{ flex: '1 1 min(100%, 360px)', position: 'sticky', top: '100px', minWidth: 0 }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.05rem', margin: 0 }}>{t('receiptHeader', selectedSale.sale_number)}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedSale(null)}>✕</button>
            </div>
            <div className="card-body">
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{isArabic ? 'بيانات العميل:' : 'Customer Details:'}</span>
                  {selectedSale.customer_id && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                      ID: {selectedSale.customer_id.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--primary)' }}>
                  👤 {selectedSale.customers?.full_name || (isArabic ? 'زبون عابر (نقدي)' : 'Walk-in Customer')}
                </p>
                {selectedSale.customers?.phone && (
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    📞 {selectedSale.customers.phone}
                  </p>
                )}
                {selectedSale.customers?.email && (
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    ✉️ {selectedSale.customers.email}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                <span>📅 {new Date(selectedSale.created_at).toLocaleString()}</span>
                {selectedSale.profiles?.full_name && (
                  <span>👨‍💼 {isArabic ? 'الكاشير:' : 'Cashier:'} {selectedSale.profiles.full_name}</span>
                )}
              </div>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>{t('itemsListLabel')}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(selectedSale.offline_sale_items || []).map((item) => (
                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <div>
                        <span>{item.qty}x {item.product_name}</span>
                        {item.sku && <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{item.sku}</p>}
                        {item.discount_amount > 0 && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--success)', margin: 0 }}>{t('discount')}: -{formatCurrency(item.discount_amount)}</p>
                        )}
                        {item.returned_qty > 0 && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 0 }}>{isArabic ? `تم إرجاع: ${item.returned_qty}` : `Returned: ${item.returned_qty}`}</p>
                        )}
                      </div>
                      <span>{formatCurrency(item.line_total)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('subtotal')}</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>{t('discountLabel')}</span>
                    <span>- {formatCurrency(selectedSale.discount_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span>{t('total')}</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span>{t('status')}:</span>
                    <span className="badge" style={{ 
                      background: selectedSale.payment_status === 'PAID' ? 'var(--success)' : (selectedSale.payment_status === 'UNPAID' ? 'var(--danger)' : 'var(--warning)')
                    }}>{selectedSale.payment_status}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span>{t('totalPaid')}:</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(selectedSale.total_paid)}</span>
                 </div>
                 {selectedSale.remaining_balance > 0 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--danger)' }}>
                      <span>{t('remainingDebt')}:</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(selectedSale.remaining_balance)}</span>
                   </div>
                 )}
              </div>

              {selectedSale.offline_sale_payments && selectedSale.offline_sale_payments.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>{t('paymentLedger')}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {selectedSale.offline_sale_payments.map((payment) => (
                      <li key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem', padding: '0.4rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{payment.payment_method}</span>
                          <p style={{ color: 'var(--muted)', margin: 0 }}>{new Date(payment.created_at).toLocaleString()}</p>
                          {payment.notes && <p style={{ fontStyle: 'italic', margin: 0 }}>{payment.notes}</p>}
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>+{formatCurrency(payment.amount)}</span>
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

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalization } from '../../../i18n/Localization.jsx';
import { listOfflineSales, processOfflineReturn } from '../../../services/adminOfflineService.js';

export default function AdminReturnsPage() {
  const { t, formatCurrency, parseRpcError, isArabic } = useLocalization();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState({}); // { itemId: { sale_item_id, product_id, qty, restock, maxQty, unitNetPrice } }
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOfflineSales();
      setSales(data);
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    const result = sales.filter((s) => {
      const num = s.sale_number?.toLowerCase() || '';
      const saleId = s.id?.toLowerCase() || '';
      const custId = s.customer_id?.toLowerCase() || '';
      const name = s.customers?.full_name?.toLowerCase() || '';
      const phone = s.customers?.phone || '';
      const isoDate = (s.created_at || '').slice(0, 10);
      const dateStr = new Date(s.created_at).toLocaleDateString().toLowerCase();

      const matchText = !q ||
        num.includes(q) ||
        saleId.includes(q) ||
        custId.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        isoDate.includes(q) ||
        dateStr.includes(q);

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

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setSuccessInfo(null);
    setError('');
    setRefundReason('');

    const initialItems = {};
    const subtotal = Number(sale.subtotal || 0);
    const invoiceDiscount = Number(sale.discount_amount || 0);
    const invoiceDiscountRatio = subtotal > 0 ? (invoiceDiscount / subtotal) : 0;

    (sale.offline_sale_items || []).forEach(item => {
      const returnedAlready = Number(item.returned_qty || 0);
      const availableQty = Math.max(0, item.qty - returnedAlready);
      
      // Calculate effective unit net price after item discount & proportional invoice discount
      const lineUnitNet = (item.line_total / item.qty) * (1 - invoiceDiscountRatio);
      
      initialItems[item.id] = {
        sale_item_id: item.id,
        product_id: item.product_id,
        qty: 0,
        restock: true,
        maxQty: availableQty,
        product_name: item.product_name,
        unitNetPrice: Math.round(lineUnitNet * 100) / 100
      };
    });

    setReturnItems(initialItems);
  };

  // Calculations for total return value, debt offset, and cash refund
  const { totalReturnValue, debtOffset, cashRefund } = useMemo(() => {
    if (!selectedSale) return { totalReturnValue: 0, debtOffset: 0, cashRefund: 0 };
    
    let total = 0;
    Object.values(returnItems).forEach(item => {
      total += (item.qty || 0) * (item.unitNetPrice || 0);
    });
    total = Math.round(total * 100) / 100;

    const remainingDebt = Number(selectedSale.remaining_balance || 0);
    const debtOffset = remainingDebt > 0 ? Math.min(total, remainingDebt) : 0;
    const cashRefund = Math.max(0, total - debtOffset);

    return { totalReturnValue: total, debtOffset, cashRefund };
  }, [selectedSale, returnItems]);

  const handleProcessReturn = async () => {
    const itemsToReturn = Object.values(returnItems)
      .filter(item => item.qty > 0)
      .map(item => ({
        sale_item_id: item.sale_item_id,
        product_id: item.product_id,
        qty: item.qty,
        restock: item.restock
      }));
      
    if (itemsToReturn.length === 0) {
      setError(t('selectAtLeastOneItem'));
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      const result = await processOfflineReturn(
        selectedSale.id, 
        itemsToReturn, 
        refundReason, 
        refundMethod
      );
      
      setSuccessInfo(result);
      setSelectedSale(null);
      fetchSales();
    } catch (err) {
      setError(parseRpcError(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-page-header">
        <h1>{t('returns')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          {isArabic ? 'إرجاع منتجات المبيعات، استرداد المبالغ المالية، وتعديل مديونيات العملاء تلقائياً' : 'Process sales returns, reconcile debts, and restock products.'}
        </p>
      </div>

      {successInfo && (
        <div style={{ padding: '1rem 1.25rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', marginBottom: '1.5rem', color: '#166534' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>✓ {isArabic ? 'تم تسجيل الإرجاع بنجاح!' : 'Return Processed Successfully!'}</h3>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem' }}>
            {isArabic ? 'رقم عملية الإرجاع:' : 'Return Reference:'} <strong>{successInfo.return_number}</strong>
          </p>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem' }}>
            {isArabic ? 'إجمالي قيمة المرتجعات:' : 'Total Return Value:'} <strong>{formatCurrency(successInfo.total_returned_value)}</strong>
          </p>
          {successInfo.debt_offset_amount > 0 && (
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
              {isArabic ? 'المبلغ المخصوم من المديونية:' : 'Debt Offset:'} <strong>{formatCurrency(successInfo.debt_offset_amount)}</strong>
            </p>
          )}
          {successInfo.cash_refund_amount > 0 && (
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 'bold' }}>
              {isArabic ? 'المبلغ المسترد للعميل نقداً:' : 'Cash Refund to Customer:'} {formatCurrency(successInfo.cash_refund_amount)}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Sales List Panel */}
        <div className="card" style={{ flex: '1 1 min(100%, 450px)', maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('recentSales')}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>({filteredSales.length})</span>
            </div>

            {/* Search Input */}
            <input
              type="search"
              className="input"
              style={{ width: '100%', fontSize: '0.85rem' }}
              placeholder={isArabic ? '🔍 بحث برقم الفاتورة، اسم العميل، المعرف، الهاتف، أو التاريخ...' : '🔍 Search by receipt #, customer name, ID, phone, or date...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Filter and Sorting Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <input
                  type="date"
                  className="input"
                  style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  title={isArabic ? 'فلترة حسب التاريخ' : 'Filter by date'}
                />
              </div>
              {dateFilter && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setDateFilter('')}
                  title="Clear Date"
                  style={{ padding: '0.2rem 0.5rem' }}
                >
                  ✕
                </button>
              )}
              <div style={{ flex: 1, minWidth: '150px' }}>
                <select
                  className="input select"
                  style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">{isArabic ? '📅 الأحدث أولاً' : 'Date: Newest'}</option>
                  <option value="date-asc">{isArabic ? '📅 الأقدم أولاً' : 'Date: Oldest'}</option>
                  <option value="total-desc">{isArabic ? '💰 المبلغ: الأعلى' : 'Total: High to Low'}</option>
                  <option value="total-asc">{isArabic ? '💰 المبلغ: الأدنى' : 'Total: Low to High'}</option>
                  <option value="name-asc">{isArabic ? '👤 العميل: أ - ي' : 'Customer: A - Z'}</option>
                  <option value="name-desc">{isArabic ? '👤 العميل: ي - أ' : 'Customer: Z - A'}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('saleHash')}</th>
                  <th>{t('customerLabel') || 'Customer'}</th>
                  <th>{t('date')}</th>
                  <th>{t('total')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                      {t('loading')}...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                      {t('noOfflineSalesFound')}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => (
                    <tr 
                      key={sale.id} 
                      style={{ 
                        background: selectedSale?.id === sale.id ? 'var(--bg-color)' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSelectSale(sale)}
                    >
                      <td>
                        <span className="sku-text" style={{ fontWeight: 600 }}>{sale.sale_number}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>
                          ID: {sale.id?.slice(0, 8)}...
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {sale.customers?.full_name || (
                            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                              {isArabic ? 'زبون عابر' : 'Walk-in'}
                            </span>
                          )}
                        </div>
                        {sale.customers?.phone && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                            📞 {sale.customers.phone}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(sale.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 'bold' }}>{formatCurrency(sale.total)}</td>
                      <td>
                        <button 
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSale(sale);
                          }}
                        >
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Interface Panel */}
        {selectedSale ? (
          <div className="card animate-fadeIn" style={{ flex: '1 1 min(100%, 500px)', position: 'sticky', top: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t('processReturn', selectedSale.sale_number)}</h3>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    👤 {isArabic ? 'العميل:' : 'Customer:'} {selectedSale.customers?.full_name || (isArabic ? 'زبون عابر (كاش)' : 'Walk-in Customer')}
                  </span>
                  {selectedSale.customers?.phone && (
                    <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                      📞 {selectedSale.customers.phone}
                    </span>
                  )}
                  {selectedSale.customer_id && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                      (ID: {selectedSale.customer_id.slice(0, 8)}...)
                    </span>
                  )}
                  {selectedSale.remaining_balance > 0 && (
                    <span style={{ display: 'block', color: 'var(--danger)', fontWeight: 'bold', marginTop: '0.15rem' }}>
                      ⚠️ {isArabic ? 'مديونية حالية على الفاتورة:' : 'Outstanding Invoice Debt:'} {formatCurrency(selectedSale.remaining_balance)}
                    </span>
                  )}
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedSale(null)}>✕</button>
            </div>
            
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('itemCol')}</th>
                      <th>{isArabic ? 'المتاح للإرجاع' : 'Available'}</th>
                      <th>{t('returnQty')}</th>
                      <th>{t('restockQuestion')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSale.offline_sale_items || []).map(item => {
                      const returnData = returnItems[item.id] || { qty: 0, maxQty: 0, restock: true, unitNetPrice: item.unit_price };
                      const isUnavailable = returnData.maxQty <= 0;
                      return (
                        <tr key={item.id} style={{ opacity: isUnavailable ? 0.5 : 1 }}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              {isArabic ? 'صافي السعر للقطعة:' : 'Net per unit:'} {formatCurrency(returnData.unitNetPrice)}
                            </div>
                          </td>
                          <td>
                            <strong>{returnData.maxQty}</strong> / {item.qty}
                          </td>
                          <td>
                            <input 
                              type="number"
                              className="input"
                              style={{ width: '70px', padding: '0.3rem' }}
                              min="0"
                              max={returnData.maxQty}
                              disabled={isUnavailable}
                              value={returnData.qty}
                              onChange={(e) => {
                                const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), returnData.maxQty);
                                setReturnItems({ ...returnItems, [item.id]: { ...returnData, qty: val } });
                              }}
                            />
                          </td>
                          <td>
                            <input 
                              type="checkbox"
                              disabled={isUnavailable}
                              checked={returnData.restock}
                              onChange={(e) => {
                                setReturnItems({ ...returnItems, [item.id]: { ...returnData, restock: e.target.checked } });
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Split Breakdown */}
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{isArabic ? 'إجمالي قيمة الأصناف المرجعة:' : 'Total Return Value:'}</span>
                  <strong>{formatCurrency(totalReturnValue)}</strong>
                </div>
                {debtOffset > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--primary)' }}>
                    <span>{isArabic ? 'خصم تلقائي لتسوية مديونية العميل:' : 'Auto Debt Offset:'}</span>
                    <strong>- {formatCurrency(debtOffset)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', color: cashRefund > 0 ? 'var(--danger)' : 'var(--text-color)' }}>
                  <span>{isArabic ? 'المبلغ المستحق إرجاعه نقداً للعميل:' : 'Cash Refund Due to Customer:'}</span>
                  <span>{formatCurrency(cashRefund)}</span>
                </div>
              </div>

              {cashRefund > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{isArabic ? 'طريقة إرجاع المبلغ:' : 'Refund Method:'}</label>
                  <select className="input" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                    <option value="cash">{t('cash')}</option>
                    <option value="card">{t('card')}</option>
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('refundReason')}</label>
                <input 
                  type="text"
                  className="input"
                  placeholder={t('refundReasonPlaceholder')}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedSale(null)}>
                  {t('cancel')}
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={handleProcessReturn}
                  disabled={processing || totalReturnValue === 0}
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  {processing ? t('processing') : (isArabic ? 'تأكيد الإرجاع المالي واسترداد المخزون' : 'Confirm Return & Restock')}
                </button>
              </div>
              
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{error}</p>}
            </div>
          </div>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--muted)', minHeight: '200px' }}>
            <p>{t('selectSalePrompt')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

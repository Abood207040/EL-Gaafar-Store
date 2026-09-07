import { useState, useEffect } from 'react';
import { useLocalization } from '../../../i18n/Localization.jsx';
import { listOfflineSales, processOfflineReturn } from '../../../services/adminOfflineService.js';

export default function AdminReturnsPage() {
  const { t, formatCurrency, parseRpcError } = useLocalization();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState({}); // { itemId: { qty, restock } }
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await listOfflineSales();
      setSales(data);
    } catch (err) {
      setError(err.message || t('ERR_UNKNOWN'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    const initialItems = {};
    sale.offline_sale_items.forEach(item => {
      initialItems[item.id] = { product_id: item.product_id, qty: 0, restock: true, maxQty: item.qty, unit_price: item.unit_price };
    });
    setReturnItems(initialItems);
    setRefundReason('');
    setError('');
  };

  const calculateTotalRefund = () => {
    let total = 0;
    Object.values(returnItems).forEach(item => {
      total += item.qty * (item.unit_price || 0);
    });
    return total;
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = Object.values(returnItems)
      .filter(item => item.qty > 0)
      .map(item => ({ product_id: item.product_id, qty: item.qty, restock: item.restock }));
      
    if (itemsToReturn.length === 0) {
      setError(t('selectAtLeastOneItem'));
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      await processOfflineReturn(selectedSale.id, calculateTotalRefund(), refundReason, itemsToReturn);
      alert(t('returnSuccess'));
      setSelectedSale(null);
    } catch (err) {
      setError(parseRpcError(err));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="admin-page"><p>{t('loading') || 'Loading...'}</p></div>;

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-page-header">
        <h1>{t('returns')}</h1>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Sales List */}
        <div className="card" style={{ flex: '1 1 min(100%, 380px)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div className="card-header">
            <h3>{t('recentSales')}</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('saleHash')}</th>
                  <th>{t('date')}</th>
                  <th>{t('total')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                      {t('noOfflineSalesFound')}
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} style={{ background: selectedSale?.id === sale.id ? 'var(--bg-color)' : 'transparent' }}>
                      <td>{sale.sale_number}</td>
                      <td>{new Date(sale.created_at).toLocaleString()}</td>
                      <td>{formatCurrency(sale.total)}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => handleSelectSale(sale)}>
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

        {/* Return Interface */}
        {selectedSale ? (
          <div className="card" style={{ flex: 1, position: 'sticky', top: 0 }}>
            <div className="card-header">
              <h3>{t('processReturn', selectedSale.sale_number)}</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="table-wrapper">
                <table className="table">
                <thead>
                  <tr>
                    <th>{t('itemCol')}</th>
                    <th>{t('maxQty')}</th>
                    <th>{t('returnQty')}</th>
                    <th>{t('restockQuestion')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.offline_sale_items.map(item => {
                    const returnData = returnItems[item.id];
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{formatCurrency(item.unit_price)}</div>
                        </td>
                        <td>{item.qty}</td>
                        <td>
                          <input 
                            type="number"
                            className="input"
                            style={{ width: '80px' }}
                            min="0"
                            max={item.qty}
                            value={returnData.qty}
                            onChange={(e) => {
                              const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), item.qty);
                              setReturnItems({ ...returnItems, [item.id]: { ...returnData, qty: val } });
                            }}
                          />
                        </td>
                        <td>
                          <input 
                            type="checkbox"
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

              <div className="form-group">
                <label className="form-label">{t('refundReason')}</label>
                <input 
                  type="text"
                  className="input"
                  placeholder={t('refundReasonPlaceholder')}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('totalRefundAmount')}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatCurrency(calculateTotalRefund())}</div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleProcessReturn}
                  disabled={processing || calculateTotalRefund() === 0}
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  {processing ? t('processing') : t('processReturnBtn')}
                </button>
              </div>
              
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
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

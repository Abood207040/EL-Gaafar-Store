import { useState, useEffect } from 'react';
import { useLocalization } from '../../../i18n/Localization.jsx';
import { listOfflineSales, processOfflineReturn } from '../../../services/adminOfflineService.js';

export default function AdminReturnsPage() {
  const { t, language, parseRpcError } = useLocalization();
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
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales();
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
      setError('Please select at least one item to return');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      await processOfflineReturn(selectedSale.id, calculateTotalRefund(), refundReason, itemsToReturn);
      alert('Return processed successfully!');
      setSelectedSale(null);
      // We don't necessarily need to reload sales unless we want to show return status
    } catch (err) {
      setError(parseRpcError(err));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-page-header">
        <h1>{t('returns') || 'Returns'}</h1>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Sales List */}
        <div className="card" style={{ flex: '1 1 min(100%, 380px)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div className="card-header">
            <h3>Recent Sales</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sale #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id} style={{ background: selectedSale?.id === sale.id ? 'var(--bg-color)' : 'transparent' }}>
                    <td>{sale.sale_number}</td>
                    <td>{new Date(sale.created_at).toLocaleString()}</td>
                    <td>EGP {Number(sale.total).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleSelectSale(sale)}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Interface */}
        {selectedSale && (
          <div className="card" style={{ flex: 1, position: 'sticky', top: 0 }}>
            <div className="card-header">
              <h3>Process Return: {selectedSale.sale_number}</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="table-wrapper">
                <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Max Qty</th>
                    <th>Return Qty</th>
                    <th>Restock?</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.offline_sale_items.map(item => {
                    const returnData = returnItems[item.id];
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{language === 'ar' ? item.product_name : item.product_name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>EGP {Number(item.unit_price).toFixed(2)}</div>
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
                <label className="form-label">Refund Reason</label>
                <input 
                  type="text"
                  className="input"
                  placeholder="e.g. Defective, Customer changed mind"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Refund Amount</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>EGP {calculateTotalRefund().toFixed(2)}</div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleProcessReturn}
                  disabled={processing || calculateTotalRefund() === 0}
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  {processing ? 'Processing...' : 'Process Return'}
                </button>
              </div>
              
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

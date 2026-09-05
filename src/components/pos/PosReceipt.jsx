import { usePos } from './PosContext.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function PosReceipt() {
  const { t, productName, isRTL } = useLocalization();
  const { completedSaleData, closeReceipt } = usePos();

  if (!completedSaleData) return null;

  const {
    id,
    date,
    customer,
    items,
    subtotal,
    invoiceDiscount,
    total,
    paymentMethod,
    amountReceived,
    changeAmount,
    remainingBalance
  } = completedSaleData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', alignItems: 'center', background: 'var(--bg-color)', padding: '2rem' }}>
      
      {/* Receipt Paper */}
      <div className="pos-receipt-paper" style={{
        background: 'white',
        color: 'black',
        width: '100%',
        maxWidth: '300px', // ~80mm thermal roll standard
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        marginBottom: '2rem',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>EL-GAAFAR STORE</h2>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '18px' }}>متجر الجعفر</h2>
        </div>

        <div style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
          <div>Receipt #: {id.substring(0,8).toUpperCase()}...</div>
          <div>Date: {new Date(date).toLocaleString()}</div>
          <div>Cashier: Admin</div>
          <div style={{ marginTop: '0.5rem' }}>
            Customer:<br/>
            <strong>{customer ? (customer.full_name || customer.name) : 'Walk-in Customer'}</strong>
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ textAlign: isRTL ? 'right' : 'left', paddingBottom: '0.5rem' }}>Item</th>
              <th style={{ textAlign: 'center', paddingBottom: '0.5rem' }}>Qty</th>
              <th style={{ textAlign: isRTL ? 'left' : 'right', paddingBottom: '0.5rem' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              // Calculate line total purely for the receipt display (ignoring item discount complexity here for brevity, relying on subtotal)
              const lineSub = (item.product.price * item.qty).toFixed(2);
              return (
                <tr key={idx}>
                  <td style={{ padding: '0.25rem 0' }}>{productName(item.product)}</td>
                  <td style={{ textAlign: 'center', padding: '0.25rem 0' }}>{item.qty}</td>
                  <td style={{ textAlign: isRTL ? 'left' : 'right', padding: '0.25rem 0' }}>{lineSub}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #ccc', paddingTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          {invoiceDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount</span>
              <span>-{invoiceDiscount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax</span>
            <span>0.00</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.5rem 0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>TOTAL</span>
          <span>EGP {total.toFixed(2)}</span>
        </div>

        <div style={{ marginBottom: '1.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Method:</span>
            <span>{paymentMethod.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Amount Paid:</span>
            <span>{Number(amountReceived).toFixed(2)}</span>
          </div>
          {changeAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Change:</span>
              <span>{changeAmount.toFixed(2)}</span>
            </div>
          )}
          {remainingBalance > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: 'bold' }}>
              <span>Remaining Debt:</span>
              <span>{remainingBalance.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Thank You</p>
          <p style={{ margin: 0, fontWeight: 'bold' }}>شكراً لزيارتكم</p>
          {remainingBalance > 0 && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '10px' }}>
              Please settle your remaining balance of EGP {remainingBalance.toFixed(2)} promptly.
            </p>
          )}
        </div>
      </div>

      {/* Actions (Not printed) */}
      <div className="pos-receipt-actions" style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={handlePrint}>
          {t('printReceipt') || 'Print Receipt'}
        </button>
        <button className="btn btn-primary" onClick={closeReceipt}>
          {t('newSale')}
        </button>
      </div>

      {/* Print CSS Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .pos-receipt-paper, .pos-receipt-paper * {
            visibility: visible;
          }
          .pos-receipt-paper {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            box-shadow: none;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}

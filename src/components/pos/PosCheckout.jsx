import { usePos } from './PosContext.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function PosCheckout() {
  const { t } = useLocalization();
  const { 
    subtotal, total, invoiceDiscount,
    invoiceDiscountType, setInvoiceDiscountType,
    invoiceDiscountValue, setInvoiceDiscountValue,
    paymentMethod, setPaymentMethod,
    paymentStatus, setPaymentStatus,
    amountPaid, setAmountPaid, 
    changeAmount, remainingBalance, guestDebtBlocked,
    canCheckout, handleCheckout, processing,
    error, successMessage
  } = usePos();

  return (
    <div className="card-footer pos-checkout" style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-color)' }}>
      
      {/* Subtotal & Discount Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>{t('subtotal') || 'Subtotal'}</span>
          <span style={{ color: 'var(--text-color)', fontWeight: 600, fontSize: '1rem' }}>EGP {subtotal.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('invoiceDiscount') || 'Discount'}</span>
          <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
            <select 
              style={{ padding: '0.2rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', background: 'var(--bg-color)', cursor: 'pointer', outline: 'none' }}
              value={invoiceDiscountType}
              onChange={(e) => setInvoiceDiscountType(e.target.value)}
            >
              <option value="fixed">EGP</option>
              <option value="percentage">%</option>
            </select>
            <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
            <input 
              type="number"
              style={{ width: '60px', padding: '0.2rem 0.5rem', fontSize: '0.85rem', fontWeight: 700, border: 'none', outline: 'none', textAlign: 'center' }}
              value={invoiceDiscountValue}
              onChange={(e) => setInvoiceDiscountValue(e.target.value)}
              min="0"
              step="1"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {invoiceDiscount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
            {t('discountApplied') || 'Discount'}
          </span>
          <span>- EGP {invoiceDiscount.toFixed(2)}</span>
        </div>
      )}

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-color)' }}>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 800 }}>{t('total') || 'Total'}</span>
        <span style={{ fontSize: '1.5rem', color: 'var(--text-color)', fontWeight: 900, letterSpacing: '-0.02em' }}>EGP {total.toFixed(2)}</span>
      </div>
      
      {/* Payment Method Selection */}
      <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
        {['cash', 'card', 'fawry'].map(method => (
          <label 
            key={method} 
            style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', 
              padding: '0.5rem', border: '1px solid', borderColor: paymentMethod === method ? 'var(--primary)' : 'var(--border-color)', 
              borderRadius: '6px', cursor: 'pointer', 
              background: paymentMethod === method ? 'var(--primary)' : 'var(--bg-color)', 
              color: paymentMethod === method ? '#ffffff' : 'var(--muted)',
              fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
              boxShadow: paymentMethod === method ? '0 2px 4px rgba(14, 165, 233, 0.2)' : 'none'
            }}
          >
            <input type="radio" name="paymentMethod" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} style={{ display: 'none' }} />
            {method === 'cash' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>}
            {method === 'card' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>}
            {method === 'fawry' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 18h1"/><path d="M13 18h3"/><path d="M8 14h8"/></svg>}
            <span>{t(method) || method.charAt(0).toUpperCase() + method.slice(1)}</span>
          </label>
        ))}
      </div>

      {/* Payment Status Tabs (Full vs Partial) */}
      <div style={{ display: 'flex', width: '100%', background: 'var(--border-color)', borderRadius: '6px', padding: '2px' }}>
        <button 
          style={{ 
            flex: 1, padding: '0.4rem', border: 'none', 
            background: paymentStatus === 'full' ? 'var(--bg-color)' : 'transparent', 
            color: paymentStatus === 'full' ? 'var(--text-color)' : 'var(--muted)',
            fontWeight: paymentStatus === 'full' ? 700 : 500, 
            borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem',
            boxShadow: paymentStatus === 'full' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
          onClick={() => setPaymentStatus('full')}
        >
          {t('fullPayment') || 'Full Payment'}
        </button>
        <button 
          style={{ 
            flex: 1, padding: '0.4rem', border: 'none', 
            background: paymentStatus === 'partial' ? 'var(--bg-color)' : 'transparent', 
            color: paymentStatus === 'partial' ? 'var(--text-color)' : 'var(--muted)',
            fontWeight: paymentStatus === 'partial' ? 700 : 500, 
            borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem',
            boxShadow: paymentStatus === 'partial' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
          onClick={() => setPaymentStatus('partial')}
        >
          {t('partialPayment') || 'Partial Payment'}
        </button>
      </div>

      {/* Payment Details Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
            {paymentStatus === 'partial' ? (t('amountPaidNow') || 'Amount Paid Now') : (t('amountReceived') || 'Amount Received')}
          </label>
          <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginTop: '2px' }}>
            <span style={{ padding: '0.5rem', background: 'var(--surface-color)', color: 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>EGP</span>
            <input 
              type="number"
              style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', fontWeight: 700, border: 'none', outline: 'none', width: '100%' }}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>
            
        {paymentStatus === 'partial' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>{t('remainingBalance') || 'Remaining Debt'}</span>
              <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '1rem' }}>EGP {remainingBalance.toFixed(2)}</span>
            </div>

            {guestDebtBlocked && (
              <div style={{ color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>{t('guestDebtError') || 'Guest customers cannot create debt. Select a customer.'}</span>
              </div>
            )}
          </>
        ) : (
          <>
            {changeAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>{t('change') || 'Change Due'}</span>
                <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1rem' }}>EGP {changeAmount.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>{error}</div>}
      {successMessage && <div style={{ color: 'var(--success)', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>{successMessage}</div>}

      <button 
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          fontWeight: 700,
          color: '#ffffff',
          background: canCheckout ? 'var(--primary)' : 'var(--muted)',
          border: 'none',
          borderRadius: '6px',
          cursor: canCheckout ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: canCheckout ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none',
          transition: 'all 0.2s',
        }}
        disabled={!canCheckout}
        onClick={handleCheckout}
      >
        {processing ? (
          <span>{t('processing') || 'Processing...'}</span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            <span>{t('checkout') || 'Complete Sale'}</span>
          </>
        )}
      </button>
    </div>
  );
}

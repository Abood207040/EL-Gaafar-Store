// src/pages/OrderSuccessPage.jsx
import { useLocalization } from '../i18n/Localization.jsx';

export default function OrderSuccessPage({ navigate }) {
  const { t } = useLocalization();

  return (
    <div className="order-success-page animate-fadeIn">
      <div className="order-success-card">
        <div className="success-icon" aria-hidden="true">✅</div>
        <h1>{t('orderPlacedTitle')}</h1>
        <p className="success-msg">
          {t('orderPlacedMessage')}
        </p>
        <div className="success-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('my-orders')}>
            {t('viewMyOrders')}
          </button>
          <button className="btn btn-outline" onClick={() => navigate('shop')}>
            {t('continueShopping')}
          </button>
        </div>
      </div>
    </div>
  );
}

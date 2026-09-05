import { useLocalization } from '../../i18n/Localization.jsx';

export default function OrderTrackingCta({ navigate }) {
  const { t } = useLocalization();

  return (
    <div className="showcase-card showcase-card-tracking">
      {/* Decorative Delivery & Route Art in Background */}
      <svg
        className="showcase-card-bg-art"
        viewBox="0 0 300 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M-10 180 C80 180 120 80 220 80 C270 80 300 120 320 140" stroke="#f67113" strokeWidth="2" strokeDasharray="6 8" opacity="0.35" />
        <circle cx="220" cy="80" r="18" stroke="#f67113" strokeWidth="1.5" strokeOpacity="0.3" />
        <circle cx="220" cy="80" r="38" stroke="#f67113" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2" />
        <circle cx="220" cy="80" r="5" fill="#f67113" />
      </svg>

      <div className="showcase-content-wrap">
        <div>
          <div className="showcase-header">
            <div className="showcase-badge showcase-badge-orange">
              <span className="pulse-dot pulse-dot-orange"></span>
              <span>{t('trackBadge')} • {t('deliveryAndPickup')}</span>
            </div>
            <div className="showcase-icon-box" style={{ background: 'rgba(246, 113, 19, 0.15)', border: '1px solid rgba(246, 113, 19, 0.3)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
          </div>

          <h3 className="showcase-title">
            {t('trackYourOrdersTitle') || t('alreadyPlacedOrder')}
          </h3>
          <p className="showcase-desc">
            {t('trackYourOrdersDesc') || t('myOrdersSubtitle')}
          </p>

          <div className="tracking-mini-ribbon">
            <div className="tracking-ribbon-step">
              <span className="tracking-ribbon-dot"></span>
              <span>{t('stepConfirmed')}</span>
            </div>
            <span className="tracking-ribbon-arrow">&rarr;</span>
            <div className="tracking-ribbon-step">
              <span className="tracking-ribbon-dot"></span>
              <span>{t('stepPreparing')}</span>
            </div>
            <span className="tracking-ribbon-arrow">&rarr;</span>
            <div className="tracking-ribbon-step">
              <span className="tracking-ribbon-dot"></span>
              <span>{t('stepDelivered')}</span>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="showcase-action-btn showcase-btn-orange"
            onClick={() => navigate && navigate('my-orders')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>{t('trackOrderBtnText') || t('trackYourOrder')}</span>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

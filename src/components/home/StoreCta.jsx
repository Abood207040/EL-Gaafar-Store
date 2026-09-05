import { useLocalization } from '../../i18n/Localization.jsx';

export default function StoreCta() {
  const { t } = useLocalization();

  return (
    <div className="showcase-card showcase-card-location">
      {/* Decorative Vector Map Art in Background */}
      <svg
        className="showcase-card-bg-art"
        viewBox="0 0 300 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M-20 60 H320 M-20 120 H320 M-20 180 H320" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        <path d="M60 -20 V260 M140 -20 V260 M220 -20 V260" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        <circle cx="220" cy="120" r="28" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.3" />
        <circle cx="220" cy="120" r="54" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.2" />
        <circle cx="220" cy="120" r="82" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="6 6" strokeOpacity="0.15" />
        <circle cx="220" cy="120" r="6" fill="#0ea5e9" />
      </svg>

      <div className="showcase-content-wrap">
        <div>
          <div className="showcase-header">
            <div className="showcase-badge showcase-badge-cyan">
              <span className="pulse-dot pulse-dot-green"></span>
              <span>{t('storeLocationBadge')} • {t('storeHours')}</span>
            </div>
            <div className="showcase-icon-box" style={{ background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>

          <h3 className="showcase-title">
            {t('visitOurStore')}
          </h3>
          <p className="showcase-desc">
            {t('visitOurStoreDesc') || t('storeLocationInfo')}
          </p>

          <div className="showcase-chips">
            <span className="showcase-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              </svg>
              {t('storeAddressText')}
            </span>
            <span className="showcase-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              {t('pickupFromShop')}
            </span>
          </div>
        </div>

        <div>
          <a
            href="https://maps.app.goo.gl/9QBeHgQukwjNaSr6A"
            target="_blank"
            rel="noopener noreferrer"
            className="showcase-action-btn showcase-btn-cyan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            <span>{t('openInGoogleMaps') || t('getDirections')}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

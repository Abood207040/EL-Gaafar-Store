import { useLocalization } from '../../i18n/Localization.jsx';

export default function HeroSection({ navigate }) {
  const { t } = useLocalization();

  return (
    <section className="hero-section" aria-label="Hero">
      <div className="container">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-kicker">{t('plumbingEssentials')}</span>
            <h1 className="hero-title">{t('everythingYouNeed')}</h1>
            <p className="hero-subtitle">{t('heroSubtitle')}</p>
            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('shop')}
              >
                {t('shopProducts')}
              </button>
              <button
                className="btn btn-outline btn-lg"
                onClick={() => {
                  const el = document.getElementById('category-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('exploreCategories')}
              </button>
            </div>
          </div>
          <div className="hero-media" aria-hidden="true">
            <img src="/images/Ga3for-logo.png" alt="Ga3for Logo" style={{ objectFit: 'contain', maxHeight: '400px', width: '100%' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

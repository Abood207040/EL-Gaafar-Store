import { useState, useEffect } from 'react';
import { useLocalization } from '../i18n/Localization.jsx';
import useCatalogOptions from '../hooks/useCatalogOptions.js';
import './categories.css';

export default function CategoriesPage({ navigate }) {
  const { t, language, isArabic } = useLocalization();
  const { categoryObjects, categoriesTableAvailable } = useCatalogOptions();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Artificial small delay to allow Supabase to fetch or to prevent flash
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [categoryObjects]);

  const displayCategories = (categoryObjects || []).filter(c => c.is_active);

  if (loading && displayCategories.length === 0) {
    return (
      <div className="categories-page animate-fadeIn">
        <CategoriesHero t={t} isArabic={isArabic} />
        <div className="container categories-container">
           <SkeletonGrid />
        </div>
      </div>
    );
  }

  if (!loading && (!categoriesTableAvailable || displayCategories.length === 0)) {
    return (
      <div className="categories-page animate-fadeIn">
         <CategoriesHero t={t} isArabic={isArabic} />
         <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="empty-state">
              <h3>{t('noCategories') || 'No Categories Available'}</h3>
              <p>{t('noCategoriesSub') || 'We are currently updating our catalog. Please check back soon.'}</p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="categories-page animate-fadeIn">
      <CategoriesHero t={t} isArabic={isArabic} />
      <div className="container categories-container">
         <div className="bento-grid">
           {displayCategories.map((cat, index) => {
             const name = language === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en;
             const isFeatured = index === 0; // First item is the featured hero
             
             // Extract actual image url or fallback
             const hasImage = Boolean(cat.image_url && cat.image_url.trim() !== '');

             return (
                <button 
                  key={cat.id} 
                  className={`bento-card ${isFeatured ? 'bento-featured' : ''}`}
                  onClick={() => navigate('shop', { category: cat.name_en })}
                  aria-label={`${t('explore') || 'Explore'} ${name}`}
                >
                   <div className="bento-image-wrapper">
                     {hasImage ? (
                       <img 
                         src={cat.image_url} 
                         alt={name} 
                         className="bento-image"
                         loading={isFeatured ? "eager" : "lazy"} 
                         onError={(e) => {
                           e.target.onerror = null; // prevent infinite loop
                           e.target.style.display = 'none';
                           e.target.nextElementSibling.style.display = 'flex';
                         }}
                       />
                     ) : null}
                     
                     {/* Fallback image shown if no image or image fails */}
                     <div 
                       className="bento-fallback-image" 
                       style={{ display: hasImage ? 'none' : 'flex' }}
                     >
                        <img src="/images/transparentlogo.png" alt="Ga3for" className="fallback-logo" />
                     </div>

                     <div className="bento-overlay"></div>
                   </div>
                   
                   <div className="bento-content">
                     <h3 className="bento-title">{name}</h3>
                     <div className="bento-cta">
                        {t('explore') || 'Explore'} 
                        <svg className="bento-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                     </div>
                   </div>
                </button>
             );
           })}
         </div>
      </div>
    </div>
  );
}

function CategoriesHero({ t, isArabic }) {
  return (
    <div className="categories-hero">
       <div className="container">
         <span className="hero-eyebrow">
           {isArabic ? 'معرض ومؤسسة الجعفر • أسوان' : 'Al-Jafar Store • Aswan Collection'}
         </span>
         <h1 className="hero-heading">
           {isArabic ? 'تصفح أقسام ومستلزمات السباكة' : (t('findWhatYouLookingFor') || 'Find What You’re Looking For')}
         </h1>
         <p className="hero-subheading">
           {isArabic 
             ? 'تشكيلة متكاملة من خلاطات المياه، المحابس، أطقم الحمامات، والمواسير بأعلى معايير المتانة في أسوان.' 
             : (t('categoriesHeroSub') || 'Browse through our extensive catalog of high-quality plumbing and sanitary supplies.')}
         </p>
       </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="bento-grid">
      <div className="bento-card bento-featured skeleton"></div>
      <div className="bento-card skeleton"></div>
      <div className="bento-card skeleton"></div>
      <div className="bento-card skeleton"></div>
    </div>
  );
}

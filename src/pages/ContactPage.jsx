import { useState } from 'react';
import { useLocalization } from '../i18n/Localization.jsx';
import { STORE_INFO } from '../constants/store.js';

export default function ContactPage({ navigate }) {
  const { t, isArabic } = useLocalization();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'general',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const googleMapsUrl = 'https://maps.app.goo.gl/9QBeHgQukwjNaSr6A';
  const whatsappNumber = STORE_INFO.whatsapp || '201000000000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    setSubmitted(true);
  };

  const handleSendWhatsapp = () => {
    const text = `مرحباً متجر الجعفر،\nالاسم: ${formData.name || 'عميل'}\nالهاتف: ${formData.phone || ''}\nنوع الاستفسار: ${formData.subject}\nالرسالة: ${formData.message || 'أود الاستفسار عن منتجاتكم'}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
  ];

  return (
    <div className="contact-page animate-fadeIn" style={{ paddingBottom: '4rem' }}>
      {/* Hero Header */}
      <section className="contact-hero" style={{
        background: 'linear-gradient(135deg, #09131d 0%, #112234 50%, #15293d 100%)',
        color: '#fff',
        padding: '3.5rem 0 3rem',
        borderBottom: '1px solid rgba(14, 165, 233, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background ambient lighting */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: isArabic ? 'auto' : '-10%',
          left: isArabic ? '-10%' : 'auto',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(14, 165, 233, 0.15)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem',
            letterSpacing: '0.02em'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
            <span>📍 {isArabic ? 'شركة الجعفر للأدوات الصحية • أسوان' : 'Al-Jafar Sanitary Ware • Aswan'}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 1rem 0', color: '#fff' }}>
            {t('contactUsTitle')}
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 auto' }}>
            {t('contactUsSubtitle')}
          </p>
        </div>
      </section>

      <div className="container" style={{ marginTop: '-2rem', position: 'relative', zIndex: 3 }}>
        {/* Top 4 Quick Info Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem'
        }}>
          {/* Card 1: Location */}
          <div className="card" style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#0f172a' }}>
                {t('showroomLocation')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5 }}>
                {t('showroomAddress')}
              </p>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            >
              <span>{t('openInGoogleMaps')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>

          {/* Card 2: WhatsApp */}
          <div className="card" style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {t('chatOnWhatsapp')}
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  {t('whatsappFastReply')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5 }}>
                {isArabic ? 'تواصل معنا مباشرة عبر محادثة واتساب السريعة' : 'Direct support and quotations via WhatsApp'}
              </p>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                background: '#16a34a',
                borderColor: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center'
              }}
            >
              <span>{t('chatOnWhatsapp')}</span>
              &rarr;
            </a>
          </div>

          {/* Card 3: Phone */}
          <div className="card" style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(246, 113, 19, 0.12)',
                color: '#f67113',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#0f172a' }}>
                {t('callUs')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5 }}>
                {t('customerSupportLine')}
              </p>
            </div>
            <a
              href={`tel:${STORE_INFO.phone || '+201000000000'}`}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            >
              <span>{STORE_INFO.phone || '+20 100 000 0000'}</span>
            </a>
          </div>

          {/* Card 4: Hours */}
          <div className="card" style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {t('workingHoursTitle')}
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  {t('openNow')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5 }}>
                {t('dailyHours')}
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
              {isArabic ? 'طوال أيام الأسبوع' : 'Open 7 days a week'}
            </div>
          </div>
        </div>

        {/* Main 2-Column Section: Form + Location & Benefits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '2rem',
          alignItems: 'start',
          marginBottom: '4rem'
        }}>
          {/* Form Column */}
          <div className="card" style={{
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            background: '#ffffff'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
              {t('getInTouch')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>
              {t('getInTouchDesc')}
            </p>

            {submitted ? (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1.75rem',
                textAlign: 'center',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#15803d', margin: '0 0 0.5rem 0' }}>
                  {t('messageSentSuccess')}
                </h3>
                <p style={{ color: '#166534', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
                  {t('messageSentDesc')}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', phone: '', email: '', subject: 'general', message: '' });
                    }}
                  >
                    {isArabic ? 'إرسال رسالة أخرى' : 'Send another message'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('shop')}
                  >
                    {t('shopProducts')} &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">{t('yourName')} *</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    className="input"
                    placeholder={isArabic ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-phone">{t('yourPhone')} *</label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      className="input"
                      placeholder={isArabic ? '010XXXXXXXX' : '+20 10...'}
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">{t('yourEmail')}</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="input"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-subject">{t('inquiryType')}</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    className="select"
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="general">{t('inquiryGeneral')}</option>
                    <option value="wholesale">{t('inquiryWholesale')}</option>
                    <option value="order">{t('inquiryOrder')}</option>
                    <option value="maintenance">{t('inquiryMaintenance')}</option>
                    <option value="other">{t('inquiryOther')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">{t('yourMessage')} *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows="4"
                    className="input"
                    style={{ resize: 'vertical' }}
                    placeholder={t('yourMessage')}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: '160px' }}>
                    {t('sendMessage')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleSendWhatsapp}
                    style={{
                      borderColor: '#16a34a',
                      color: '#16a34a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>💬 {t('sendViaWhatsapp')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Showroom Info & Map Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Showroom Interactive Card */}
            <div className="card" style={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              background: '#ffffff'
            }}>
              {/* Map Preview Header */}
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Visual grid lines */}
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
                  viewBox="0 0 300 200"
                  fill="none"
                >
                  <path d="M0 50 H300 M0 100 H300 M0 150 H300" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 6" />
                  <path d="M50 0 V200 M150 0 V200 M250 0 V200" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 6" />
                </svg>

                {/* Pulsing Pin Marker */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#0ea5e9',
                    boxShadow: '0 0 24px rgba(14, 165, 233, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    animation: 'bounce 2s infinite'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <span style={{
                    marginTop: '0.5rem',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {isArabic ? 'شركة الجعفر للأدوات الصحية' : 'Al-Jafar Store - Aswan'}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                  {isArabic ? 'زيارة المعرض واستلام الطلبات' : 'Showroom Visit & Order Pickup'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  {isArabic 
                    ? 'يسعدنا استقبالكم في معرضنا الرئيسي بمحافظة أسوان لمعاينة أحدث أطقم وخلاطات ومستلزمات السباكة والري وعزل المياه.'
                    : 'We welcome you to visit our primary showroom in Aswan to inspect the latest plumbing, sanitary ware, and drainage fixtures.'}
                </p>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                  </svg>
                  <span>{t('openInGoogleMaps')}</span>
                </a>
              </div>
            </div>

            {/* Value Highlights */}
            <div className="card" style={{
              padding: '1.5rem',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
                {isArabic ? 'لماذا يختار عملاؤنا متجر الجعفر؟' : 'Why Choose Al-Jafar Store?'}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#475569' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                  <span>{isArabic ? 'استشارات فنية مجانية لاختيار قطع السباكة المناسبة لمشروعك' : 'Free expert guidance to pick the right plumbing specs'}</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                  <span>{isArabic ? 'شحن وتوصيل فوري لجميع مناطق أسوان مع إمكانية المعاينة' : 'Fast delivery across Aswan with inspection on arrival'}</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                  <span>{isArabic ? 'أسعار جملة تنافسية للمقاولين والشركات وأصحاب المشروعات' : 'Special contractor and wholesale quotation tiers'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
              {t('faqTitle')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.925rem', margin: 0 }}>
              {t('faqSubtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      textAlign: isArabic ? 'right' : 'left',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: isOpen ? 'var(--accent)' : '#0f172a',
                      gap: '1rem'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.85rem'
                    }}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 1.25rem 1.25rem',
                      color: '#64748b',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <p style={{ margin: '0.75rem 0 0 0' }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

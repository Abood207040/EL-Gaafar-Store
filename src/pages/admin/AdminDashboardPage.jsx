export default function AdminDashboardPage({ navigate }) {

  return (
    <div className="admin-page animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
          Welcome back to Al-Jafar Store
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
          Select a management module to continue
        </p>
      </div>

      <div className="mega-hub-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
        gap: '1.5rem', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        width: '100%' 
      }}>
        {/* MEGA ICON 1: WEBSITE */}
        <button 
          className="card mega-hub-card" 
          onClick={() => navigate('admin-online-dashboard')}
          style={{ padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid var(--border-color)', background: 'var(--card-bg)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Website</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage online orders, e-commerce catalog, and online customer data.</p>
        </button>

        {/* MEGA ICON 2: STORE */}
        <button 
          className="card mega-hub-card" 
          onClick={() => navigate('admin-pos')}
          style={{ padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid var(--border-color)', background: 'var(--card-bg)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Store</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Physical point of sale, cashier dashboard, and in-store sales history.</p>
        </button>

        {/* MEGA ICON 3: STORAGE */}
        <button 
          className="card mega-hub-card" 
          onClick={() => navigate('admin-inventory')}
          style={{ padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid var(--border-color)', background: 'var(--card-bg)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Storage</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage warehouse inventory, track stock movements, and restocking.</p>
        </button>
      </div>
    </div>
  );
}

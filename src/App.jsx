// src/App.jsx
import { useState } from 'react';
import './styles/globals.css';
import './App.css';

// Layout
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

// Pages – Shop
import ShopPage from './pages/ShopPage.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';

// Pages – Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminProductFormPage from './pages/admin/AdminProductFormPage.jsx';
import AdminCatalogPage from './pages/admin/AdminCatalogPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminInventoryPage from './pages/admin/AdminInventoryPage.jsx';
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminAccessDeniedPage from './pages/admin/AdminAccessDeniedPage.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useLocalization } from './i18n/Localization.jsx';

const ADMIN_PAGES = new Set([
  'admin-dashboard', 'admin-products', 'admin-product-form',
  'admin-catalog', 'admin-orders', 'admin-inventory', 'admin-customers',
]);
const PUBLIC_PAGES = new Set([
  'shop',
  'product-details',
  'cart',
  'checkout',
  'order-success',
  'my-orders',
  'order-details',
  'admin-login',
]);
const ALL_PAGES = new Set([...ADMIN_PAGES, ...PUBLIC_PAGES]);

function App() {
  const { user, isAdmin, loading, adminMessage, authError } = useAuth();
  const { t } = useLocalization();
  const [currentPage, setCurrentPage] = useState('shop');
  const [pageData, setPageData] = useState(null); // for product/order being viewed
  const [cart, setCart] = useState([]);

  // Navigate with optional data payload
  const navigate = (page, data = null) => {
    setCurrentPage(ALL_PAGES.has(page) ? page : 'shop');
    setPageData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: Math.min(item.qty + qty, product.stock) }
            : item
        );
      }
      return [...prev, { product, qty }];
    });
  };

  const updateCartQty = (productId, qty) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, qty } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const isAdminPage = ADMIN_PAGES.has(currentPage);

  // Render admin pages inside AdminLayout
  if (isAdminPage) {
    if (loading && !user) {
      return (
        <div className="admin-auth-page">
          <div className="container-sm">
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'var(--muted)' }}>{t('loadingAdminAuth')}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!user) {
      return <AdminLoginPage navigate={navigate} />;
    }

    if (!isAdmin) {
      return <AdminAccessDeniedPage navigate={navigate} message={authError || adminMessage} />;
    }

    let adminContent;
    switch (currentPage) {
      case 'admin-dashboard':
        adminContent = <AdminDashboardPage navigate={navigate} />;
        break;
      case 'admin-products':
        adminContent = <AdminProductsPage navigate={navigate} />;
        break;
      case 'admin-product-form':
        adminContent = <AdminProductFormPage navigate={navigate} product={pageData?.product || null} />;
        break;
      case 'admin-catalog':
        adminContent = <AdminCatalogPage navigate={navigate} />;
        break;
      case 'admin-orders':
        adminContent = <AdminOrdersPage navigate={navigate} />;
        break;
      case 'admin-inventory':
        adminContent = <AdminInventoryPage navigate={navigate} />;
        break;
      case 'admin-customers':
        adminContent = <AdminCustomersPage navigate={navigate} />;
        break;
      default:
        adminContent = <AdminDashboardPage navigate={navigate} />;
    }
    return (
      <AdminLayout currentPage={currentPage} navigate={navigate}>
        {adminContent}
      </AdminLayout>
    );
  }

  // Public pages
  let pageContent;
  switch (currentPage) {
    case 'admin-login':
      if (loading && !user) {
        pageContent = (
          <div className="admin-auth-page">
            <div className="container-sm">
              <div className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--muted)' }}>{t('loadingAdminAuth')}</p>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (!user) {
        pageContent = <AdminLoginPage navigate={navigate} />;
      } else if (!isAdmin) {
        pageContent = <AdminAccessDeniedPage navigate={navigate} message={authError || adminMessage} />;
      } else {
        pageContent = (
          <AdminLayout currentPage="admin-dashboard" navigate={navigate}>
            <AdminDashboardPage navigate={navigate} />
          </AdminLayout>
        );
      }
      break;
    case 'shop':
      pageContent = (
        <ShopPage
          onAddToCart={addToCart}
          navigate={navigate}
        />
      );
      break;
    case 'product-details':
      pageContent = (
        <ProductDetailsPage
          product={pageData}
          navigate={navigate}
          onAddToCart={addToCart}
        />
      );
      break;
    case 'cart':
      pageContent = (
        <CartPage
          cartItems={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          navigate={navigate}
        />
      );
      break;
    case 'checkout':
      pageContent = (
        <CheckoutPage
          cartItems={cart}
          navigate={navigate}
          onPlaceOrder={clearCart}
          initialFulfillment={pageData?.fulfillment}
        />
      );
      break;
    case 'order-success':
      pageContent = <OrderSuccessPage navigate={navigate} order={pageData?.order || null} />;
      break;
    case 'my-orders':
      pageContent = <MyOrdersPage navigate={navigate} initialLookup={pageData?.lookup || ''} />;
      break;
    case 'order-details':
      pageContent = <OrderDetailsPage order={pageData?.order || pageData} navigate={navigate} />;
      break;
    default:
      pageContent = (
        <ShopPage
          onAddToCart={addToCart}
          navigate={navigate}
        />
      );
  }

  return (
    <div className="page-layout">
      <Navbar currentPage={currentPage} navigate={navigate} cartCount={cartCount} />
      <main className="page-content" id="main-content">
        {pageContent}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

export default App;

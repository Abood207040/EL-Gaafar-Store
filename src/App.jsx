// src/App.jsx
import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './styles/globals.css';
import './App.css';

// Layout
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

// Pages – Shop
import HomePage from './pages/HomePage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';
import LoginPage from './pages/account/LoginPage.jsx';
import RegisterPage from './pages/account/RegisterPage.jsx';
import AccountDashboard from './pages/account/AccountDashboard.jsx';
import ContactPage from './pages/ContactPage.jsx';

// Pages – Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminOnlineDashboardPage from './pages/admin/AdminOnlineDashboardPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminProductFormPage from './pages/admin/AdminProductFormPage.jsx';
import AdminCatalogPage from './pages/admin/AdminCatalogPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminInventoryPage from './pages/admin/AdminInventoryPage.jsx';
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminAccessDeniedPage from './pages/admin/AdminAccessDeniedPage.jsx';
import AdminPosPage from './pages/admin/offline/AdminPosPage.jsx';
import AdminOfflineSalesPage from './pages/admin/offline/AdminOfflineSalesPage.jsx';
import CustomerDebtPage from './pages/admin/offline/CustomerDebtPage.jsx';
import AdminReturnsPage from './pages/admin/offline/AdminReturnsPage.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useLocalization } from './i18n/Localization.jsx';



const CART_STORAGE_KEY = 'al-jafar-cart';

function loadCartFromStorage() {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function AdminRoute({ children, navigateShim }) {
  const { user, isAdmin, loading, adminMessage, authError } = useAuth();
  const { t } = useLocalization();
  const location = useLocation();

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
    return <AdminLoginPage navigate={navigateShim} />;
  }

  if (!isAdmin) {
    return <AdminAccessDeniedPage navigate={navigateShim} message={authError || adminMessage} />;
  }

  // Use the current pathname for currentPage prop mapping
  let currentPage = 'admin-dashboard';
  if (location.pathname.includes('/online-dashboard')) currentPage = 'admin-online-dashboard';
  else if (location.pathname.includes('/products/new') || location.pathname.match(/\/products\/[^/]+/)) currentPage = 'admin-product-form';
  else if (location.pathname.includes('/products')) currentPage = 'admin-products';
  else if (location.pathname.includes('/catalog')) currentPage = 'admin-catalog';
  else if (location.pathname.includes('/orders')) currentPage = 'admin-orders';
  else if (location.pathname.includes('/inventory')) currentPage = 'admin-inventory';
  else if (location.pathname.includes('/customers')) currentPage = 'admin-customers';
  else if (location.pathname.includes('/pos')) currentPage = 'admin-pos';
  else if (location.pathname.includes('/offline-sales')) currentPage = 'admin-offline-sales';
  else if (location.pathname.includes('/customer-debts')) currentPage = 'admin-customer-debts';
  else if (location.pathname.includes('/returns')) currentPage = 'admin-returns';

  return (
    <AdminLayout currentPage={currentPage} navigate={navigateShim}>
      {children}
    </AdminLayout>
  );
}

function App() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  
  const [pageData, setPageData] = useState(null); // preserved for legacy pass-through
  const [cart, setCart] = useState(loadCartFromStorage);

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, [cart]);

  // Shim to map old navigate(page, data) to URL routes
  const navigate = (page, data = null) => {
    setPageData(data); // optionally keep it in state for legacy props
    if (page === 'product-details') routerNavigate(`/product/${data?.id || data?.product?.id || data}`, { state: { product: data?.product || data } });
    else if (page === 'cart') routerNavigate('/cart');
    else if (page === 'checkout') routerNavigate('/checkout', { state: { fulfillment: data?.fulfillment } });
    else if (page === 'order-success') routerNavigate('/order-success', { state: { order: data?.order } });
    else if (page === 'my-orders') routerNavigate('/orders', { state: { lookup: data?.lookup } });
    else if (page === 'order-details') routerNavigate(`/order/${data?.order?.orderNumber || data?.orderNumber || data?.id || data}`, { state: { order: data?.order || data } });
    else if (page === 'login') routerNavigate('/account/login');
    else if (page === 'register') routerNavigate('/account/register');
    else if (page === 'account') routerNavigate('/account');
    else if (page === 'home') routerNavigate('/');
    else if (page === 'categories') routerNavigate('/categories');
    else if (page === 'contact') routerNavigate('/contact');
    else if (page === 'shop') {
      if (data?.category) routerNavigate(`/shop?category=${encodeURIComponent(data.category)}`);
      else routerNavigate('/shop');
    }
    
    // Admin routes
    else if (page === 'admin-dashboard') routerNavigate('/admin');
    else if (page === 'admin-online-dashboard') routerNavigate('/admin/online-dashboard');
    else if (page === 'admin-products') routerNavigate('/admin/products');
    else if (page === 'admin-product-form') {
      if (data?.product) routerNavigate(`/admin/products/${data.product.id}`, { state: { product: data.product }});
      else routerNavigate('/admin/products/new');
    }
    else if (page === 'admin-catalog') routerNavigate('/admin/catalog');
    else if (page === 'admin-orders') routerNavigate('/admin/orders');
    else if (page === 'admin-inventory') routerNavigate('/admin/inventory');
    else if (page === 'admin-customers') routerNavigate('/admin/customers');
    else if (page === 'admin-pos') routerNavigate('/admin/pos');
    else if (page === 'admin-offline-sales') routerNavigate('/admin/offline-sales');
    else if (page === 'admin-returns') routerNavigate('/admin/returns');
    else if (page === 'admin-customer-debts') routerNavigate('/admin/customer-debts');
    else if (page === 'admin-login') routerNavigate('/admin/login');
    else routerNavigate('/');
    
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

  // Derive currentPage roughly for Navbar highlights
  let currentNavPage = 'shop'; // fallback
  if (location.pathname === '/') currentNavPage = 'home';
  else if (location.pathname === '/shop') currentNavPage = 'shop';
  else if (location.pathname === '/categories') currentNavPage = 'categories';
  else if (location.pathname === '/contact') currentNavPage = 'contact';
  else if (location.pathname === '/orders') currentNavPage = 'my-orders';
  else if (location.pathname === '/cart') currentNavPage = 'cart';
  else if (location.pathname === '/checkout') currentNavPage = 'checkout';
  else if (location.pathname.startsWith('/account')) currentNavPage = 'account';
  else if (location.pathname.startsWith('/admin')) currentNavPage = 'admin-dashboard';

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="page-layout">
      {!isAdminRoute && <Navbar currentPage={currentNavPage} navigate={navigate} cartCount={cartCount} />}
      <main 
        className="page-content" 
        id="main-content"
        style={isAdminRoute ? { paddingTop: 0 } : {}}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage onAddToCart={addToCart} navigate={navigate} />} />
          <Route path="/categories" element={<CategoriesPage navigate={navigate} />} />
          <Route path="/contact" element={<ContactPage navigate={navigate} />} />
          <Route path="/shop" element={<ShopPage onAddToCart={addToCart} navigate={navigate} />} />
          <Route path="/product/:id" element={<ProductDetailsPage product={pageData} navigate={navigate} onAddToCart={addToCart} />} />
          <Route path="/cart" element={<CartPage cartItems={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} navigate={navigate} />} />
          <Route path="/checkout" element={<CheckoutPage cartItems={cart} navigate={navigate} onPlaceOrder={clearCart} initialFulfillment={pageData?.fulfillment} />} />
          <Route path="/order-success" element={<OrderSuccessPage navigate={navigate} order={pageData?.order || null} />} />
          <Route path="/orders" element={<MyOrdersPage navigate={navigate} initialLookup={pageData?.lookup || ''} />} />
          <Route path="/order/:id" element={<OrderDetailsPage order={pageData?.order || pageData} navigate={navigate} />} />
          <Route path="/account/login" element={<LoginPage navigate={navigate} />} />
          <Route path="/account/register" element={<RegisterPage navigate={navigate} />} />
          <Route path="/account" element={<AccountDashboard navigate={navigate} />} />
          
          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLoginPage navigate={navigate} />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute navigateShim={navigate}><AdminDashboardPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/online-dashboard" element={<AdminRoute navigateShim={navigate}><AdminOnlineDashboardPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute navigateShim={navigate}><AdminProductsPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/products/new" element={<AdminRoute navigateShim={navigate}><AdminProductFormPage navigate={navigate} product={pageData?.product || null} /></AdminRoute>} />
          <Route path="/admin/products/:id" element={<AdminRoute navigateShim={navigate}><AdminProductFormPage navigate={navigate} product={pageData?.product || null} /></AdminRoute>} />
          <Route path="/admin/catalog" element={<AdminRoute navigateShim={navigate}><AdminCatalogPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute navigateShim={navigate}><AdminOrdersPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute navigateShim={navigate}><AdminInventoryPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/customers" element={<AdminRoute navigateShim={navigate}><AdminCustomersPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/pos" element={<AdminRoute navigateShim={navigate}><AdminPosPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/offline-sales" element={<AdminRoute navigateShim={navigate}><AdminOfflineSalesPage navigate={navigate} /></AdminRoute>} />
          <Route path="/admin/customer-debts" element={<AdminRoute navigateShim={navigate}><CustomerDebtPage /></AdminRoute>} />
          <Route path="/admin/returns" element={<AdminRoute navigateShim={navigate}><AdminReturnsPage navigate={navigate} /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer navigate={navigate} />}
    </div>
  );
}

export default App;

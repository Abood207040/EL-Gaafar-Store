// src/components/layout/AdminLayout.jsx
import AdminSidebar from '../admin/AdminSidebar.jsx';
import AdminHeader from '../admin/AdminHeader.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminLayout({ currentPage, navigate, children }) {
  const { t } = useLocalization();
  const PAGE_TITLES = {
    'admin-dashboard': { title: t('adminDashboard'), subtitle: t('adminDashboardSub') },
    'admin-products': { title: t('adminProducts'), subtitle: t('adminProductsSub') },
    'admin-product-form': { title: t('adminProductForm'), subtitle: t('adminProductFormSub') },
    'admin-catalog': { title: t('adminCatalog'), subtitle: t('adminCatalogSub') },
    'admin-orders': { title: t('adminOrders'), subtitle: t('adminOrdersSub') },
    'admin-inventory': { title: t('adminInventory'), subtitle: t('adminInventorySub') },
    'admin-customers': { title: t('adminCustomers'), subtitle: t('adminCustomersSub') },
  };
  const { title, subtitle } = PAGE_TITLES[currentPage] || { title: 'Admin', subtitle: '' };

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage={currentPage} navigate={navigate} />
      <div className="admin-content">
        <AdminHeader title={title} subtitle={subtitle} navigate={navigate} />
        <main className="admin-main" id="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

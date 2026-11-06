// src/components/layout/AdminLayout.jsx
import { useState } from 'react';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import AdminHeader from '../admin/AdminHeader.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminLayout({ currentPage, navigate, children }) {
  const { t } = useLocalization();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const PAGE_TITLES = {
    'admin-dashboard': { title: t('adminHub'), subtitle: t('adminHubSub') },
    'admin-online-dashboard': { title: t('adminDashboard'), subtitle: t('adminDashboardSub') },
    'admin-products': { title: t('adminProducts'), subtitle: t('adminProductsSub') },
    'admin-product-form': { title: t('adminProductForm'), subtitle: t('adminProductFormSub') },
    'admin-catalog': { title: t('adminCatalog'), subtitle: t('adminCatalogSub') },
    'admin-orders': { title: t('adminOrders'), subtitle: t('adminOrdersSub') },
    'admin-inventory': { title: t('adminInventory'), subtitle: t('adminInventorySub') },
    'admin-customers': { title: t('adminCustomers'), subtitle: t('adminCustomersSub') },
    'admin-delivery': { title: t('deliveryManagement'), subtitle: t('deliveryManagementSub') },
    'admin-pos': { title: t('posNewSale'), subtitle: t('posSubtitle') },
    'admin-offline-sales': { title: t('offlineSalesTitle'), subtitle: t('offlineSalesSub') },
    'admin-customer-debts': { title: t('customerDebtsTitle'), subtitle: t('customerDebtsSub') },
    'admin-returns': { title: t('returnsTitle'), subtitle: t('returnsSub') },
  };
  const { title, subtitle } = PAGE_TITLES[currentPage] || { title: t('admin'), subtitle: '' };

  return (
    <div className="admin-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="admin-sidebar-backdrop animate-fadeIn" 
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <AdminSidebar 
        currentPage={currentPage} 
        navigate={navigate} 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="admin-content">
        <AdminHeader 
          title={title} 
          subtitle={subtitle} 
          navigate={navigate} 
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />
        <main className="admin-main" id="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

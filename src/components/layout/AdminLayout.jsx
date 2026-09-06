// src/components/layout/AdminLayout.jsx
import { useState } from 'react';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import AdminHeader from '../admin/AdminHeader.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminLayout({ currentPage, navigate, children }) {
  const { t } = useLocalization();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const PAGE_TITLES = {
    'admin-dashboard': { title: t('adminPanel'), subtitle: 'Choose a management module' },
    'admin-online-dashboard': { title: t('adminDashboard'), subtitle: t('adminDashboardSub') },
    'admin-products': { title: t('adminProducts'), subtitle: t('adminProductsSub') },
    'admin-product-form': { title: t('adminProductForm'), subtitle: t('adminProductFormSub') },
    'admin-catalog': { title: t('adminCatalog'), subtitle: t('adminCatalogSub') },
    'admin-orders': { title: t('adminOrders'), subtitle: t('adminOrdersSub') },
    'admin-inventory': { title: t('adminInventory'), subtitle: t('adminInventorySub') },
    'admin-customers': { title: t('adminCustomers'), subtitle: t('adminCustomersSub') },
    'admin-delivery': { title: t('deliveryManagement') || 'Delivery Management', subtitle: 'Manage rates, governorates & areas' },
    'admin-pos': { title: 'Point of Sale (POS)', subtitle: 'Cashier terminal & in-store sales' },
    'admin-offline-sales': { title: 'Offline Sales History', subtitle: 'In-store sales receipts' },
    'admin-customer-debts': { title: 'Customer Debts', subtitle: 'Outstanding balances & payments' },
    'admin-returns': { title: 'Returns & Refunds', subtitle: 'Process in-store returns' },
  };
  const { title, subtitle } = PAGE_TITLES[currentPage] || { title: 'Admin', subtitle: '' };

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

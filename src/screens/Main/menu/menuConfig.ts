import {Alert} from 'react-native';

import {NavigationService} from '../../../registries/NavigationService';

import {MenuItem} from './menuTypes';
// Import các modal components
import {HelpModal} from '../modals/HelpModal';
import {FeedbackModal} from '../modals/FeedbackModal';
// import {BackupModal} from './modals/BackupModal';
// import {SyncModal} from './modals/SyncModal';

// thuc hien logou nhe
import {store, logout} from '../../../store';

import {StorageService, STORAGE_KEYS} from '../../../utils';

// Helper functions cho menu actions
const showLogoutConfirm = () => {
  Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
    {text: 'Hủy', style: 'cancel'},
    {
      text: 'Đăng xuất',
      style: 'destructive',
      onPress: async () => {
        store.dispatch(logout());
        // Xóa session đăng nhập để login lại từ đầu
        console.log('Deleting Session from AsyncStorage...');
        await StorageService.removeKey(STORAGE_KEYS.USER_SESSION);
        // Handle logout logic
        NavigationService.resetToScreen('Home');
      },
    },
  ]);
};

const showBackupConfirm = () => {
  Alert.alert('Sao lưu dữ liệu', 'Bạn có muốn sao lưu dữ liệu ngay bây giờ?', [
    {text: 'Hủy', style: 'cancel'},
    {
      text: 'Sao lưu',
      onPress: () => {
        // Handle backup logic
        // NavigationService.navigate('BackupRestoreScreen');
      },
    },
  ]);
};

export const menuConfig: MenuItem[] = [
  // ✅ 1. DASHBOARD - Tổng quan hệ thống
  {
    id: 'dashboard',
    name: 'menu.dashboard.title',
    icon: 'dashboard',
    screen: 'Dashboard',
    level: 1,
    order: 1,
    navigationType: 'internal',
    permissions: ['*'],
    group: 'main',
  },

  // ✅ 2. BÁN HÀNG - Chức năng POS chính
  {
    id: 'pos',
    name: 'menu.pos.title',
    icon: 'point-of-sale',
    level: 1,
    order: 2,
    permissions: ['*'],
    group: 'main',
    children: [
      {
        id: 'pos-main',
        name: 'menu.pos.mainPos',
        icon: 'shopping-cart',
        screen: 'POSScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'pos-cart',
        name: 'menu.pos.cart',
        icon: 'shopping-basket',
        screen: 'CartScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'pos-scanner',
        name: 'menu.pos.scanner',
        icon: 'qr-code-scanner',
        screen: 'QRScannerScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'pos-payment',
        name: 'menu.pos.payment.title',
        icon: 'payment',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'payment-methods',
            name: 'menu.pos.payment.methods',
            icon: 'credit-card',
            screen: 'PaymentMethodScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'payment-qr',
            name: 'menu.pos.payment.qrCode',
            icon: 'qr-code',
            screen: 'QRCodePaymentScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'payment-status',
            name: 'menu.pos.payment.status',
            icon: 'receipt',
            screen: 'PaymentStatusScreen',
            level: 3,
            permissions: ['*'],
          },
        ],
      },
    ],
  },

  // ✅ 3. QUẢN LÝ SẢN PHẨM & KHO
  {
    id: 'inventory',
    name: 'menu.inventory.title',
    icon: 'inventory',
    level: 1,
    order: 3,
    permissions: ['*'],
    group: 'main',
    children: [
      {
        id: 'products',
        name: 'menu.inventory.products.title',
        icon: 'category',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'product-list',
            name: 'menu.inventory.products.list',
            icon: 'list',
            screen: 'ProductListScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'product-create',
            name: 'menu.inventory.products.create',
            icon: 'add-box',
            screen: 'ProductCreateScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'product-search',
            name: 'menu.inventory.products.search',
            icon: 'search',
            screen: 'ProductSearchScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'product-variants',
            name: 'menu.inventory.products.variants',
            icon: 'tune',
            screen: 'VariantScreen',
            level: 3,
            permissions: ['*'],
          },
        ],
      },
      {
        id: 'categories',
        name: 'menu.inventory.categories.title',
        icon: 'folder',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'category-list',
            name: 'menu.inventory.categories.list',
            icon: 'format-list-bulleted',
            screen: 'Categories',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'category-images',
            name: 'menu.inventory.categories.images',
            icon: 'photo-library',
            screen: 'Photo',
            level: 3,
            permissions: ['*'],
          },
        ],
      },
      {
        id: 'stock-management',
        name: 'menu.inventory.stock.title',
        icon: 'warehouse',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'stock-dashboard',
            name: 'menu.inventory.stock.dashboard',
            icon: 'dashboard',
            screen: 'InventoryDashboardScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'stock-in',
            name: 'menu.inventory.stock.stockIn',
            icon: 'move-to-inbox',
            screen: 'StockInScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'stock-out',
            name: 'menu.inventory.stock.stockOut',
            icon: 'outbox',
            screen: 'StockOutScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'stock-transfer',
            name: 'menu.inventory.stock.transfer',
            icon: 'swap-horiz',
            screen: 'TransferStockScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'inventory-report',
            name: 'menu.inventory.stock.report',
            icon: 'assessment',
            screen: 'InventoryReportScreen',
            level: 3,
            permissions: ['*'],
          },
        ],
      },
    ],
  },

  // ✅ 4. QUẢN LÝ ĐƠN HÀNG
  {
    id: 'orders',
    name: 'menu.orders.title',
    icon: 'receipt-long',
    level: 1,
    order: 4,
    permissions: ['*'],
    group: 'main',
    children: [
      {
        id: 'order-list',
        name: 'menu.orders.list',
        icon: 'list-alt',
        screen: 'OrderListScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'order-detail',
        name: 'menu.orders.detail',
        icon: 'description',
        screen: 'OrderDetailScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'invoices',
        name: 'menu.orders.invoices',
        icon: 'receipt',
        screen: 'InvoiceScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'payment-history',
        name: 'menu.orders.paymentHistory',
        icon: 'history',
        screen: 'PaymentHistoryScreen',
        level: 2,
        permissions: ['*'],
      },
    ],
  },

  // ✅ 5. QUẢN LÝ KHÁCH HÀNG (CRM)
  {
    id: 'customers',
    name: 'menu.customers.title',
    icon: 'people',
    level: 1,
    order: 5,
    permissions: ['*'],
    group: 'main',
    children: [
      {
        id: 'customer-list',
        name: 'menu.customers.list',
        icon: 'contacts',
        screen: 'CustomerListScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'customer-detail',
        name: 'menu.customers.detail',
        icon: 'person',
        screen: 'CustomerDetailScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'loyalty',
        name: 'menu.customers.loyalty',
        icon: 'star',
        screen: 'LoyaltyScreen',
        level: 2,
        permissions: ['*'],
      },
    ],
  },

  // ✅ 6. BÁO CÁO & PHÂN TÍCH
  {
    id: 'reports',
    name: 'menu.reports.title',
    icon: 'assessment',
    level: 1,
    order: 6,
    permissions: ['*'],
    group: 'analytics',
    children: [
      {
        id: 'sales-reports',
        name: 'menu.reports.sales.title',
        icon: 'trending-up',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'sales-dashboard',
            name: 'menu.reports.sales.dashboard',
            icon: 'dashboard',
            screen: 'SalesReportScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'daily-sales',
            name: 'menu.reports.sales.daily',
            icon: 'today',
            screen: 'DailySalesScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'monthly-sales',
            name: 'menu.reports.sales.monthly',
            icon: 'date-range',
            screen: 'MonthlySalesScreen',
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'yearly-sales',
            name: 'menu.reports.sales.yearly',
            icon: 'event-note',
            screen: 'YearlySalesScreen',
            level: 3,
            permissions: ['*'],
          },
        ],
      },
      {
        id: 'financial-reports',
        name: 'menu.reports.financial.title',
        icon: 'account-balance',
        level: 2,
        permissions: ['manager', 'admin'],
        children: [
          {
            id: 'cash-flow',
            name: 'menu.reports.financial.cashFlow',
            icon: 'monetization-on',
            screen: 'CashFlowReportScreen',
            level: 3,
            permissions: ['manager', 'admin'],
          },
          {
            id: 'accounting',
            name: 'menu.reports.financial.accounting',
            icon: 'account-balance-wallet',
            screen: 'AccountingScreen',
            level: 3,
            permissions: ['manager', 'admin'],
          },
          {
            id: 'tax-management',
            name: 'menu.reports.financial.taxManagement',
            icon: 'receipt',
            screen: 'TaxManagementScreen',
            level: 3,
            permissions: ['manager', 'admin'],
          },
        ],
      },
    ],
  },

  // ✅ 7. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
  {
    id: 'users',
    name: 'menu.users.title',
    icon: 'manage-accounts',
    level: 1,
    order: 7,
    permissions: ['manager', 'admin'],
    group: 'admin',
    children: [
      {
        id: 'user-management',
        name: 'menu.users.management',
        icon: 'people',
        screen: 'UserManagementScreen',
        level: 2,
        permissions: ['manager', 'admin'],
      },
      {
        id: 'user-profile',
        name: 'menu.users.profile',
        icon: 'account-circle',
        screen: 'UserProfileScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'role-assignment',
        name: 'menu.users.roleAssignment',
        icon: 'admin-panel-settings',
        screen: 'RoleAssignmentScreen',
        level: 2,
        permissions: ['admin'],
      },
      {
        id: 'permission-matrix',
        name: 'menu.users.permissionMatrix',
        icon: 'grid-on',
        screen: 'PermissionMatrixScreen',
        level: 2,
        permissions: ['admin'],
      },
    ],
  },

  // ✅ 8. CÀI ĐẶT HỆ THỐNG
  {
    id: 'settings',
    name: 'menu.settings.title',
    icon: 'settings',
    level: 1,
    order: 8,
    permissions: ['*'],
    group: 'system',
    children: [
      {
        id: 'store-settings',
        name: 'menu.settings.store.title',
        icon: 'store',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'store-config',
            name: 'menu.settings.store.config',
            icon: 'settings',
            screen: 'StoreSettingsScreen',
            level: 3,
            permissions: ['manager', 'admin'],
          },
          {
            id: 'enterprise-settings',
            name: 'menu.settings.store.enterprise',
            icon: 'business',
            screen: 'EnterpriseSettingsScreen',
            level: 3,
            permissions: ['admin'],
          },
          {
            id: 'branch-list',
            name: 'menu.settings.store.branches',
            icon: 'account-tree',
            screen: 'BranchListScreen',
            level: 3,
            permissions: ['admin'],
          },
        ],
      },
      {
        id: 'system-config',
        name: 'menu.settings.system.title',
        icon: 'build',
        level: 2,
        permissions: ['admin'],
        children: [
          {
            id: 'system-general',
            name: 'menu.settings.system.general',
            icon: 'tune',
            screen: 'SystemConfigScreen',
            level: 3,
            permissions: ['admin'],
          },
          {
            id: 'theme-language',
            name: 'menu.settings.system.themeLanguage',
            icon: 'palette',
            screen: 'ThemeLanguage', //khai báo màn hình content trong /src/registries/screenRegistry.tsx nhé
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'payment-config',
            name: 'menu.settings.system.paymentConfig',
            icon: 'payment',
            screen: 'PaymentConfigScreen',
            level: 3,
            permissions: ['admin'],
          },
        ],
      },
      {
        id: 'data-management',
        name: 'menu.settings.data.title',
        icon: 'storage',
        level: 2,
        permissions: ['admin'],
        children: [
          {
            id: 'backup-restore',
            name: 'menu.settings.data.backupRestore',
            icon: 'backup',
            screen: 'BackupRestoreScreen',
            level: 3,
            permissions: ['admin'],
          },
          {
            id: 'sync-status',
            name: 'menu.settings.data.syncStatus',
            icon: 'sync',
            screen: 'SyncStatusScreen',
            level: 3,
            permissions: ['admin'],
          },
          {
            id: 'database-setup',
            name: 'menu.settings.data.databaseSetup',
            icon: 'database',
            screen: 'Database',
            level: 3,
            permissions: ['admin'],
          },
        ],
      },
    ],
  },

  // ✅ 9. HỖ TRỢ & THÔNG TIN
  {
    id: 'support',
    name: 'menu.support.title',
    icon: 'help',
    level: 1,
    order: 9,
    permissions: ['*'],
    group: 'support',
    children: [
      {
        id: 'documentation',
        name: 'menu.support.documentation',
        icon: 'description',
        screen: 'OnboardingScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'help-center',
        name: 'menu.support.helpCenter.title',
        icon: 'support-agent',
        level: 2,
        permissions: ['*'],
        children: [
          {
            id: 'contact-support',
            name: 'menu.support.helpCenter.contact',
            icon: 'contact-support',
            navigationType: 'modal',
            navigationParams: {
              modalComponent: HelpModal,
              modalProps: {
                title: 'Liên hệ hỗ trợ',
                showContactForm: true,
              },
            },
            level: 3,
            permissions: ['*'],
          },
          {
            id: 'feedback',
            name: 'menu.support.helpCenter.feedback',
            icon: 'feedback',
            navigationType: 'modal',
            navigationParams: {
              modalComponent: FeedbackModal,
              modalProps: {
                title: 'Gửi phản hồi',
              },
            },
            level: 3,
            permissions: ['*'],
          },
        ],
      },
      {
        id: 'notifications',
        name: 'menu.support.notifications',
        icon: 'notifications',
        screen: 'NotificationScreen',
        level: 2,
        permissions: ['*'],
      },
      {
        id: 'about',
        name: 'menu.support.about',
        icon: 'info',
        screen: 'AboutScreen',
        level: 2,
        permissions: ['*'],
      },
    ],
  },

  // ✅ 10. DASHBOARD ADMIN (Dành cho quản trị viên cấp cao)
  {
    id: 'admin-dashboard',
    name: 'menu.admin.dashboard',
    icon: 'admin-panel-settings',
    screen: 'AdminDashboardScreen',
    level: 1,
    order: 10,
    permissions: ['admin'],
    group: 'admin',
  },

  // ✅ 11. ĐĂNG XUẤT
  {
    id: 'logout',
    name: 'menu.logout',
    icon: 'logout',
    level: 1,
    order: 11,
    navigationType: 'action',
    navigationParams: {
      actionHandler: showLogoutConfirm,
    },
    permissions: ['*'],
    group: 'system',
  },
];

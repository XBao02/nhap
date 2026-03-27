export default {
  main: {
    welcome: 'Welcome, {{name}}',
  },
  menu: {
    logo:"Hi!",
    dashboard: {
      title: 'Dashboard',
    },
    groups: {
      main: 'Main Menu',
      analytics: 'Reports & Analytics',
      admin: 'Administration',
      system: 'System Settings',
      support: 'Support & Information',
    },
    pos: {
      title: 'Point of Sale',
      mainPos: 'Main POS',
      cart: 'Cart',
      scanner: 'QR Scanner',
      payment: {
        title: 'Payment',
        methods: 'Payment Methods',
        qrCode: 'QR Code Payment',
        status: 'Payment Status',
      },
    },
    inventory: {
      title: 'Inventory',
      products: {
        title: 'Products',
        list: 'Product List',
        create: 'Create Product',
        search: 'Search Products',
        variants: 'Product Variants',
      },
      categories: {
        title: 'Categories',
        list: 'Category List',
        images: 'Images library',
      },
      stock: {
        title: 'Stock Management',
        dashboard: 'Stock Dashboard',
        stockIn: 'Stock In',
        stockOut: 'Stock Out',
        transfer: 'Stock Transfer',
        report: 'Inventory Report',
      },
    },
    orders: {
      title: 'Orders',
      list: 'Order List',
      detail: 'Order Detail',
      invoices: 'Invoices',
      paymentHistory: 'Payment History',
    },
    customers: {
      title: 'Customers',
      list: 'Customer List',
      detail: 'Customer Detail',
      loyalty: 'Loyalty Program',
    },
    reports: {
      title: 'Reports & Analytics',
      sales: {
        title: 'Sales Reports',
        dashboard: 'Sales Dashboard',
        daily: 'Daily Sales',
        monthly: 'Monthly Sales',
        yearly: 'Yearly Sales',
      },
      financial: {
        title: 'Financial Reports',
        cashFlow: 'Cash Flow',
        accounting: 'Accounting',
        taxManagement: 'Tax Management',
      },
    },
    users: {
      title: 'Users & Permissions',
      management: 'User Management',
      profile: 'User Profile',
      roleAssignment: 'Role Assignment',
      permissionMatrix: 'Permission Matrix',
    },
    settings: {
      title: 'Settings',
      store: {
        title: 'Store Settings',
        config: 'Store Configuration',
        enterprise: 'Enterprise Settings',
        branches: 'Branch List',
      },
      system: {
        title: 'System Configuration',
        general: 'General Settings',
        themeLanguage: 'Theme & Language',
        paymentConfig: 'Payment Configuration',
      },
      data: {
        title: 'Data Management',
        backupRestore: 'Backup & Restore',
        syncStatus: 'Sync Status',
        databaseSetup: 'Database Setup',
      },
    },
    support: {
      title: 'Support & Information',
      documentation: 'Documentation',
      helpCenter: {
        title: 'Help Center',
        contact: 'Contact Support',
        feedback: 'Send Feedback',
      },
      notifications: 'Notifications',
      about: 'About',
    },
    admin: {
      dashboard: 'Admin Dashboard',
    },
    logout: 'Logout',
  },
  alerts: {
    logout: {
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      cancel: 'Cancel',
      confirm: 'Logout',
    },
    backup: {
      title: 'Backup Data',
      message: 'Do you want to backup data now?',
      cancel: 'Cancel',
      confirm: 'Backup',
    },
  },
};
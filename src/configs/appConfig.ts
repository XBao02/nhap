// config/appConfig.ts
export const APP_CONFIG = {
  // Database configuration
  DATABASE: {
    VERSION: '1.0.0',
    DEFAULT_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    
    // Industry-specific database mappings
    INDUSTRY_DB_MAP: {
      fnb: ['core', 'fnb', 'pos', 'inventory', 'payment'],
      retail: ['core', 'retail', 'pos', 'inventory', 'payment', 'crm'],
      service: ['core', 'service', 'booking', 'payment', 'crm'],
      healthcare: ['core', 'healthcare', 'patient', 'appointment', 'payment'],
      education: ['core', 'education', 'student', 'course', 'payment'],
    } as Record<string, string[]>,
  },

  // Authentication configuration
  AUTH: {
    SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    REFRESH_THRESHOLD: 2 * 60 * 60 * 1000,    // 2 hours in ms
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION: 15 * 60 * 1000,         // 15 minutes in ms
  },

  // Storage configuration
  STORAGE: {
    ENCRYPTION_KEY: 'mypos_secure_key_2024',
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000,     // 24 hours in ms
    MAX_STORAGE_SIZE: 100 * 1024 * 1024,      // 100MB
  },

  // Development configuration
  DEV: {
    ENABLE_LOGGING: __DEV__,
    ENABLE_DEBUG_UI: __DEV__,
    MOCK_SLOW_OPERATIONS: false,
    AUTO_RESET_ON_ERROR: __DEV__,
  },

  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    CLOUD_SYNC: true,
    MULTI_STORE: true,
    ADVANCED_REPORTING: true,
    PLUGIN_SYSTEM: false, // Coming soon
  },
};

// config/roleConfig.ts
export const ROLE_HIERARCHY = {
  trial: 1,
  employee: 2,
  manager: 3,
  owner: 4,
  accountant: 3,
  admin_store: 5,
  admin_enterprise: 6,
} as const;

export const ROLE_PERMISSIONS = {
  trial: {
    modules: ['pos'],
    actions: ['read'],
    limitations: {
      maxTransactions: 10,
      maxProducts: 50,
      daysLimit: 7,
    },
  },
  employee: {
    modules: ['pos', 'inventory'],
    actions: ['read', 'create'],
    limitations: {
      maxDiscount: 0.1, // 10%
      requireApproval: ['refund'],
    },
  },
  manager: {
    modules: ['pos', 'inventory', 'reports', 'users'],
    actions: ['read', 'create', 'update'],
    limitations: {
      maxDiscount: 0.2, // 20%
      canApprove: ['refund', 'void'],
    },
  },
  owner: {
    modules: ['pos', 'inventory', 'reports', 'users', 'settings'],
    actions: ['read', 'create', 'update', 'delete'],
    limitations: {},
  },
  accountant: {
    modules: ['reports', 'accounting', 'payments'],
    actions: ['read', 'create', 'update'],
    limitations: {
      readOnly: ['pos', 'inventory'],
    },
  },
  admin_store: {
    modules: ['*'],
    actions: ['*'],
    limitations: {
      scope: 'store',
    },
  },
  admin_enterprise: {
    modules: ['*'],
    actions: ['*'],
    limitations: {
      scope: 'enterprise',
    },
  },
} as const;
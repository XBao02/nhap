export type RootStackParamList = {
  Home: undefined;
  AppInitializationScreen: undefined;
  Database: undefined;
  Login: undefined;
  Settings: { userId?: string | null };
  EnterpriseInfo: undefined;
  DatabaseSetup: undefined;
  Setup: undefined;
  UserProfile: undefined;
  Main: { userInfo: any | null };
  Dashboard: {
    roles: string[];
    fields: string[];
  };
  Example: undefined;
  TreeMenu: undefined;
  FlatMenu: undefined;
  SalesPointsScreen: undefined;
  SalesScreen: undefined;
  Payment: undefined;
  Accounting: undefined;
  Retail: undefined;
  Hospitality: undefined;
  Accommodation: undefined;
  FNB: undefined;
  OnlineOrder: undefined;
  AdminPaymentConfig: undefined;
  Billing: undefined;
  DatabaseManager: undefined;
  // Các màn hình chỉ demo làm cấu trúc menu con
  EmployeeList: undefined;
  AddEmployee: undefined;
  Attendance: undefined;
  FinancialReports: undefined;
  IncomeExpense: undefined;
  ProductList: undefined;
  StockManagement: undefined;
  SalesReport: undefined;
  PerformanceReport: undefined;
};

export interface AppError {
  type:
    | 'SETUP'
    | 'DATABASE'
    | 'SESSION'
    | 'NAVIGATION'
    | 'UNKNOWN'
    | 'VALIDATION';
  message: string;
  code?: string;
  details?: unknown;
}

// Type definitions for the new storage format
export interface SetupConfig {
  installed: boolean;
  field: IndustryType;
  role: UserRole;
  databaseList: DatabaseModule[];
  version: string;
  setupDate: string;
}


export interface UserInfo {
  id?: string;
  store_id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  permissions?: any;
  avatar_url?: string;
  is_active?: boolean;
  last_login?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSession {
  userId: string;
  storeId?: string;
  enterpriseId?: string;
  roles?: UserRole[];
  lastLogin?: string;
  expiresAt: string;
}

export interface InitializationState {
  // Setup state
  setupConfig: SetupConfig | null;
  userSession: UserSession | null;

  // Database state
  databaseConnections: string[];
  isDatabaseReady: boolean;

  // Loading states
  isLoading: boolean;
  isCheckingSetup: boolean;
  isOpeningDatabases: boolean;
  isValidatingSession: boolean;

  // Error handling
  error: AppError | null; // Property 'type' does not exist on type 'AppError | null'.
}

export type IndustryType = 
  | 'fnb'           // Food & Beverage
  | 'retail'        // Retail
  | 'service'       // Service
  | 'healthcare'    // Healthcare
  | 'education'     // Education
  | 'other';        // Other

export type UserRole = 
  | 'trial'
  | 'employee'
  | 'manager'
  | 'owner'
  | 'accountant'
  | 'admin_store'
  | 'admin_enterprise';

export type DatabaseModule = 
  | 'core'
  | 'fnb'
  | 'retail'
  | 'service'
  | 'oms'          // Order Management System
  | 'payment'
  | 'crm'          // Customer Relationship Management
  | 'inventory'
  | 'product'
  | 'accounting'
  | 'hr';          // Human Resources


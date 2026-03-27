# DatabaseManager - Hướng dẫn sử dụng

## Giới thiệu

DatabaseManager là một singleton class được thiết kế để quản lý nhiều kết nối cơ sở dữ liệu SQLite trong ứng dụng React Native. Nó cung cấp hệ thống phân quyền theo vai trò (role-based access control), quản lý kết nối thông minh và các tiện ích import/export dữ liệu.

## Các tính năng chính

- **Role-based Access Control**: Phân quyền truy cập database theo vai trò người dùng
- **Lazy Loading**: Khởi tạo kết nối database khi cần thiết
- **Connection Pooling**: Quản lý pool kết nối với giới hạn số lượng
- **Cross-schema Transactions**: Thực hiện giao dịch xuyên nhiều database
- **Data Import/Export**: Import dữ liệu từ CSV, JSON với column mapping
- **App State Management**: Tự động quản lý kết nối khi app chuyển background/foreground
- **Health Check**: Kiểm tra tình trạng các database

## Cài đặt và Import

```typescript
import DatabaseManager, { RoleConfig, DatabaseImportConfig } from './DatabaseManager';
import { schemaConfigurations } from './schemas';
```

## 1. Cấu hình Role-based Access

### Đăng ký vai trò (Roles)

```typescript
// Cấu hình role cho admin
const adminRole: RoleConfig = {
  roleName: 'admin',
  requiredDatabases: ['core', 'users', 'analytics', 'logs'],
  optionalDatabases: ['backups'],
  priority: 1
};

// Cấu hình role cho user thường
const userRole: RoleConfig = {
  roleName: 'user',
  requiredDatabases: ['core', 'users'],
  optionalDatabases: ['analytics'],
  priority: 2
};

// Cấu hình role cho guest
const guestRole: RoleConfig = {
  roleName: 'guest',
  requiredDatabases: ['core'],
  priority: 3
};

// Đăng ký các roles
DatabaseManager.registerRoles([adminRole, userRole, guestRole]);

// Hoặc đăng ký từng role riêng lẻ
DatabaseManager.registerRole(adminRole);
```

### Quản lý vai trò người dùng

```typescript
// Đăng nhập với nhiều role
await DatabaseManager.setCurrentUserRoles(['admin', 'user'], 'admin');

// Đăng nhập với role đơn
await DatabaseManager.setCurrentUserRoles(['user']);

// Kiểm tra role hiện tại
const currentRoles = DatabaseManager.getCurrentUserRoles(); // ['admin', 'user']
const primaryRole = DatabaseManager.getCurrentRole(); // 'admin'

// Kiểm tra quyền truy cập database
const hasAccess = DatabaseManager.hasAccessToDatabase('analytics'); // true cho admin
```

## 2. Khởi tạo và Quản lý Database

### Khởi tạo Core Database (luôn cần thiết)

```typescript
// Core database luôn được khởi tạo đầu tiên
await DatabaseManager.initializeCoreConnection();
```

### Khởi tạo Database theo Role

```typescript
// Sau khi đăng nhập, các database sẽ được khởi tạo tự động
await DatabaseManager.setCurrentUserRoles(['admin', 'user']);

// Hoặc khởi tạo thủ công các database cụ thể
await DatabaseManager.initLazySchema(['users', 'analytics']);

// Khởi tạo tất cả database (không khuyến khích)
await DatabaseManager.initializeAll();
```

### Lazy Loading - Khởi tạo khi cần

```typescript
// Lấy DAO và tự động khởi tạo nếu chưa có
const userDao = await DatabaseManager.getLazyLoading('users');

// Sử dụng trực tiếp (phải đảm bảo đã khởi tạo)
const coreDao = DatabaseManager.get('core');
```

### Mở Database đã tồn tại

```typescript
// Mở các database đã tồn tại từ file
const success = await DatabaseManager.openAllExisting(['core', 'users', 'analytics']);

if (success) {
  console.log('Tất cả database đã được mở thành công');
}
```

## 3. Sử dụng Database Operations

### Truy cập Database DAO

```typescript
try {
  // Lấy DAO để thực hiện operations
  const userDao = DatabaseManager.get('users');
  const coreDao = DatabaseManager.get('core');
  
  // Thực hiện queries
  const users = await userDao.selectAll({
    name: 'users',
    cols: [{ name: 'id' }, { name: 'name' }, { name: 'email' }],
    wheres: [{ name: 'status', value: 'active', operator: '=' }],
    orderbys: [{ name: 'created_at', direction: 'DESC' }],
    limitOffset: { limit: 10, offset: 0 }
  });
  
} catch (error) {
  console.error('Database access error:', error.message);
  // Có thể do không có quyền truy cập hoặc chưa khởi tạo
}
```

### Cross-schema Transactions

```typescript
// Thực hiện giao dịch xuyên nhiều database
await DatabaseManager.executeCrossSchemaTransaction(
  ['users', 'analytics', 'logs'],
  async (daos) => {
    // Thực hiện operations trên nhiều database
    await daos.users.insert({
      name: 'users',
      cols: [
        { name: 'name', value: 'John Doe' },
        { name: 'email', value: 'john@example.com' }
      ]
    });
    
    await daos.analytics.insert({
      name: 'user_events',
      cols: [
        { name: 'event_type', value: 'user_created' },
        { name: 'user_id', value: 123 },
        { name: 'timestamp', value: new Date().toISOString() }
      ]
    });
    
    await daos.logs.insert({
      name: 'audit_logs',
      cols: [
        { name: 'action', value: 'create_user' },
        { name: 'details', value: JSON.stringify({ userId: 123 }) }
      ]
    });
    
    // Nếu có lỗi, tất cả operations sẽ được rollback
  }
);
```

## 4. Data Import/Export

### Import dữ liệu cơ bản

```typescript
// Dữ liệu mẫu
const userData = [
  { name: 'John Doe', email: 'john@example.com', age: 30 },
  { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
];

// Import vào bảng users
const importResult = await DatabaseManager.importDataToTable(
  'users',        // database key
  'user_profiles', // table name
  userData,       // data array
  {
    batchSize: 100,
    validateData: true,
    includeAutoIncrementPK: false,
    onProgress: (processed, total) => {
      console.log(`Import progress: ${processed}/${total}`);
    }
  }
);

console.log(`Import kết quả: ${importResult.successRows}/${importResult.totalRows} thành công`);
```

### Import với Column Mapping

```typescript
// Dữ liệu từ hệ thống khác có tên column khác
const externalData = [
  { user_name: 'John Doe', user_email: 'john@example.com', user_age: 30 },
  { user_name: 'Jane Smith', user_email: 'jane@example.com', user_age: 25 }
];

// Định nghĩa mapping
const columnMappings = [
  { 
    sourceColumn: 'user_name', 
    targetColumn: 'name',
    transform: (value) => value.trim()
  },
  { 
    sourceColumn: 'user_email', 
    targetColumn: 'email',
    transform: (value) => value.toLowerCase()
  },
  { 
    sourceColumn: 'user_age', 
    targetColumn: 'age',
    transform: (value) => parseInt(value)
  }
];

const mappedResult = await DatabaseManager.importDataWithMapping(
  'users',
  'user_profiles',
  externalData,
  columnMappings,
  { validateData: true }
);
```

### Import từ CSV

```typescript
const csvData = `name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25
Bob Johnson,bob@example.com,35`;

const csvResult = await DatabaseManager.importFromCSV(
  'users',
  'user_profiles',
  csvData,
  {
    delimiter: ',',
    hasHeader: true,
    validateData: true,
    columnMappings: [
      { sourceColumn: 'name', targetColumn: 'full_name' }
    ]
  }
);
```

### Bulk Import nhiều Database/Table

```typescript
const bulkImportConfigs: DatabaseImportConfig[] = [
  {
    databaseKey: 'users',
    tableName: 'user_profiles',
    data: userData,
    options: { batchSize: 50 }
  },
  {
    databaseKey: 'analytics',
    tableName: 'user_events',
    data: eventData,
    columnMappings: eventColumnMappings
  },
  {
    databaseKey: 'logs',
    tableName: 'audit_logs',
    data: auditData
  }
];

const bulkResult = await DatabaseManager.bulkImport(bulkImportConfigs);

console.log(`Bulk import: ${bulkResult.successDatabases}/${bulkResult.totalDatabases} databases thành công`);
console.log('Chi tiết kết quả:', bulkResult.results);
console.log('Lỗi (nếu có):', bulkResult.errors);
```

### Validation dữ liệu trước khi Import

```typescript
// Validate dữ liệu trước khi import thực sự
const validationErrors = await DatabaseManager.validateImportData(
  'users',
  'user_profiles',
  userData
);

if (validationErrors.length > 0) {
  console.log('Dữ liệu có lỗi:');
  validationErrors.forEach(error => {
    console.log(`Row ${error.rowIndex}: ${error.errors.join(', ')}`);
  });
} else {
  // Tiến hành import
  const result = await DatabaseManager.importDataToTable('users', 'user_profiles', userData);
}
```

## 5. Quản lý Lifecycle của Database

### Kiểm tra trạng thái kết nối

```typescript
// Lấy tất cả kết nối hiện tại
const connections = DatabaseManager.getConnections();
console.log('Active connections:', Object.keys(connections));

// Debug thông tin file database
await DatabaseManager.debugDatabaseFiles(['core', 'users', 'analytics']);

// Kiểm tra thống kê database
const stats = await DatabaseManager.getImportStatistics('users');
console.log('Database stats:', {
  totalTables: stats.totalTables,
  tablesWithData: stats.tablesWithData,
  tableSizes: stats.tableSizes
});
```

### Quản lý khi App chuyển Background/Foreground

```typescript
// DatabaseManager tự động đăng ký AppState listener
// Khi app chuyển background -> đóng tất cả kết nối
// Khi app active -> mở lại kết nối theo role hiện tại

// Để reopen connections thủ công (nếu cần)
await DatabaseManager.reopenConnections();
```

### Đăng xuất và Cleanup

```typescript
// Đăng xuất user (giữ core database, đóng các database khác)
await DatabaseManager.logout();

// Đóng tất cả kết nối và reset state
await DatabaseManager.closeAll();
```

### Xóa dữ liệu table (Truncate)

```typescript
// Xóa tất cả dữ liệu trong bảng
const deletedRows = await DatabaseManager.truncateTable('users', 'user_profiles');
console.log(`Đã xóa ${deletedRows} rows từ user_profiles`);
```

## 6. Patterns và Best Practices

### App Initialization Pattern

```typescript
class AppDatabaseService {
  private static isInitialized = false;

  static async initializeApp() {
    if (this.isInitialized) return;

    try {
      // 1. Đăng ký roles
      await this.registerApplicationRoles();
      
      // 2. Khởi tạo core database
      await DatabaseManager.initializeCoreConnection();
      
      // 3. Nếu có user đã login, khởi tạo các database theo role
      const savedUserRoles = await this.getSavedUserRoles();
      if (savedUserRoles.length > 0) {
        await DatabaseManager.setCurrentUserRoles(savedUserRoles);
      }
      
      this.isInitialized = true;
      console.log('App database initialization completed');
      
    } catch (error) {
      console.error('App database initialization failed:', error);
      throw error;
    }
  }

  private static async registerApplicationRoles() {
    const roles: RoleConfig[] = [
      {
        roleName: 'admin',
        requiredDatabases: ['core', 'users', 'analytics', 'reports', 'logs'],
        optionalDatabases: ['backups', 'temp'],
        priority: 1
      },
      {
        roleName: 'manager',
        requiredDatabases: ['core', 'users', 'analytics', 'reports'],
        optionalDatabases: ['logs'],
        priority: 2
      },
      {
        roleName: 'employee',
        requiredDatabases: ['core', 'users'],
        optionalDatabases: ['analytics'],
        priority: 3
      },
      {
        roleName: 'guest',
        requiredDatabases: ['core'],
        priority: 4
      }
    ];

    DatabaseManager.registerRoles(roles);
  }

  private static async getSavedUserRoles(): Promise<string[]> {
    // Implement logic để lấy user roles đã save từ AsyncStorage, SecureStore, etc.
    return [];
  }
}

// Sử dụng trong App.tsx
export default function App() {
  useEffect(() => {
    AppDatabaseService.initializeApp().catch(console.error);
  }, []);

  // ... rest of app
}
```

### User Login/Logout Pattern

```typescript
class AuthService {
  static async login(credentials: LoginCredentials) {
    try {
      // 1. Authenticate user
      const authResult = await this.authenticate(credentials);
      
      // 2. Get user roles from API/local storage
      const userRoles = await this.getUserRoles(authResult.userId);
      
      // 3. Set database access based on roles
      await DatabaseManager.setCurrentUserRoles(userRoles, userRoles[0]);
      
      // 4. Import initial data if needed
      await this.importInitialUserData(authResult.userId);
      
      return authResult;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      // 1. Clear user session
      await this.clearUserSession();
      
      // 2. Close role-specific database connections
      await DatabaseManager.logout();
      
      // 3. Clear cached data
      await this.clearUserCache();
      
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  private static async importInitialUserData(userId: number) {
    // Import user-specific data after login
    const userData = await this.fetchUserData(userId);
    
    if (userData.length > 0) {
      await DatabaseManager.importDataToTable(
        'users',
        'user_profiles',
        userData,
        { 
          batchSize: 100,
          onProgress: (processed, total) => {
            console.log(`Importing user data: ${processed}/${total}`);
          }
        }
      );
    }
  }
}
```

### Data Sync Pattern

```typescript
class DataSyncService {
  static async syncAllData() {
    try {
      // Lấy data từ server
      const syncData = await this.fetchSyncData();
      
      // Chuẩn bị bulk import configs
      const importConfigs: DatabaseImportConfig[] = [
        {
          databaseKey: 'users',
          tableName: 'user_profiles',
          data: syncData.users,
          options: { batchSize: 100, validateData: true }
        },
        {
          databaseKey: 'analytics',
          tableName: 'user_events',
          data: syncData.events,
          options: { batchSize: 200 }
        }
      ];

      // Thực hiện bulk import
      const result = await DatabaseManager.bulkImport(importConfigs);
      
      if (result.successDatabases === result.totalDatabases) {
        console.log('Data sync completed successfully');
      } else {
        console.error('Some databases failed to sync:', result.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Data sync failed:', error);
      throw error;
    }
  }

  static async exportDataForBackup() {
    const stats = await DatabaseManager.getImportStatistics('users');
    
    // Export chỉ những table có dữ liệu
    for (const tableName of stats.tablesWithData) {
      const dao = DatabaseManager.get('users');
      const data = await dao.selectAll({
        name: tableName,
        cols: [],
        wheres: [],
        orderbys: [],
        limitOffset: {}
      });
      
      // Save to file hoặc upload to server
      await this.saveBackupData(tableName, data);
    }
  }
}
```

### Error Handling và Retry Pattern

```typescript
class DatabaseRetryService {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        
        // Try to recover connection if needed
        if (error.message.includes('database is locked')) {
          await DatabaseManager.reopenConnections();
        }
      }
    }
    
    throw lastError!;
  }

  static async importWithRetry(
    databaseKey: string,
    tableName: string,
    data: Record<string, any>[],
    options?: Partial<ImportOptions>
  ) {
    return this.withRetry(async () => {
      return DatabaseManager.importDataToTable(databaseKey, tableName, data, options);
    });
  }
}

// Sử dụng
const result = await DatabaseRetryService.importWithRetry(
  'users',
  'user_profiles',
  userData,
  { batchSize: 50 }
);
```

## 7. Troubleshooting

### Các lỗi thường gặp

**1. Access Denied Error**
```typescript
// Lỗi: Access denied: Database 'analytics' is not accessible by current user roles
// Nguyên nhân: User không có quyền truy cập database
// Giải pháp: Kiểm tra role configuration hoặc thêm database vào role

const currentRoles = DatabaseManager.getCurrentUserRoles();
console.log('Current roles:', currentRoles);

const allowedDatabases = DatabaseManager.getCurrentUserDatabases();
console.log('Allowed databases:', allowedDatabases);
```

**2. Database not connected**
```typescript
// Lỗi: Database 'users' is not connected
// Nguyên nhân: Database chưa được khởi tạo
// Giải pháp: Sử dụng lazy loading hoặc khởi tạo manual

try {
  const dao = DatabaseManager.get('users');
} catch (error) {
  // Thử lazy loading
  const dao = await DatabaseManager.getLazyLoading('users');
}
```

**3. Maximum connections reached**
```typescript
// Lỗi: Maximum number of database connections reached
// Nguyên nhân: Vượt quá giới hạn 10 kết nối đồng thời
// Giải pháp: Đóng các kết nối không cần thiết

const connections = DatabaseManager.getConnections();
console.log('Active connections:', Object.keys(connections).length);

// Đóng connection không cần thiết
await DatabaseManager.logout(); // giữ core, đóng các connection khác
```

**4. Import validation errors**
```typescript
// Validate trước khi import
const errors = await DatabaseManager.validateImportData('users', 'profiles', data);
if (errors.length > 0) {
  console.log('Data validation errors:');
  errors.forEach((error, index) => {
    console.log(`Row ${error.rowIndex}:`, error.errors);
  });
  
  // Fix data hoặc skip problematic rows
}
```

### Debug và Monitoring

```typescript
// Enable debug logging
const connections = DatabaseManager.getConnections();
console.log('=== DATABASE DEBUG INFO ===');
console.log('Active connections:', Object.keys(connections));
console.log('Current user roles:', DatabaseManager.getCurrentUserRoles());
console.log('Primary role:', DatabaseManager.getCurrentRole());

// Check database files
await DatabaseManager.debugDatabaseFiles(Object.keys(connections));

// Health check cho tất cả databases
for (const [key, dao] of Object.entries(connections)) {
  try {
    await dao.runSql('PRAGMA integrity_check');
    console.log(`✅ Database '${key}' is healthy`);
  } catch (error) {
    console.error(`❌ Database '${key}' has issues:`, error);
  }
}
```

### Performance Optimization

```typescript
// 1. Sử dụng batch import thay vì insert từng row
const BATCH_SIZE = 500; // Tối ưu cho performance
await DatabaseManager.importDataToTable('users', 'profiles', data, {
  batchSize: BATCH_SIZE
});

// 2. Validate dữ liệu trước khi import
const validationErrors = await DatabaseManager.validateImportData('users', 'profiles', data);
if (validationErrors.length === 0) {
  await DatabaseManager.importDataToTable('users', 'profiles', data);
}

// 3. Sử dụng transactions cho multiple operations
await DatabaseManager.executeCrossSchemaTransaction(['users', 'logs'], async (daos) => {
  // Multiple operations here
});

// 4. Truncate table thay vì delete từng row
const deletedCount = await DatabaseManager.truncateTable('users', 'temp_data');
```

## 8. Kết luận

DatabaseManager cung cấp một hệ thống quản lý database mạnh mẽ và linh hoạt cho ứng dụng React Native với SQLite. Các tính năng chính bao gồm:

- **Security**: Role-based access control bảo mật
- **Performance**: Connection pooling và lazy loading
- **Reliability**: Auto recovery và transaction support
- **Flexibility**: Import/export với column mapping
- **Maintainability**: Clear separation of concerns và comprehensive logging

Sử dụng DatabaseManager giúp tổ chức code tốt hơn, tăng bảo mật và dễ bảo trì trong các ứng dụng phức tạp.
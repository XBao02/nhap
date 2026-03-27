# BaseService - Hướng dẫn sử dụng

## Giới thiệu

BaseService là một lớp cơ sở trừu tượng được thiết kế để cung cấp các chức năng CRUD (Create, Read, Update, Delete) cơ bản cho việc tương tác với cơ sở dữ liệu SQLite. Lớp này được xây dựng theo mô hình Service Layer Pattern và cung cấp một interface thống nhất để quản lý dữ liệu.

## Các tính năng chính

- ✅ **CRUD Operations**: Các phương thức cơ bản để thao tác dữ liệu
- ✅ **Lazy Loading**: Khởi tạo kết nối cơ sở dữ liệu khi cần thiết
- ✅ **Transaction Support**: Hỗ trợ giao dịch cơ sở dữ liệu
- ✅ **Event System**: Hệ thống sự kiện để theo dõi hoạt động
- ✅ **Error Handling**: Xử lý lỗi có cấu trúc và linh hoạt
- ✅ **Health Check**: Kiểm tra tình trạng hoạt động của service
- ✅ **Cache Support**: Hỗ trợ cache dữ liệu cơ bản

## Cài đặt và Import

```typescript
import { BaseService, FindOptions, ServiceStatus, HealthCheckResult } from './BaseService';
import { DatabaseManager } from './DatabaseManager';
```

## Khởi tạo Service

### 1. Tạo Service cơ bản

```typescript
// Khởi tạo service với schema và table name
const userService = new BaseService('users_db', 'users');

// Hoặc sử dụng schema name làm table name
const productService = new BaseService('products');
```

### 2. Khởi tạo và mở kết nối

```typescript
// Phương pháp 1: Khởi tạo thủ công
await userService.init();

// Phương pháp 2: Tự động khởi tạo khi gọi phương thức
// Service sẽ tự động khởi tạo khi gọi bất kỳ phương thức CRUD nào
const users = await userService.findAll(); // Tự động init nếu chưa được khởi tạo
```

### 3. Cấu hình Primary Key

```typescript
// Mặc định sử dụng 'id' làm primary key
userService.setPrimaryKeyFields(['id']);

// Hoặc sử dụng composite primary key
userService.setPrimaryKeyFields(['user_id', 'role_id']);
```

## Các phương thức CRUD cơ bản

### 1. Create - Tạo dữ liệu

```typescript
// Tạo một record
const newUser = await userService.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Tạo nhiều records (bulk create)
const users = await userService.bulkCreate([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' }
]);
```

### 2. Read - Đọc dữ liệu

```typescript
// Lấy tất cả records
const allUsers = await userService.findAll();

// Lấy với điều kiện
const activeUsers = await userService.findAll(
  { status: 'active' },
  { 
    orderBy: [{ name: 'created_at', direction: 'DESC' }],
    limit: 10,
    offset: 0
  }
);

// Lấy theo ID
const user = await userService.findById(1);

// Lấy record đầu tiên thỏa mãn điều kiện
const firstUser = await userService.findFirst({ email: 'john@example.com' });

// Đếm số lượng records
const userCount = await userService.count({ status: 'active' });
```

### 3. Update - Cập nhật dữ liệu

```typescript
// Cập nhật theo ID
const updatedUser = await userService.update(1, {
  name: 'John Updated',
  email: 'john.updated@example.com'
});
```

### 4. Delete - Xóa dữ liệu

```typescript
// Xóa theo ID
const success = await userService.delete(1);
console.log('Deleted:', success); // true nếu thành công
```

## Quản lý Database Connection

### 1. Kiểm tra trạng thái kết nối

```typescript
// Kiểm tra status của service
const status = userService.getStatus();
console.log({
  schemaName: status.schemaName,
  isOpened: status.isOpened,
  isInitialized: status.isInitialized,
  hasDao: status.hasDao
});

// Health check
const health = await userService.healthCheck();
console.log({
  healthy: health.healthy,
  recordCount: health.recordCount,
  error: health.error,
  timestamp: health.timestamp
});
```

### 2. Đóng kết nối

```typescript
// Đóng kết nối khi không sử dụng nữa
await userService.close();
```

### 3. Thông tin Database và Table

```typescript
// Lấy thông tin database
const dbInfo = await userService.getDatabaseInfo();

// Lấy thông tin cấu trúc table
const tableInfo = await userService.getTableInfo();
```

## Sử dụng Transactions

```typescript
// Thực hiện nhiều thao tác trong một transaction
await userService.executeTransaction(async () => {
  await userService.create({ name: 'User 1', email: 'user1@example.com' });
  await userService.create({ name: 'User 2', email: 'user2@example.com' });
  await userService.update(1, { status: 'active' });
  
  // Nếu có lỗi xảy ra, tất cả thao tác sẽ bị rollback
  throw new Error('Test rollback'); // Uncomment để test rollback
});
```

## Event System

### 1. Lắng nghe sự kiện

```typescript
// Lắng nghe sự kiện tạo dữ liệu
userService.on('dataCreated', (data) => {
  console.log('Data created:', data);
});

// Lắng nghe sự kiện cập nhật dữ liệu
userService.on('dataUpdated', (data) => {
  console.log('Data updated:', data);
});

// Lắng nghe sự kiện xóa dữ liệu
userService.on('dataDeleted', (data) => {
  console.log('Data deleted:', data);
});

// Lắng nghe sự kiện lỗi
userService.on('error', (data) => {
  console.error('Service error:', data);
});
```

### 2. Hủy lắng nghe sự kiện

```typescript
const handler = (data) => console.log('Data fetched:', data);

// Thêm listener
userService.on('dataFetched', handler);

// Hủy listener
userService.off('dataFetched', handler);
```

## Error Handling

### 1. Xử lý lỗi tùy chỉnh

```typescript
// Đăng ký error handler cho từng loại lỗi
userService.setErrorHandler('CREATE_ERROR', (error) => {
  console.error('Create operation failed:', error.message);
  // Gửi thông báo, log lỗi, etc.
});

userService.setErrorHandler('UPDATE_ERROR', (error) => {
  console.error('Update operation failed:', error.message);
});
```

### 2. Try-catch với service methods

```typescript
try {
  const user = await userService.findById(999);
} catch (error) {
  console.error('User not found:', error.message);
}
```

## Mở rộng BaseService

### 1. Tạo service cụ thể

```typescript
import { BaseService, FindOptions } from './BaseService';

export class UserService extends BaseService {
  constructor() {
    super('users_db', 'users');
    // Cấu hình specific cho user service
    this.setPrimaryKeyFields(['user_id']);
  }

  // Override validation method
  protected _validateData(data: any): void {
    super._validateData(data);
    
    if (!data.email) {
      throw new Error('Email is required');
    }
    
    if (!data.name || data.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
  }

  // Thêm methods đặc biệt cho User
  async findByEmail(email: string) {
    return this.findFirst({ email });
  }

  async findActiveUsers() {
    return this.findAll({ status: 'active' }, {
      orderBy: [{ name: 'last_login', direction: 'DESC' }]
    });
  }

  async updateLastLogin(userId: number) {
    return this.update(userId, {
      last_login: new Date().toISOString()
    });
  }

  // Business logic methods
  async deactivateUser(userId: number) {
    await this.executeTransaction(async () => {
      await this.update(userId, { status: 'inactive' });
      // Thêm các thao tác khác nếu cần
      console.log(`User ${userId} has been deactivated`);
    });
  }
}
```

### 2. Sử dụng service mở rộng

```typescript
const userService = new UserService();

// Sử dụng methods của BaseService
const users = await userService.findAll();

// Sử dụng methods đặc biệt
const user = await userService.findByEmail('john@example.com');
const activeUsers = await userService.findActiveUsers();
await userService.updateLastLogin(1);
await userService.deactivateUser(1);
```

## Các patterns sử dụng phổ biến

### 1. Service Manager Pattern

```typescript
export class ServiceManager {
  private services: Map<string, BaseService> = new Map();

  async getService<T extends BaseService>(
    serviceClass: new () => T,
    serviceName: string
  ): Promise<T> {
    if (!this.services.has(serviceName)) {
      const service = new serviceClass();
      await service.init();
      this.services.set(serviceName, service);
    }
    return this.services.get(serviceName) as T;
  }

  async closeAll(): Promise<void> {
    for (const service of this.services.values()) {
      await service.close();
    }
    this.services.clear();
  }
}

// Sử dụng
const serviceManager = new ServiceManager();
const userService = await serviceManager.getService(UserService, 'users');
```

### 2. Repository Pattern với BaseService

```typescript
export class UserRepository {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async findUserWithProfile(userId: number) {
    const user = await this.userService.findById(userId);
    // Logic để load thêm profile data
    return user;
  }

  async searchUsers(query: string, page: number = 0, pageSize: number = 10) {
    return this.userService.findAll(
      { name_like: `%${query}%` },
      { limit: pageSize, offset: page * pageSize }
    );
  }
}
```

## Best Practices

### 1. Khởi tạo và quản lý lifecycle

```typescript
// Khởi tạo services khi ứng dụng start
async function initializeServices() {
  const services = [userService, productService, orderService];
  
  await Promise.all(services.map(service => service.init()));
  
  // Setup global error handlers
  services.forEach(service => {
    service.setErrorHandler('*', (error) => {
      // Global error logging
      console.error('Service error:', error);
    });
  });
}

// Cleanup khi ứng dụng shutdown
async function cleanupServices() {
  const services = [userService, productService, orderService];
  await Promise.all(services.map(service => service.close()));
}
```

### 2. Error handling và monitoring

```typescript
// Setup monitoring cho tất cả services
function setupServiceMonitoring(service: BaseService) {
  service.on('error', (data) => {
    // Send to monitoring service
    console.error('Service Error:', data);
  });
  
  service.on('dataCreated', (data) => {
    // Track creation metrics
    console.log('Data created:', data.operation);
  });
}
```

### 3. Caching strategy

```typescript
export class CachedUserService extends UserService {
  private cache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async findById(id: string | number) {
    const cacheKey = `user_${id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    const user = await super.findById(id);
    this.cache.set(cacheKey, {
      data: user,
      timestamp: Date.now()
    });
    
    return user;
  }
}
```

## Troubleshooting

### Lỗi thường gặp

1. **Database connection errors**: Kiểm tra DatabaseManager configuration
2. **Primary key errors**: Đảm bảo setPrimaryKeyFields() được gọi đúng
3. **Transaction errors**: Luôn wrap các operations trong try-catch
4. **Memory leaks**: Đảm bảo gọi close() khi không sử dụng service nữa

### Debug và monitoring

```typescript
// Enable debug logging
userService.on('*', (data) => {
  console.log('Service event:', data);
});

// Regular health checks
setInterval(async () => {
  const health = await userService.healthCheck();
  console.log('Service health:', health);
}, 60000); // Mỗi phút
```

## Kết luận

BaseService cung cấp một foundation mạnh mẽ và linh hoạt để xây dựng data access layer trong ứng dụng TypeScript. Với việc kế thừa và mở rộng BaseService, bạn có thể tạo ra các service chuyên biệt phù hợp với business logic của từng domain trong ứng dụng.
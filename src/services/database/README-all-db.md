# SQLite Database Management Guide - React Native

## Tổng quan hệ thống

Hệ thống quản lý cơ sở dữ liệu SQLite offline cho React Native bao gồm các thành phần chính:

-   **SQLiteDAO**: Lớp gốc kết nối và thực thi các lệnh SQL. Đây là cầu nối chính giữa ứng dụng và cơ sở dữ liệu SQLite, chịu trách nhiệm cho các thao tác CRUD cấp thấp và quản lý transaction.
-   **DatabaseFactory & DatabaseManager**: Quản lý kết nối, khởi tạo và đóng/mở database. Các thành phần này đảm bảo rằng các kết nối cơ sở dữ liệu được khởi tạo hiệu quả, được quản lý vòng đời (đặc biệt khi ứng dụng chuyển trạng thái background/foreground) và cung cấp quyền truy cập đến các DAO instance.
-   **BaseService & ServiceManager**: Dịch vụ hỗ trợ quản lý nghiệp vụ logic. `BaseService` cung cấp các phương thức CRUD chung và quản lý trạng thái cho các bảng, trong khi `ServiceManager` quản lý tập trung việc đăng ký, khởi tạo và truy xuất các `BaseService` instances.
-   **Service cụ thể**: Các service cho từng bảng nghiệp vụ (VD: UserService).

## Cấu trúc thư mục

```

src/
├── database/
│   ├── SQLiteDAO.ts
│   ├── DatabaseFactory.ts
│   ├── DatabaseManager.ts
│   ├── BaseService.ts
│   ├── ServiceManager.ts
│   └── schemas/
│       ├── index.ts          \# Đăng ký tất cả schemas
│       ├── core.json         \# Schema cho database core
│       └── ...
├── services/
│   ├── BaseService.ts
│   ├── ServiceManager.ts
│   └── ...
│   ├── core
│   │   ├── UserService.ts

```

## 1. Khởi tạo cơ sở dữ liệu lần đầu

### 1.1. Chuẩn bị schema configuration

Tạo file `schemas/core.json`:

```json
{
  "version": "v1",
  "database_name": "core.db",
  "description": "Cơ sở dữ liệu hệ thống cốt lõi quản lý toàn bộ hoạt động của doanh nghiệp, bao gồm thông tin doanh nghiệp, cửa hàng và người dùng",
  "type_mapping": {
    "sqlite": {
      "string": "TEXT",
      "varchar": "TEXT",
      "char": "TEXT",
      "email": "TEXT",
      "url": "TEXT",
      "uuid": "TEXT",
      "integer": "INTEGER",
      "bigint": "INTEGER",
      "smallint": "INTEGER",
      "tinyint": "INTEGER",
      "decimal": "REAL",
      "numeric": "REAL",
      "float": "REAL",
      "double": "REAL",
      "boolean": "INTEGER",
      "timestamp": "TEXT",
      "datetime": "TEXT",
      "date": "TEXT",
      "time": "TEXT",
      "json": "TEXT",
      "array": "TEXT",
      "blob": "BLOB",
      "binary": "BLOB"
    }
  },
  "schemas": {
    "enterprises": {
      "description": "Bảng quản lý thông tin các doanh nghiệp trong hệ thống",
      "cols": [
        {
          "name": "id",
          "type": "uuid",
          "constraints": "PRIMARY KEY",
          "description": "Mã định danh duy nhất của doanh nghiệp"
        },
        {
          "name": "name",
          "type": "string",
          "constraints": "NOT NULL",
          "description": "Tên doanh nghiệp"
        },
        {
          "name": "business_type",
          "type": "string",
          "description": "Loại hình doanh nghiệp (TNHH, Cổ phần, v.v.)"
        }
      ],
      "indexes": [
        {
          "name": "idx_enterprises_name",
          "columns": ["name"],
          "unique": false,
          "description": "Index cho tên doanh nghiệp để tăng tốc tìm kiếm"
        }
      ]
    }
  }
}
```

### 1.2. Đăng ký schema trong `index.ts` (src/database/schemas/index.ts)

File này sẽ đăng ký tất cả các schema database của bạn với `DatabaseManager`.

```typescript
import { DatabaseSchemaWithTypeMapping } from '../SQLiteDAO';

import * as core from './core.json';
//......

// Ép kiểu rõ ràng tại thời điểm export
export const schemaConfigurations: Record<string, DatabaseSchemaWithTypeMapping> = {
  core,
// ....
};
```

### 1.3. Khởi tạo DatabaseManager khi ứng dụng mới cài đặt và chạy lần đầu

Trong file `App.tsx` hoặc `index.js` chính của ứng dụng:

```typescript
// App.tsx hoặc index.js
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, View, ActivityIndicator, Alert } from 'react-native';
import { DatabaseManager } from './src/database/DatabaseManager';
import { ServiceManager } from './src/database/ServiceManager';
import { UserService } from './src/services/UserService'; // Ví dụ một service cụ thể

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {

        // Khởi tạo tất cả các kết nối database dựa trên schemas đã đăng ký
        await DatabaseManager.initializeAll();
        console.log('✅ DatabaseManager initialized');

        // Đăng ký các services với ServiceManager
        const serviceManager = ServiceManager.getInstance();
        serviceManager.registerService('core', 'users', UserService);
        // Đăng ký các services khác nếu có (e.g., EnterpriseService, StoreService)
        console.log('✅ Services registered');

        // Khởi tạo tất cả các services đã đăng ký
        await serviceManager.initializeAllServices();
        console.log('✅ ServiceManager initialized');

        // Bạn có thể kiểm tra trạng thái của các service
        const healthReport = await serviceManager.healthCheck();
        if (!healthReport.overall) {
          console.warn('⚠️ Một số dịch vụ không hoạt động bình thường:', healthReport);
        }

        setIsInitialized(true);

        // --- Ví dụ sử dụng UserService sau khi khởi tạo thành công ---
        const userService = serviceManager.getService<UserService>('core', 'users');
        if (userService) {
          const newUser = {
            store_id: 'some_store_id', // Thay bằng ID cửa hàng hợp lệ
            username: 'testuser',
            password_hash: 'hashedpassword123',
            full_name: 'Test User',
            email: 'test@example.com',
            role: 'staff',
          };
          
          // Tạo một người dùng mới
          const createdUser = await userService.create(newUser);
          console.log('Created user:', createdUser);

          // Tìm người dùng theo username
          const foundUser = await userService.findByUsername('testuser');
          console.log('Found user:', foundUser);

          // Cập nhật người dùng
          if (foundUser && foundUser.id) {
            const updated = await userService.update(foundUser.id, { email: 'new_email@example.com' });
            console.log('User updated successfully:', updated);
          }

          // Lấy tất cả người dùng
          const allUsers = await userService.findAll();
          console.log('All users:', allUsers);

          // Xóa người dùng (chỉ để demo, cẩn thận khi dùng trong thực tế)
          // if (foundUser && foundUser.id) {
          //   const deleted = await userService.delete(foundUser.id);
          //   console.log('User deleted successfully:', deleted);
          // }

        } else {
          console.error('UserService not available.');
        }

      } catch (err: any) {
        console.error('❌ Lỗi trong quá trình khởi tạo ứng dụng:', err);
        setError(err.message || 'Lỗi không xác định khi khởi tạo.');
        Alert.alert('Lỗi khởi tạo', `Có lỗi xảy ra: ${err.message || err}. Vui lòng thử lại.`);
      }
    };

    initializeApp();

    // Cleanup: đóng tất cả các kết nối khi ứng dụng unmount
    return () => {
      // DatabaseManager.closeAll(); // AppState listener sẽ xử lý việc này
      // ServiceManager.getInstance().closeAllServices();
    };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 18 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!isInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Đang khởi tạo database và services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Ứng dụng đã sẵn sàng!</Text>
      <Text style={{ marginTop: 10 }}>Kiểm tra console để xem log database operations.</Text>
    </SafeAreaView>
  );
};

export default App;
```

## 2\. Sử dụng Service

Sau khi khởi tạo, bạn có thể dễ dàng truy cập và sử dụng các service để thao tác với dữ liệu.

```typescript
// Ví dụ trong một Component hoặc một Business Logic Module
import { ServiceManager } from './src/database/ServiceManager';
import { UserService } from './src/services/UserService';

const myBusinessLogic = async () => {
  try {
    const userService = ServiceManager.getInstance().getService<UserService>('core', 'users');

    if (userService) {
      // Lấy người dùng theo ID
      const user = await userService.findById('some-user-id');
      console.log('User:', user);

      // Cập nhật người dùng
      if (user && user.id) {
        await userService.update(user.id, { email: 'newemail@example.com', phone: '0987654321' });
        console.log('User updated.');
      }

      // Thêm người dùng mới
      const newUser = {
        store_id: 'some_store_id',
        username: 'newuser',
        password_hash: 'hashedpasswordxyz',
        full_name: 'New User',
      };
      const createdUser = await userService.create(newUser);
      console.log('New user created:', createdUser);

      // Xóa người dùng
      // if (createdUser && createdUser.id) {
      //   await userService.delete(createdUser.id);
      //   console.log('User deleted.');
      // }

    } else {
      console.error('UserService chưa được khởi tạo hoặc không tồn tại.');
    }
  } catch (error) {
    console.error('Lỗi khi thực hiện nghiệp vụ:', error);
  }
};

// Gọi logic này khi cần
// myBusinessLogic();
```

## 3\. Quản lý trạng thái ứng dụng (Lifecycle Management)

`DatabaseManager` đã được thiết kế để tự động đóng/mở các kết nối dựa trên trạng thái `AppState` của React Native (foreground/background). Điều này giúp tối ưu hóa tài nguyên và đảm bảo tính toàn vẹn dữ liệu.

## 4\. Xử lý lỗi và sự kiện

`BaseService` và `ServiceManager` cung cấp cơ chế xử lý lỗi và sự kiện để bạn có thể theo dõi và phản ứng với các vấn đề hoặc thay đổi dữ liệu.

```typescript
// Ví dụ lắng nghe lỗi hoặc sự kiện
import { ServiceManager } from './src/database/ServiceManager';
import { UserService } from './src/services/UserService';

const setupListeners = () => {
  const serviceManager = ServiceManager.getInstance();

  // Lắng nghe tất cả các sự kiện từ ServiceManager
  serviceManager.on('*', (event) => {
    console.log('ServiceManager Event:', event);
  });

  // Lắng nghe lỗi từ một service cụ thể (ví dụ UserService)
  const userService = serviceManager.getService<UserService>('core', 'users');
  if (userService) {
    userService.onError((error) => {
      console.error('Lỗi từ UserService:', error.message);
      // Hiển thị thông báo lỗi cho người dùng
      // Alert.alert('Lỗi dữ liệu người dùng', error.message);
    });

    userService.on('recordCreated', (data) => {
      console.log('Record created in UserService:', data);
    });
  }
};

// Gọi hàm này sau khi ứng dụng đã được khởi tạo
// setupListeners();
```

## 5\. Cleaning Up (Dọn dẹp)

Khi ứng dụng đóng hoặc trước khi khởi động lại, bạn nên đảm bảo rằng tất cả các kết nối database và services được đóng một cách an toàn.

```typescript
// Trong App.tsx hoặc nơi quản lý vòng đời ứng dụng
import { DatabaseManager } from './src/database/DatabaseManager';
import { ServiceManager } from './src/database/ServiceManager';

const appCleanup = async () => {
  try {
    // Đóng tất cả services
    const serviceManager = ServiceManager.getInstance();
    await serviceManager.closeAllServices();
    
    // Đóng tất cả database connections
    await DatabaseManager.closeAll();
    
    console.log('✅ App cleanup completed');
  } catch (error) {
    console.error('❌ Error during app cleanup:', error);
  }
};
```

## 7\. Troubleshooting

### 7.1. Kiểm tra database files

```typescript
const debugDatabaseFiles = async () => {
  await DatabaseManager.debugDatabaseFiles(['core']);
};
```

### 7.2. Reset database

```typescript
const resetDatabase = async () => {
  try {
    // Đóng tất cả connections
    await DatabaseManager.closeAll();
    
    // Xóa database files (tùy implementation)
    // await deleteDatabaseFiles();
    
    // Khởi tạo lại
    await DatabaseManager.initializeAll();
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
};
```

## Kết luận

Hệ thống này cung cấp một cách quản lý database SQLite offline mạnh mẽ và linh hoạt cho React Native. Các tính năng chính bao gồm:

  - ✅ Quản lý kết nối database tự động
  - ✅ Service pattern cho từng bảng
  - ✅ Khởi tạo và quản lý lifecycle tự động
  - ✅ Cơ chế xử lý lỗi và sự kiện tập trung
  - ✅ Dễ dàng mở rộng cho nhiều schema và bảng dữ liệu

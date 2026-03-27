# ServiceManager->BaseService->DatabaseManager - Quản lý Cơ sở Dữ liệu Đa vai trò trong React Native
`DatabaseManager.ts` là một lớp quản lý cơ sở dữ liệu mạnh mẽ được viết bằng TypeScript, dùng trong ứng dụng React Native. Lớp này hỗ trợ quản lý kết nối cơ sở dữ liệu theo vai trò người dùng, đồng thời xử lý việc khởi tạo, kết nối, và đóng các kết nối một cách linh hoạt, hiệu quả.

`BaseService` 

---

## 🔧 Tính năng chính

* Khởi tạo cơ sở dữ liệu từ schema định nghĩa
* Mở lại các cơ sở dữ liệu đã có sẵn
* Gán vai trò người dùng và chỉ mở các database cần thiết
* Đóng các database không còn được sử dụng
* Giao dịch xuyên nhiều schema (cross-schema transaction)
* Tự động quản lý kết nối theo trạng thái AppState (foreground/background)
* Hỗ trợ kiểm tra và debug file database trên thiết bị

---

## 🧱 Các thành phần chính

* `SQLiteDAO`: Đối tượng thao tác SQLite (truy vấn, giao dịch)
* `DatabaseFactory`: Tạo/khởi tạo SQLiteDAO từ file hoặc schema
* `schemaConfigurations`: Registry chứa cấu hình schema cho từng database
* `RoleConfig`: Định nghĩa các vai trò người dùng và cơ sở dữ liệu liên quan

---

## 📝 Hướng dẫn sử dụng `DatabaseManager`

### 1. Đăng ký vai trò

```ts
DatabaseManager.registerRoles([
  {
    roleName: 'admin',
    requiredDatabases: ['core', 'users', 'analytics'],
    optionalDatabases: ['reports'],
    priority: 1,
  },
  {
    roleName: 'staff',
    requiredDatabases: ['core', 'users'],
  },
]);
```

### 2. Khởi tạo tất cả cơ sở dữ liệu mới từ schema

```ts
await DatabaseManager.initializeAll();
```

### 3. Mở các cơ sở dữ liệu đã tồn tại

```ts
await DatabaseManager.openAllExisting(['core', 'users']);
```

### 4. Gán vai trò người dùng (khi đăng nhập)

```ts
await DatabaseManager.setCurrentUserRoles(['admin']);
```

### 5. Lấy kết nối cơ sở dữ liệu

```ts
const coreDAO = DatabaseManager.get('core');
```

### 6. Lazy Loading kết nối nếu chưa có

```ts
const analyticsDAO = await DatabaseManager.getLazyLoading('analytics');
```

### 7. Giao dịch nhiều cơ sở dữ liệu

```ts
await DatabaseManager.executeCrossSchemaTransaction(['core', 'users'], async (daos) => {
  await daos.core.runSql('INSERT INTO logs (...) VALUES (...)');
  await daos.users.runSql('UPDATE users SET ...');
});
```

### 8. Đăng xuất người dùng (đóng kết nối trừ `core`)

```ts
await DatabaseManager.logout();
```

### 9. Đóng tất cả kết nối và reset trạng thái

```ts
await DatabaseManager.closeAll();
```

### 10. Kiểm tra file `.db` trên thiết bị

```ts
await DatabaseManager.debugDatabaseFiles(['core', 'users']);
```

---

## 📌 Lưu ý quan trọng

* `core` luôn được kết nối mặc định với bất kỳ vai trò nào.
* Người dùng có thể mang nhiều vai trò cùng lúc.
* Nếu database là *optional*, lỗi khởi tạo sẽ được bỏ qua.
* Mỗi kết nối `SQLiteDAO` đều được lưu trữ tại `connections[key]`.
* Tự động ngắt kết nối khi app chuyển sang background và khôi phục khi trở lại.

---

## 🧩 Hướng dẫn tạo Service từ `BaseService`

Bạn có thể dễ dàng tạo một Service (ví dụ: `UserService`) từ lớp `BaseService` như sau:

### 1. Tạo lớp kế thừa `BaseService`

```ts
import { BaseService } from '../BaseService';

export class UserService extends BaseService {
  constructor() {
    super('core', 'users'); // 'core' là schemaName, 'users' là tên bảng
  }
}

export const userService = new UserService();
```

### 2. Khai báo interface cho dữ liệu

```ts
export interface User {
  id?: string;
  username: string;
  password_hash: string;
  full_name: string;
  store_id: string;
  email?: string;
  // các trường khác tuỳ chỉnh
}
```

### 3. Ghi đè `_validateData()` nếu cần kiểm tra dữ liệu đầu vào

```ts
protected _validateData(data: any): void {
  super._validateData(data);
  if (!data.username || typeof data.username !== 'string') {
    throw new Error('Username is required and must be a string');
  }
}
```

### 4. Thêm các hàm đặc thù (nếu cần)

```ts
async findByUsername(username: string): Promise<User | null> {
  const users = await this.findAll({ username });
  return users.length > 0 ? users[0] : null;
}
```

### 5. Sử dụng trong ứng dụng

```ts
await userService.init();
const users = await userService.findActiveUsers();
```

---

## 🧠 Quản lý Service động với `ServiceManager`

`ServiceManager` là lớp quản lý service trung tâm cho nhiều schema và bảng, hoạt động như một registry toàn cục trong app:

### 1. Đăng ký schema và bảng

```ts
ServiceManager.getInstance().registerSchemas([
  {
    schemaName: 'core',
    defaultPrimaryKeyFields: ['id'],
    defaultServiceClass: BaseService,
    defaultAutoInit: true,
    tables: [
      { tableName: 'users' },
      { tableName: 'stores' },
    ],
  },
]);
```

### 2. Lấy và sử dụng Service

```ts
const userService = await ServiceManager.getInstance().getService('core', 'users');
await userService.create({ username: 'admin', ... });
```

### 3. Khởi tạo toàn bộ services

```ts
await ServiceManager.getInstance().initAllServices();
```

### 4. Thực hiện giao dịch nhiều service (cùng schema hoặc khác schema)

```ts
await ServiceManager.getInstance().executeSchemaTransaction('core', async (services) => {
  const userService = services.get('core:users')!;
  const storeService = services.get('core:stores')!;

  await userService.create({ username: 'abc' });
  await storeService.update(...);
});
```

### 5. Kiểm tra trạng thái & sức khỏe service

```ts
const status = ServiceManager.getInstance().getStatus();
const report = await ServiceManager.getInstance().healthCheck();
```

### 6. Nghe sự kiện service (ví dụ: SERVICE\_CREATED, SERVICE\_ERROR...)

```ts
ServiceManager.getInstance().on('SERVICE_CREATED', (event) => {
  console.log('Service created:', event);
});
```

### 7. Đóng tất cả services khi logout

```ts
await ServiceManager.getInstance().closeAllServices();
```

---

## 📦 Tổng kết

`ServiceManager` kết hợp cùng `BaseService` và `DatabaseManager` giúp bạn:

* Tách biệt logic nghiệp vụ và kết nối DB
* Dễ dàng mở rộng đa bảng, đa schema
* Tối ưu hiệu năng ứng dụng lớn
* Tái sử dụng, kiểm thử và bảo trì dễ dàng

> 💡 Mẹo: Bạn có thể viết `CustomService` để kế thừa `BaseService`, rồi đăng ký vào `ServiceManager` theo bảng tương ứng để tối ưu toàn bộ luồng dữ liệu!

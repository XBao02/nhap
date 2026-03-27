# 🧩 Hướng dẫn tạo Service từ `BaseService`

Bạn có thể dễ dàng tạo một Service (ví dụ: `UserService`) từ lớp `BaseService` như sau:

### 1. Tạo lớp kế thừa `BaseService`

```ts
import { BaseService } from '../BaseService';

export class UserService extends BaseService {
  constructor() { Hướng dẫn tạo Service từ BaseService

Bạn có thể dễ dàng tạo một Service (ví dụ: UserService) từ lớp BaseService như sau:

1. Tạo lớp kế thừa BaseService

import { BaseService } from '../BaseService';

export class UserService extends BaseService {
  constructor() {
    super('core', 'users'); // 'core' là schemaName, 'users' là tên bảng
  }
}

export const userService = new UserService();

2. Khai báo interface cho dữ liệu

export interface User {
  id?: string;
  username: string;
  password_hash: string;
  full_name: string;
  store_id: string;
  email?: string;
  ... // các trường khác tuỳ chỉnh
}


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
  ... // các trường khác tuỳ chỉnh
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

## 🎯 Gợi ý mở rộng Service

* Ghi đè `create()` để tự động thêm thời gian tạo/sửa
* Thêm logic login/logout, khóa tài khoản, đếm lượt sai mật khẩu
* Tùy biến câu truy vấn (WHERE nâng cao, join bảng, ...)
* Kết hợp `DatabaseManager` để tạo các Service đa schema

---

> `BaseService` là xương sống giúp bạn tách riêng logic nghiệp vụ, tăng tái sử dụng, dễ kiểm thử và bảo trì ứng dụng nhiều bảng, nhiều schema.

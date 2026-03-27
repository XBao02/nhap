# DatabaseFactory

DatabaseFactory là một lớp tiện ích mạnh mẽ được thiết kế để tạo và quản lý các instance SQLiteDAO từ schema JSON một cách dễ dàng và an toàn. Nó cung cấp các phương thức để tạo mới, mở existing database, kiểm tra tính toàn vẹn và quản lý vòng đời của database.

## Tính năng chính

- ✅ Tạo database từ schema JSON (file, object, hoặc asset)
- ✅ Kiểm tra sự tồn tại và tính hợp lệ của database
- ✅ Tự động mở database existing hoặc tạo mới khi cần
- ✅ Validation schema version để tránh incompatibility
- ✅ Integrity check để phát hiện database bị corrupt
- ✅ Debug utilities để troubleshoot
- ✅ Hỗ trợ custom directory cho database files
- ✅ Cross-platform (iOS & Android)

## Cài đặt dependencies

```bash
npm install react-native-fs react-native-sqlite-2
# hoặc
yarn add react-native-fs react-native-sqlite-2
```

## Import

```typescript
import DatabaseFactory from './path/to/DatabaseFactory';
// hoặc
import { DatabaseFactory } from './path/to/DatabaseFactory';
```

## Cách sử dụng cơ bản

### 1. Tạo database từ JSON file

```typescript
// Tạo database từ file JSON trong bundle
const dao = await DatabaseFactory.createFromPath('schemas/database-config.json', {
  dbDirectory: '/custom/path', // optional
  debug: true // optional
});

// Sử dụng DAO
const users = await dao.getAll('users');
console.log('Users:', users);
```

### 2. Tạo database từ config object

```typescript
const config = {
  database_name: "my_app.db",
  version: "1.0.0",
  schemas: {
    users: {
      columns: {
        id: { type: "INTEGER", constraints: "PRIMARY KEY AUTOINCREMENT" },
        name: { type: "TEXT", constraints: "NOT NULL" },
        email: { type: "TEXT", constraints: "UNIQUE" }
      }
    }
  }
};

const dao = await DatabaseFactory.createFromConfig(config, {
  debug: __DEV__
});
```

### 3. Tạo database từ imported JSON asset

```typescript
import databaseSchema from './assets/database-schema.json';

const dao = await DatabaseFactory.createFromAsset(databaseSchema, {
  dbDirectory: RNFS.DocumentDirectoryPath
});
```

### 4. Smart create/open - Phương thức thông minh (Recommended)

```typescript
// Tự động kiểm tra và mở existing database hoặc tạo mới
const dao = await DatabaseFactory.createOrOpen({
  configPath: 'schemas/app-database.json',
  dbDirectory: RNFS.DocumentDirectoryPath,
  debug: __DEV__
});

// Force recreate nếu muốn tạo lại database
const dao = await DatabaseFactory.createOrOpen({
  config: mySchemaObject
}, true); // forceRecreate = true
```

## API Reference

### Phương thức chính

#### `createOrOpen(options, forceRecreate?)`
Phương thức thông minh nhất - tự động kiểm tra và quyết định mở existing hoặc tạo mới.

```typescript
interface DbFactoryOptions {
  config?: DatabaseSchemaWithTypeMapping;     // Schema object
  configPath?: string;                        // Path to JSON file
  configAsset?: any;                          // Imported JSON asset
  dbDirectory?: string;                       // Custom DB directory
  debug?: boolean;                            // Enable debug logging
}

const dao = await DatabaseFactory.createOrOpen(options, forceRecreate);
```

#### `create(options)`
Tạo database mới (sẽ overwrite nếu đã tồn tại).

```typescript
const dao = await DatabaseFactory.create({
  configPath: 'database-schema.json',
  debug: true
});
```

#### `openExisting(dbName, options?)`
Mở database đã tồn tại mà không initialize schema.

```typescript
const dao = await DatabaseFactory.openExisting('my_app.db', {
  dbDirectory: '/custom/path',
  debug: false
});
```

### Phương thức tiện ích

#### `checkDatabaseExists(dbName, customDirectory?)`
Kiểm tra sự tồn tại của database file.

```typescript
const info = await DatabaseFactory.checkDatabaseExists('my_app.db');
console.log('Exists:', info.exists);
console.log('Path:', info.path);
console.log('Size:', info.size);
console.log('Last modified:', info.lastModified);
```

#### `validateDatabaseFile(dbName, customDirectory?)`
Kiểm tra tính hợp lệ của database file bằng integrity check.

```typescript
const isValid = await DatabaseFactory.validateDatabaseFile('my_app.db');
if (!isValid) {
  console.log('Database file is corrupted or invalid');
}
```

#### `debugDatabaseDirectory(customDirectory?)`
Debug utility để liệt kê tất cả files trong database directory.

```typescript
await DatabaseFactory.debugDatabaseDirectory();
// Logs all files in default database directory

await DatabaseFactory.debugDatabaseDirectory('/custom/path');
// Logs all files in custom directory
```

## Ví dụ Schema JSON

```json
{
  "database_name": "my_app",
  "version": "1.2.0",
  "schemas": {
    "users": {
      "columns": {
        "id": {
          "type": "INTEGER",
          "constraints": "PRIMARY KEY AUTOINCREMENT"
        },
        "name": {
          "type": "TEXT",
          "constraints": "NOT NULL"
        },
        "email": {
          "type": "TEXT",
          "constraints": "UNIQUE NOT NULL"
        },
        "created_at": {
          "type": "DATETIME",
          "constraints": "DEFAULT CURRENT_TIMESTAMP"
        }
      },
      "indexes": [
        {
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true
        }
      ]
    },
    "posts": {
      "columns": {
        "id": {
          "type": "INTEGER",
          "constraints": "PRIMARY KEY AUTOINCREMENT"
        },
        "user_id": {
          "type": "INTEGER",
          "constraints": "NOT NULL REFERENCES users(id)"
        },
        "title": {
          "type": "TEXT",
          "constraints": "NOT NULL"
        },
        "content": {
          "type": "TEXT"
        }
      }
    }
  }
}
```

## Best Practices

### 1. Sử dụng createOrOpen cho production
```typescript
// ✅ Recommended - Safe và intelligent
const dao = await DatabaseFactory.createOrOpen({
  configPath: 'schemas/production-db.json',
  debug: __DEV__
});
```

### 2. Error handling
```typescript
try {
  const dao = await DatabaseFactory.createOrOpen({
    configAsset: mySchema
  });
  
  // Sử dụng DAO
  const data = await dao.getAll('users');
  
} catch (error) {
  console.error('Database initialization failed:', error);
  // Handle error appropriately
}
```

### 3. Kiểm tra database trước khi sử dụng
```typescript
const dbExists = await DatabaseFactory.checkDatabaseExists('my_app');
if (dbExists.exists) {
  const isValid = await DatabaseFactory.validateDatabaseFile('my_app');
  if (!isValid) {
    console.warn('Database file is corrupted, will recreate');
    // Force recreate
    const dao = await DatabaseFactory.createOrOpen({ config }, true);
  }
}
```

### 4. Debug khi có vấn đề
```typescript
// Kiểm tra files trong database directory
await DatabaseFactory.debugDatabaseDirectory();

// Kiểm tra thông tin chi tiết database
const info = await DatabaseFactory.checkDatabaseExists('my_app');
console.log('Database info:', info);
```

### 5. Quản lý connection
```typescript
let dao: SQLiteDAO | null = null;

try {
  dao = await DatabaseFactory.createOrOpen({ config });
  
  // Sử dụng DAO
  await dao.insert('users', { name: 'John', email: 'john@example.com' });
  
} finally {
  // Luôn đóng connection khi xong
  if (dao) {
    await dao.close();
  }
}
```

## Troubleshooting

### Lỗi "Database file does not exist"
```typescript
// Kiểm tra path và directory
await DatabaseFactory.debugDatabaseDirectory();

// Hoặc sử dụng createOrOpen thay vì openExisting
const dao = await DatabaseFactory.createOrOpen({ configPath: 'schema.json' });
```

### Lỗi "Schema version mismatch"
```typescript
// Force recreate database với schema mới
const dao = await DatabaseFactory.createOrOpen({ config }, true);
```

### Database bị corrupt
```typescript
const isValid = await DatabaseFactory.validateDatabaseFile('my_app');
if (!isValid) {
  // Xóa file cũ và tạo lại
  const dao = await DatabaseFactory.createOrOpen({ config }, true);
}
```

### Debug logging
Bật debug để xem chi tiết quá trình:

```typescript
const dao = await DatabaseFactory.createOrOpen({
  configPath: 'schema.json',
  debug: true // Sẽ log tất cả operations
});
```

## Platform Notes

- **iOS**: Database files được lưu trong `DocumentDirectoryPath`
- **Android**: Database files được lưu trong `DocumentDirectoryPath`
- **Custom directory**: Có thể chỉ định custom path thông qua `dbDirectory` option

## Performance Tips

1. Sử dụng `openExisting()` khi biết chắc database đã tồn tại và valid
2. Bật `debug: false` trong production để tăng performance
3. Sử dụng `createOrOpen()` cho hầu hết use cases
4. Cache DAO instance thay vì tạo mới mỗi lần sử dụng
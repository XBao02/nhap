# SQLiteDAO - Tài liệu Kỹ thuật

## Giới thiệu

SQLiteDAO là một lớp TypeScript cung cấp interface đơn giản và mạnh mẽ để làm việc với cơ sở dữ liệu SQLite trong React Native. Thư viện này hỗ trợ:

- Quản lý kết nối và transaction
- Tạo bảng từ schema JSON
- Các thao tác CRUD cơ bản
- Import/Export dữ liệu từ CSV
- Type mapping linh hoạt
- Validation và transformation dữ liệu

## Cài đặt và Khởi tạo

### Prerequisites

```bash
npm install react-native-sqlite-storage
```

### Khởi tạo cơ bản

```typescript
import SQLiteDAO from './SQLiteDAO';

// Tạo instance
const dao = new SQLiteDAO('database.db', true); // true để bật debug mode

// Kết nối đến database
await dao.connect();

// Kiểm tra trạng thái kết nối
if (dao.isConnected()) {
  console.log('Database connected successfully');
}
```

## Interfaces và Types

### Các Interface chính

```typescript
// Định nghĩa column
interface ColumnDefinition {
  name: string;
  type: string;
  option_key?: string;
  description?: string;
  nullable?: boolean;
  default?: any;
  primary_key?: boolean;
  auto_increment?: boolean;
  unique?: boolean;
  constraints?: string;
  length?: number;
}

// Định nghĩa bảng
interface TableDefinition {
  name: string;
  cols: ColumnDefinition[];
  description?: string;
  indexes?: IndexDefinition[];
  foreign_keys?: ForeignKeyDefinition[];
}

// Query table cho CRUD operations
interface QueryTable {
  name: string;
  cols: Column[];
  wheres?: WhereClause[];
  orderbys?: OrderByClause[];
  limitOffset?: LimitOffset;
}
```

### Type Mapping

```typescript
interface TypeMappingConfig {
  type_mapping: {
    [targetType: string]: {
      [sourceType: string]: string;
    };
  };
}
```

## Quản lý Schema và Bảng

### Khởi tạo Database từ Schema JSON

```typescript
// Schema configuration
const schema: DatabaseSchemaWithTypeMapping = {
  version: "1.0",
  database_name: "my_app_db",
  description: "Application database",
  type_mapping: {
    sqlite: {
      string: "TEXT",
      integer: "INTEGER",
      boolean: "INTEGER",
      datetime: "TEXT"
    }
  },
  schemas: {
    users: {
      description: "User table",
      cols: [
        {
          name: "id",
          type: "integer",
          constraints: "PRIMARY KEY AUTO_INCREMENT"
        },
        {
          name: "email",
          type: "string",
          constraints: "NOT NULL UNIQUE"
        },
        {
          name: "name",
          type: "string",
          constraints: "NOT NULL"
        },
        {
          name: "created_at",
          type: "datetime",
          constraints: "DEFAULT CURRENT_TIMESTAMP"
        }
      ],
      indexes: [
        {
          name: "idx_users_email",
          columns: ["email"],
          unique: true
        }
      ]
    },
    posts: {
      cols: [
        {
          name: "id",
          type: "integer",
          constraints: "PRIMARY KEY AUTO_INCREMENT"
        },
        {
          name: "user_id",
          type: "integer",
          constraints: "NOT NULL"
        },
        {
          name: "title",
          type: "string",
          constraints: "NOT NULL"
        },
        {
          name: "content",
          type: "string"
        }
      ],
      foreign_keys: [
        {
          name: "fk_posts_user",
          column: "user_id",
          references: {
            table: "users",
            column: "id"
          },
          on_delete: "CASCADE"
        }
      ]
    }
  }
};

// Khởi tạo database từ schema
await dao.initializeFromSchema(schema);
```

### Tạo bảng thủ công

```typescript
const userTable: TableDefinition = {
  name: "users",
  cols: [
    {
      name: "id",
      type: "INTEGER",
      primary_key: true,
      auto_increment: true
    },
    {
      name: "email",
      type: "TEXT",
      nullable: false,
      unique: true
    },
    {
      name: "name",
      type: "TEXT",
      nullable: false
    }
  ]
};

await dao.createTableWithForeignKeys(userTable);
```

## Thao tác CRUD

### Insert

```typescript
const insertTable: QueryTable = {
  name: "users",
  cols: [
    { name: "email", value: "john@example.com" },
    { name: "name", value: "John Doe" }
  ]
};

await dao.insert(insertTable);

// Hoặc sử dụng JSON helper
const userData = {
  email: "jane@example.com",
  name: "Jane Smith"
};

const queryTable = dao.convertJsonToQueryTable("users", userData);
await dao.insert(queryTable);
```

### Select

```typescript
// Select một record
const selectTable: QueryTable = {
  name: "users",
  cols: [{ name: "id" }, { name: "email" }, { name: "name" }],
  wheres: [{ name: "email", value: "john@example.com" }]
};

const user = await dao.select(selectTable);

// Select tất cả records
const allUsers = await dao.selectAll({
  name: "users",
  cols: [],
  orderbys: [{ name: "created_at", direction: "DESC" }],
  limitOffset: { limit: 10, offset: 0 }
});
```

### Update

```typescript
const updateTable: QueryTable = {
  name: "users",
  cols: [
    { name: "name", value: "John Updated" }
  ],
  wheres: [
    { name: "id", value: 1 }
  ]
};

await dao.update(updateTable);
```

### Delete

```typescript
const deleteTable: QueryTable = {
  name: "users",
  cols: [],
  wheres: [{ name: "id", value: 1 }]
};

await dao.delete(deleteTable);
```

## Import/Export Dữ liệu

### Import từ Array

```typescript
const importData = [
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" },
  { email: "user3@example.com", name: "User 3" }
];

const options: ImportOptions = {
  tableName: "users",
  data: importData,
  batchSize: 1000,
  skipErrors: true,
  validateData: true,
  updateOnConflict: true,
  conflictColumns: ["email"],
  includeAutoIncrementPK: false, // Bỏ qua auto increment PK
  onProgress: (processed, total) => {
    console.log(`Progress: ${processed}/${total}`);
  },
  onError: (error, rowIndex, rowData) => {
    console.error(`Error at row ${rowIndex}:`, error.message);
  }
};

const result = await dao.importData(options);
console.log(`Import completed: ${result.successRows}/${result.totalRows} successful`);
```

### Import với Column Mapping

```typescript
const mappings: ColumnMapping[] = [
  { 
    sourceColumn: "user_email", 
    targetColumn: "email" 
  },
  { 
    sourceColumn: "full_name", 
    targetColumn: "name",
    transform: (value) => value.toUpperCase() // Transform function
  }
];

await dao.importDataWithMapping("users", rawData, mappings, {
  batchSize: 500,
  skipErrors: true
});
```

### Import từ CSV

```typescript
const csvData = `
email,name,age
john@example.com,John Doe,25
jane@example.com,Jane Smith,30
bob@example.com,Bob Wilson,35
`;

const result = await dao.importFromCSV("users", csvData, {
  delimiter: ",",
  hasHeader: true,
  validateData: true,
  columnMappings: [
    { sourceColumn: "email", targetColumn: "email" },
    { sourceColumn: "name", targetColumn: "name" }
    // Bỏ qua column "age" nếu không có trong schema
  ]
});
```

## Transaction Management

```typescript
try {
  await dao.beginTransaction();
  
  // Thực hiện multiple operations
  await dao.insert(userTable);
  await dao.insert(postTable);
  await dao.update(updateTable);
  
  await dao.commitTransaction();
} catch (error) {
  await dao.rollbackTransaction();
  throw error;
}
```

## Utilities

### Lấy thông tin Database

```typescript
const dbInfo = await dao.getDatabaseInfo();
console.log(dbInfo);
// Output: { name: "database.db", tables: ["users", "posts"], isConnected: true, version: 0 }
```

### Lấy thông tin Table

```typescript
const tableInfo = await dao.getTableInfo("users");
console.log(tableInfo);
// Output: Array of column information
```

### Xóa bảng

```typescript
await dao.dropTable("old_table");
```

## Type Mapping và Data Conversion

### Cấu hình Type Mapping

```typescript
const typeMapping = {
  sqlite: {
    "string": "TEXT",
    "varchar": "TEXT", 
    "email": "TEXT",
    "integer": "INTEGER",
    "bigint": "INTEGER",
    "boolean": "INTEGER",
    "decimal": "REAL",
    "datetime": "TEXT",
    "json": "TEXT"
  }
};

dao.setTypeMappingConfig(typeMapping);
```

### Data Conversion

Thư viện tự động convert các kiểu dữ liệu:

- `boolean` → `INTEGER` (0/1)
- `Date` → `TEXT` (ISO string)
- `Object` → `TEXT` (JSON string)
- `number` → `INTEGER/REAL`
- `string` → `TEXT`

## Error Handling

```typescript
try {
  await dao.importData(options);
} catch (error) {
  if (dao.isConflictError(error)) {
    console.log("Conflict error - duplicate data");
  } else {
    console.error("Import error:", error.message);
  }
}
```

## Performance Tips

1. **Sử dụng Transactions**: Luôn wrap multiple operations trong transaction
2. **Batch Processing**: Sử dụng `batchSize` hợp lý (1000-5000)
3. **Index**: Tạo index cho các column được query thường xuyên
4. **Validation**: Chỉ bật `validateData` khi cần thiết
5. **Connection Pool**: Tái sử dụng connection thay vì tạo mới

## Ví dụ đầy đủ

```typescript
import SQLiteDAO from './SQLiteDAO';

class UserService {
  private dao: SQLiteDAO;
  
  constructor() {
    this.dao = new SQLiteDAO('app.db');
  }
  
  async initialize() {
    await this.dao.connect();
    
    const schema = {
      version: "1.0",
      database_name: "app_db",
      schemas: {
        users: {
          cols: [
            { name: "id", type: "integer", constraints: "PRIMARY KEY AUTO_INCREMENT" },
            { name: "email", type: "string", constraints: "NOT NULL UNIQUE" },
            { name: "name", type: "string", constraints: "NOT NULL" }
          ]
        }
      }
    };
    
    await this.dao.initializeFromSchema(schema);
  }
  
  async createUser(userData: { email: string; name: string }) {
    const queryTable = this.dao.convertJsonToQueryTable("users", userData);
    return await this.dao.insert(queryTable);
  }
  
  async getUser(email: string) {
    return await this.dao.select({
      name: "users",
      cols: [],
      wheres: [{ name: "email", value: email }]
    });
  }
  
  async importUsers(csvData: string) {
    return await this.dao.importFromCSV("users", csvData, {
      hasHeader: true,
      validateData: true,
      skipErrors: false
    });
  }
  
  async cleanup() {
    await this.dao.close();
  }
}

// Sử dụng
const userService = new UserService();
await userService.initialize();
await userService.createUser({ email: "test@example.com", name: "Test User" });
const user = await userService.getUser("test@example.com");
await userService.cleanup();
```

## Lưu ý quan trọng

1. **Luôn gọi `connect()`** trước khi sử dụng bất kỳ operation nào
2. **Sử dụng transaction** cho multiple operations để đảm bảo consistency
3. **Đóng connection** sau khi sử dụng xong bằng `close()`
4. **Validate data** khi import từ external sources
5. **Handle errors** properly trong production code
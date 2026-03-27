# Hướng dẫn Định nghĩa Schema Database cho SQLiteDAO

## Tổng quan

Tài liệu này hướng dẫn cách định nghĩa schema database theo format JSON để sử dụng với SQLiteDAO. Schema được thiết kế để tương thích hoàn toàn với SQLiteDAO và hỗ trợ tất cả các tính năng như type mapping, foreign keys, indexes, và constraints.

## Cấu trúc Schema JSON

### Format tổng quát

```json
{
  "version": "string",
  "database_name": "string", 
  "description": "string",
  "type_mapping": {
    "sqlite": {
      "generic_type": "sqlite_type"
    }
  },
  "schemas": {
    "table_name": {
      "description": "string",
      "cols": [...],
      "indexes": [...],
      "foreign_keys": [...]
    }
  }
}
```

### Các thuộc tính cấp cao

| Thuộc tính | Kiểu | Bắt buộc | Mô tả |
|------------|------|----------|-------|
| `version` | string | Có | Phiên bản schema (vd: "v1", "1.0") |
| `database_name` | string | Có | Tên file database (.db) |
| `description` | string | Không | Mô tả database |
| `type_mapping` | object | Không | Cấu hình mapping kiểu dữ liệu |
| `schemas` | object | Có | Định nghĩa các bảng |

## Type Mapping Configuration

### Cấu hình chuẩn cho SQLite

```json
{
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
  }
}
```

### Các kiểu dữ liệu được hỗ trợ

| Generic Type | SQLite Type | Mô tả |
|--------------|-------------|-------|
| `string` | TEXT | Chuỗi văn bản |
| `varchar` | TEXT | Chuỗi có độ dài giới hạn |
| `email` | TEXT | Định dạng email |
| `url` | TEXT | Định dạng URL |
| `uuid` | TEXT | UUID string |
| `integer` | INTEGER | Số nguyên |
| `bigint` | INTEGER | Số nguyên lớn |
| `decimal` | REAL | Số thập phân |
| `boolean` | INTEGER | Boolean (0/1) |
| `timestamp` | TEXT | Timestamp ISO |
| `json` | TEXT | JSON string |

## Định nghĩa Column

### Cấu trúc Column Definition

```json
{
  "name": "column_name",
  "type": "data_type",
  "length": 255,
  "precision": 10,
  "scale": 2,
  "constraints": "constraint_string",
  "description": "column_description",
  "enum": ["value1", "value2"],
  "nullable": false,
  "default": "default_value",
  "primary_key": true,
  "auto_increment": true,
  "unique": true
}
```

### Thuộc tính Column

| Thuộc tính | Kiểu | Bắt buộc | Mô tả |
|------------|------|----------|-------|
| `name` | string | Có | Tên column |
| `type` | string | Có | Kiểu dữ liệu generic |
| `length` | number | Không | Độ dài tối đa (cho TEXT) |
| `precision` | number | Không | Precision cho DECIMAL |
| `scale` | number | Không | Scale cho DECIMAL |
| `constraints` | string | Không | Chuỗi constraints SQLite |
| `description` | string | Không | Mô tả column |
| `enum` | array | Không | Các giá trị enum cho phép |

### Cách viết Constraints

Constraints được viết dưới dạng chuỗi SQLite chuẩn:

```json
{
  "constraints": "NOT NULL UNIQUE PRIMARY KEY"
}
```

```json
{
  "constraints": "PRIMARY KEY AUTO_INCREMENT" 
}
```

```json
{
  "constraints": "NOT NULL DEFAULT 'active'"
}
```

```json
{
  "constraints": "DEFAULT CURRENT_TIMESTAMP"
}
```

### Ví dụ các Column phổ biến

#### Primary Key Auto Increment

```json
{
  "name": "id",
  "type": "bigint",
  "constraints": "PRIMARY KEY AUTO_INCREMENT",
  "description": "ID tự tăng"
}
```

#### UUID Primary Key

```json
{
  "name": "id", 
  "type": "uuid",
  "constraints": "NOT NULL UNIQUE PRIMARY KEY",
  "description": "UUID primary key"
}
```

#### Email với validation

```json
{
  "name": "email",
  "type": "email", 
  "constraints": "UNIQUE",
  "description": "Địa chỉ email duy nhất"
}
```

#### Enum column

```json
{
  "name": "status",
  "type": "varchar",
  "length": 20,
  "constraints": "DEFAULT 'active'",
  "enum": ["active", "inactive", "suspended"],
  "description": "Trạng thái"
}
```

#### JSON column

```json
{
  "name": "metadata",
  "type": "json",
  "description": "Dữ liệu JSON"
}
```

#### Timestamp columns

```json
{
  "name": "created_at",
  "type": "timestamp", 
  "constraints": "DEFAULT CURRENT_TIMESTAMP",
  "description": "Thời gian tạo"
}
```

## Định nghĩa Index

### Cấu trúc Index Definition

```json
{
  "name": "index_name",
  "columns": ["column1", "column2"],
  "unique": false,
  "description": "index_description"
}
```

### Các loại Index

#### Single Column Index

```json
{
  "name": "idx_users_email",
  "columns": ["email"],
  "unique": true,
  "description": "Index duy nhất cho email"
}
```

#### Composite Index

```json
{
  "name": "idx_users_store_role", 
  "columns": ["store_id", "role"],
  "unique": false,
  "description": "Index composite cho store và role"
}
```

#### Performance Index

```json
{
  "name": "idx_sessions_expires_at",
  "columns": ["expires_at"],
  "unique": false, 
  "description": "Index cho cleanup expired sessions"
}
```

### Best Practices cho Index

1. **Primary Key**: Luôn tự động có index
2. **Foreign Key**: Nên tạo index cho hiệu suất JOIN
3. **WHERE clauses**: Tạo index cho columns thường xuyên filter
4. **ORDER BY**: Tạo index cho columns thường xuyên sort
5. **Unique constraints**: Sử dụng unique index
6. **Composite index**: Thứ tự columns quan trọng (selective nhất trước)

## Định nghĩa Foreign Key

### Cấu trúc Foreign Key Definition

```json
{
  "name": "fk_name",
  "column": "local_column", 
  "references": {
    "table": "reference_table",
    "column": "reference_column"
  },
  "on_delete": "action",
  "on_update": "action", 
  "description": "fk_description"
}
```

### Các Reference Actions

| Action | Mô tả |
|--------|--------|
| `CASCADE` | Xóa/cập nhật cascade |
| `RESTRICT` | Không cho phép xóa/cập nhật |
| `SET NULL` | Set NULL khi parent bị xóa |
| `NO ACTION` | Không làm gì (default) |

### Ví dụ Foreign Keys

#### Basic Foreign Key

```json
{
  "name": "fk_users_store_id",
  "column": "store_id",
  "references": {
    "table": "stores", 
    "column": "id"
  },
  "on_delete": "CASCADE",
  "on_update": "CASCADE",
  "description": "Liên kết với bảng stores"
}
```

## Schema Example - Hệ thống Core

### Bảng Enterprises

```json
{
  "enterprises": {
    "description": "Bảng quản lý thông tin các doanh nghiệp",
    "cols": [
      {
        "name": "id",
        "type": "uuid",
        "constraints": "NOT NULL UNIQUE PRIMARY KEY",
        "description": "Mã định danh duy nhất của doanh nghiệp"
      },
      {
        "name": "name", 
        "type": "varchar",
        "length": 255,
        "constraints": "NOT NULL",
        "description": "Tên chính thức của doanh nghiệp"
      },
      {
        "name": "business_type",
        "type": "varchar", 
        "length": 100,
        "description": "Loại hình kinh doanh",
        "enum": ["ltd", "joint_stock", "private", "partnership"]
      },
      {
        "name": "industries",
        "type": "json",
        "length": 1024,
        "description": "Các ngành nghề kinh doanh"
      },
      {
        "name": "status",
        "type": "varchar",
        "length": 20, 
        "constraints": "DEFAULT 'active'",
        "enum": ["active", "inactive", "suspended", "pending"],
        "description": "Trạng thái hoạt động"
      },
      {
        "name": "created_at",
        "type": "timestamp",
        "constraints": "DEFAULT CURRENT_TIMESTAMP",
        "description": "Thời gian tạo bản ghi"
      }
    ],
    "indexes": [
      {
        "name": "idx_enterprises_tax_code",
        "columns": ["tax_code"],
        "unique": true,
        "description": "Index duy nhất cho mã số thuế"
      },
      {
        "name": "idx_enterprises_status_plan", 
        "columns": ["status", "subscription_plan"],
        "unique": false,
        "description": "Index composite cho trạng thái và gói dịch vụ"
      }
    ]
  }
}
```

### Bảng với Foreign Key

```json
{
  "stores": {
    "description": "Bảng quản lý thông tin các cửa hàng",
    "cols": [
      {
        "name": "id",
        "type": "uuid", 
        "constraints": "NOT NULL UNIQUE PRIMARY KEY",
        "description": "Mã định danh duy nhất của cửa hàng"
      },
      {
        "name": "enterprise_id",
        "type": "uuid",
        "constraints": "NOT NULL", 
        "description": "Mã doanh nghiệp sở hữu"
      },
      {
        "name": "name",
        "type": "varchar",
        "length": 255,
        "constraints": "NOT NULL",
        "description": "Tên cửa hàng"
      }
    ],
    "indexes": [
      {
        "name": "idx_stores_enterprise_id",
        "columns": ["enterprise_id"],
        "unique": false,
        "description": "Index cho enterprise_id"
      }
    ],
    "foreign_keys": [
      {
        "name": "fk_stores_enterprise_id",
        "column": "enterprise_id", 
        "references": {
          "table": "enterprises",
          "column": "id"
        },
        "on_delete": "CASCADE",
        "on_update": "CASCADE",
        "description": "Khóa ngoại liên kết với enterprises"
      }
    ]
  }
}
```

## Validation Rules và Best Practices

### Column Naming

- Sử dụng snake_case: `user_id`, `created_at`
- Tên rõ ràng, có nghĩa: `full_name` thay vì `name`
- Suffix cho timestamps: `_at` (created_at, updated_at)
- Suffix cho boolean: `is_`, `has_`, `can_` (is_active, has_permission)

### Table Naming

- Sử dụng số nhiều: `users`, `orders`, `products`
- Snake_case: `user_sessions`, `order_items`
- Tên ngắn gọn nhưng rõ nghĩa

### Index Naming

- Prefix: `idx_`
- Format: `idx_{table}_{column(s)}`
- Ví dụ: `idx_users_email`, `idx_orders_user_id_status`

### Foreign Key Naming

- Prefix: `fk_`
- Format: `fk_{table}_{column}`
- Ví dụ: `fk_orders_user_id`, `fk_order_items_product_id`

### Data Types Best Practices

1. **Primary Keys**: 
   - UUID cho distributed systems
   - BIGINT AUTO_INCREMENT cho single instance

2. **Timestamps**: 
   - Luôn sử dụng `timestamp` type
   - Có `created_at` và `updated_at`

3. **Status/Enum fields**:
   - Sử dụng VARCHAR với enum values
   - Luôn có default value

4. **JSON fields**:
   - Dùng cho dữ liệu flexible/metadata
   - Có schema validation nếu cần

5. **Boolean fields**:
   - Prefix rõ ràng (is_, has_, can_)
   - Luôn có default value

## Ví dụ Schema hoàn chỉnh

```json
{
  "version": "v1",
  "database_name": "core.db", 
  "description": "Database hệ thống core",
  "type_mapping": {
    "sqlite": {
      "uuid": "TEXT",
      "varchar": "TEXT",
      "email": "TEXT",
      "url": "TEXT", 
      "integer": "INTEGER",
      "bigint": "INTEGER",
      "boolean": "INTEGER",
      "timestamp": "TEXT",
      "json": "TEXT"
    }
  },
  "schemas": {
    "enterprises": {
      "description": "Bảng doanh nghiệp",
      "cols": [
        {
          "name": "id",
          "type": "uuid",
          "constraints": "NOT NULL UNIQUE PRIMARY KEY"
        },
        {
          "name": "name",
          "type": "varchar", 
          "length": 255,
          "constraints": "NOT NULL"
        },
        {
          "name": "status",
          "type": "varchar",
          "length": 20,
          "constraints": "DEFAULT 'active'",
          "enum": ["active", "inactive"]
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "constraints": "DEFAULT CURRENT_TIMESTAMP"
        }
      ],
      "indexes": [
        {
          "name": "idx_enterprises_status",
          "columns": ["status"],
          "unique": false
        }
      ]
    },
    "stores": {
      "description": "Bảng cửa hàng",
      "cols": [
        {
          "name": "id",
          "type": "uuid", 
          "constraints": "NOT NULL UNIQUE PRIMARY KEY"
        },
        {
          "name": "enterprise_id",
          "type": "uuid",
          "constraints": "NOT NULL"
        },
        {
          "name": "name",
          "type": "varchar",
          "length": 255,
          "constraints": "NOT NULL"
        }
      ],
      "indexes": [
        {
          "name": "idx_stores_enterprise_id",
          "columns": ["enterprise_id"], 
          "unique": false
        }
      ],
      "foreign_keys": [
        {
          "name": "fk_stores_enterprise_id",
          "column": "enterprise_id",
          "references": {
            "table": "enterprises",
            "column": "id"
          },
          "on_delete": "CASCADE",
          "on_update": "CASCADE"
        }
      ]
    }
  }
}
```

## Sử dụng với SQLiteDAO

```typescript
import SQLiteDAO from './SQLiteDAO';
import coreSchema from './core-schema.json';

const dao = new SQLiteDAO('core.db', true);

// Kết nối và khởi tạo schema
async function initializeDatabase() {
  await dao.connect();
  await dao.initializeFromSchema(coreSchema);
  console.log('Database initialized successfully');
}

// Sử dụng
initializeDatabase().catch(console.error);
```

## Checklist kiểm tra Schema

- [ ] Có version và database_name
- [ ] Type mapping được cấu hình đầy đủ
- [ ] Tất cả bảng có description
- [ ] Primary key được định nghĩa rõ ràng
- [ ] Foreign key relationships chính xác
- [ ] Index được tạo cho performance
- [ ] Enum values được liệt kê đầy đủ
- [ ] Timestamp columns có default value
- [ ] Boolean fields có default value
- [ ] Column naming consistent
- [ ] Constraints được viết đúng syntax SQLite
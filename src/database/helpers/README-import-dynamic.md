# 📘 Hướng dẫn sử dụng hệ thống Import dữ liệu cho SQLite

Hệ thống này cung cấp bộ công cụ linh hoạt để import dữ liệu vào SQLite dựa trên **JSON Schema**, hỗ trợ đầy đủ validation, batch processing, mapping cột, xử lý lỗi, và thống kê sau import.

---

## 📑 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Các thành phần chính](#các-thành-phần-chính)

   * [SQLiteDAO (phương thức cơ bản)](#sqlite-dao-phương-thức-cơ-bản)
   * [DatabaseManager (quản lý cấp cao)](#databasemanager-quản-lý-cấp-cao)
3. [Tính năng nổi bật](#tính-năng-nổi-bật)
4. [Các trường hợp sử dụng](#các-trường-hợp-sử-dụng)
5. [Ví dụ sử dụng](#ví-dụ-sử-dụng)

   * [Import cơ bản](#ví-dụ-1-import-cơ-bản)
   * [Import với column mapping](#ví-dụ-2-import-với-column-mapping)
   * [Import từ CSV](#ví-dụ-3-import-từ-csv)
   * [Bulk import nhiều bảng](#ví-dụ-4-bulk-import-nhiều-bảng)
   * [Validate trước khi import](#ví-dụ-5-validate-trước-khi-import)
   * [Xử lý lỗi khi import](#ví-dụ-6-xử-lý-lỗi-khi-import)
   * [Xóa & import lại dữ liệu](#ví-dụ-7-xóa-và-import-lại-dữ-liệu)
   * [Thống kê sau import](#ví-dụ-8-thống-kê-sau-import)
   * [Chạy toàn bộ ví dụ](#ví-dụ-tổng-hợp-chạy-toàn-bộ)
6. [Kết luận](#kết-luận)

---

## 📝 Tổng quan

Hệ thống hỗ trợ import dữ liệu từ nhiều nguồn khác nhau (API, CSV, Excel, hệ thống cũ) vào **SQLite Database**, đảm bảo:

* Tương thích schema định nghĩa sẵn (ví dụ `product.json`)
* Tự động chuyển đổi kiểu dữ liệu
* Hỗ trợ transaction, batch processing, và xử lý lỗi linh hoạt

---

## ⚙️ Các thành phần chính

### **SQLiteDAO (phương thức cơ bản)**

* `importData(data, options)` → Import mảng dữ liệu với **validation** tự động
* `importDataWithMapping(data, mappings, options)` → Import với **ánh xạ cột tùy chỉnh**
* `importFromCSV(csvString, options)` → Import trực tiếp từ **chuỗi CSV**

### **DatabaseManager (quản lý cấp cao)**

* `importDataToTable(databaseKey, tableName, data, options)`
* `bulkImport(configs)` → Import đồng loạt nhiều bảng
* `validateImportData(databaseKey, tableName, data)`
* `truncateTable(databaseKey, tableName)`
* `getImportStatistics(databaseKey)`

---

## 🚀 Tính năng nổi bật

* **Schema-aware**: Đọc và áp dụng JSON schema tự động
* **Type-safe**: Chuyển đổi chính xác kiểu dữ liệu
* **Flexible mapping**: Hỗ trợ transform function khi ánh xạ cột
* **Error resilient**: Có thể bỏ qua lỗi hoặc dừng ngay khi lỗi
* **Performance optimized**: Batch processing + transaction
* **Progress tracking**: Callback theo dõi tiến độ
* **Upsert support**: `INSERT ... ON CONFLICT UPDATE`

---

## 📂 Các trường hợp sử dụng

* Import dữ liệu từ **API response**
* Import từ **CSV / Excel**
* **Data migration** từ hệ thống cũ
* **Đồng bộ dữ liệu** giữa các database
* Import với **cấu trúc dữ liệu khác nhau**

---

## 💻 Ví dụ sử dụng

### 📌 Ví dụ 1: Import cơ bản

```ts
const result = await DatabaseManager.importDataToTable(
  'product',
  'products',
  productData,
  { batchSize: 100, validateData: true }
);
```

### 📌 Ví dụ 2: Import với column mapping

```ts
const result = await DatabaseManager.importDataWithMapping(
  'product',
  'products',
  externalData,
  columnMappings,
  { updateOnConflict: true, conflictColumns: ['sku'] }
);
```

### 📌 Ví dụ 3: Import từ CSV

```ts
const result = await DatabaseManager.importFromCSV(
  'product',
  'products',
  csvData,
  { delimiter: ',', hasHeader: true, columnMappings }
);
```

### 📌 Ví dụ 4: Bulk import nhiều bảng

```ts
const result = await DatabaseManager.bulkImport([
  { databaseKey: 'product', tableName: 'categories', data: categoryData },
  { databaseKey: 'product', tableName: 'product_attributes', data: attributeData }
]);
```

### 📌 Ví dụ 5: Validate trước khi import

```ts
const errors = await DatabaseManager.validateImportData('product', 'products', testData);
```

### 📌 Ví dụ 6: Xử lý lỗi khi import

```ts
await DatabaseManager.importDataToTable('product','products', mixedData, {
  skipErrors: true,
  onError: (error, rowIndex) => console.error(`Error at row ${rowIndex}`, error),
});
```

### 📌 Ví dụ 7: Xóa & import lại dữ liệu

```ts
await DatabaseManager.truncateTable('product','products');
await DatabaseManager.importDataToTable('product','products', newData);
```

### 📌 Ví dụ 8: Thống kê sau import

```ts
const stats = await DatabaseManager.getImportStatistics('product');
console.log(stats.tableSizes);
```

### 📌 Ví dụ tổng hợp (chạy toàn bộ)

```ts
await runAllImportExamples();
```

---

## ✅ Kết luận

* Hệ thống import này có thể **xử lý bất kỳ schema JSON nào** (ví dụ: `product.json`)
* Hỗ trợ **import linh hoạt từ nhiều nguồn**, đảm bảo **toàn vẹn dữ liệu** và **hiệu năng cao**
* Có thể mở rộng dễ dàng khi bổ sung bảng mới hoặc thay đổi cấu trúc schema


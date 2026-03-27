# DataTable Component

Một React Native component linh hoạt và có thể tái sử dụng để hiển thị dữ liệu dưới dạng bảng với nhiều tính năng tùy chỉnh.

## 📋 Mục lục

- [Cài đặt](#cài-đặt)
- [Sử dụng cơ bản](#sử-dụng-cơ-bản)
- [Props](#props)
- [Ví dụ nâng cao](#ví-dụ-nâng-cao)
- [Tùy chỉnh giao diện](#tùy-chỉnh-giao-diện)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Cài đặt

```typescript
import {DataTable} from '../../components/common';
// hoặc
import DataTable from '../../components/common/DataTable';
```

## 📖 Sử dụng cơ bản

### Ví dụ đơn giản nhất

```typescript
import React from 'react';
import {View} from 'react-native';
import {DataTable} from '../../components/common';

export const SimpleExample: React.FC = () => {
  const headers = ['ID', 'Tên', 'Tuổi'];
  const data = [
    ['1', 'Nguyễn Văn A', '25'],
    ['2', 'Trần Thị B', '30'],
    ['3', 'Lê Văn C', '28']
  ];

  return (
    <View style={{flex: 1, padding: 16}}>
      <DataTable
        title="Danh sách người dùng"
        tableHead={headers}
        tableData={data}
      />
    </View>
  );
};
```

### Với tương tác click

```typescript
const handleRowPress = (rowData: any[], rowIndex: number) => {
  Alert.alert('Chi tiết', `Đã chọn: ${rowData[1]} (dòng ${rowIndex + 1})`);
};

return (
  <DataTable
    title="Danh sách có thể click"
    tableHead={headers}
    tableData={data}
    onRowPress={handleRowPress}
    showEditHint={true}
  />
);
```

## 🔧 Props

### Props bắt buộc

| Prop | Type | Mô tả |
|------|------|-------|
| `tableHead` | `string[]` | Mảng chứa tiêu đề các cột |
| `tableData` | `any[][]` | Dữ liệu bảng dưới dạng mảng 2 chiều |

### Props tùy chọn

#### Tiêu đề và hiển thị

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `title` | `string` | `undefined` | Tiêu đề chính của bảng |
| `tableName` | `string` | `undefined` | Tên bảng (dùng làm tiêu đề nếu không có title) |
| `noDataText` | `string` | `"Không có dữ liệu"` | Text hiển thị khi không có dữ liệu |
| `showRowIndex` | `boolean` | `false` | Hiển thị cột số thứ tự |
| `showEditHint` | `boolean` | `true` | Hiển thị gợi ý "Nhấn để chỉnh sửa" |
| `showScrollHint` | `boolean` | `true` | Hiển thị gợi ý cách scroll |
| `showBorder` | `boolean` | `true` | Hiển thị border cho bảng |

#### Kích thước và layout

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `maxHeight` | `number` | `500` (tablet) / `400` (phone) | Chiều cao tối đa |
| `minHeight` | `number` | `200` | Chiều cao tối thiểu |
| `columnWidths` | `number[]` | auto-calculated | Chiều rộng từng cột |

#### Tương tác

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `onRowPress` | `(rowData: any[], rowIndex: number) => void` | `undefined` | Callback khi click vào dòng |
| `horizontalScrollEnabled` | `boolean` | `true` | Cho phép scroll ngang |
| `verticalScrollEnabled` | `boolean` | `true` | Cho phép scroll dọc |

#### Tùy chỉnh render

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `renderCell` | `(cellData: any, rowIndex: number, columnIndex: number) => React.ReactNode` | `undefined` | Custom render cho từng cell |
| `renderHeaderCell` | `(headerData: string, columnIndex: number) => React.ReactNode` | `undefined` | Custom render cho header cell |

#### Style

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `containerStyle` | `ViewStyle` | `undefined` | Style cho container chính |
| `tableStyle` | `ViewStyle` | `undefined` | Style cho table wrapper |

## 🎨 Ví dụ nâng cao

### 1. Bảng sản phẩm với hình ảnh và format giá

```typescript
const ProductTable: React.FC = () => {
  const headers = ['Hình', 'Tên sản phẩm', 'Giá', 'Đánh giá', 'Trạng thái'];
  const products = [
    ['https://example.com/iphone.jpg', 'iPhone 15', '25000000', '4.8', 'Còn hàng'],
    ['https://example.com/samsung.jpg', 'Samsung Galaxy', '20000000', '4.6', 'Hết hàng']
  ];

  const renderProductCell = (cellData: any, rowIndex: number, columnIndex: number) => {
    // Cột hình ảnh
    if (columnIndex === 0) {
      return (
        <Image
          source={{uri: cellData}}
          style={{width: 50, height: 50, borderRadius: 8}}
        />
      );
    }
    
    // Cột giá - Format tiền VND
    if (columnIndex === 2) {
      return (
        <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(parseInt(cellData))}
        </Text>
      );
    }

    // Cột đánh giá - Hiển thị sao
    if (columnIndex === 3) {
      const stars = '⭐'.repeat(Math.floor(parseFloat(cellData)));
      return (
        <View style={{flexDirection: 'row'}}>
          <Text>{stars}</Text>
          <Text style={{marginLeft: 4}}>{cellData}</Text>
        </View>
      );
    }

    // Cột trạng thái - Màu sắc theo trạng thái
    if (columnIndex === 4) {
      const isAvailable = cellData === 'Còn hàng';
      return (
        <View style={{
          backgroundColor: isAvailable ? '#E8F5E8' : '#FFEBEE',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{
            color: isAvailable ? '#4CAF50' : '#F44336',
            fontWeight: '500',
            fontSize: 12
          }}>
            {cellData}
          </Text>
        </View>
      );
    }

    return <Text>{cellData}</Text>;
  };

  return (
    <DataTable
      title="Danh sách sản phẩm"
      tableHead={headers}
      tableData={products}
      renderCell={renderProductCell}
      columnWidths={[70, 150, 120, 100, 80]}
      onRowPress={(rowData) => {
        Alert.alert('Sản phẩm', `Chi tiết: ${rowData[1]}`);
      }}
      maxHeight={400}
    />
  );
};
```

### 2. Bảng báo cáo với tổng kết

```typescript
const RevenueReport: React.FC = () => {
  const headers = ['Tháng', 'Doanh thu', 'Chi phí', 'Lợi nhuận', '% Tăng trưởng'];
  const data = [
    ['Tháng 1', '100000000', '80000000', '20000000', '5.2'],
    ['Tháng 2', '120000000', '85000000', '35000000', '12.8'],
    ['Tháng 3', '95000000', '75000000', '20000000', '-15.3']
  ];

  const renderReportCell = (cellData: any, rowIndex: number, columnIndex: number) => {
    // Format tiền cho các cột doanh thu, chi phí, lợi nhuận
    if (columnIndex >= 1 && columnIndex <= 3) {
      return (
        <Text style={{fontWeight: '600', color: '#1976D2'}}>
          {new Intl.NumberFormat('vi-VN').format(parseInt(cellData))} đ
        </Text>
      );
    }

    // % Tăng trưởng với màu sắc
    if (columnIndex === 4) {
      const value = parseFloat(cellData);
      const isPositive = value > 0;
      return (
        <Text style={{
          color: isPositive ? '#4CAF50' : '#F44336',
          fontWeight: 'bold'
        }}>
          {isPositive ? '+' : ''}{cellData}%
        </Text>
      );
    }

    return <Text style={{fontWeight: '500'}}>{cellData}</Text>;
  };

  return (
    <DataTable
      title="Báo cáo doanh thu Quý 1/2024"
      tableHead={headers}
      tableData={data}
      renderCell={renderReportCell}
      showRowIndex={true}
      showEditHint={false}
      maxHeight={300}
      columnWidths={[80, 120, 100, 100, 90]}
    />
  );
};
```

### 3. Bảng với scroll ngang cho nhiều cột

```typescript
const CustomerTable: React.FC = () => {
  const headers = [
    'ID', 'Họ tên', 'Email', 'SĐT', 'Địa chỉ', 
    'Thành phố', 'Quốc gia', 'Ngày sinh', 'Nghề nghiệp'
  ];
  
  const customers = [
    [
      '001', 'Nguyễn Văn An', 'an@example.com', '0901234567', 
      '123 Đường Lê Lợi', 'Hà Nội', 'Việt Nam', '15/06/1990', 'Kỹ sư phần mềm'
    ],
    [
      '002', 'Trần Thị Bình', 'binh@example.com', '0907654321',
      '456 Đường Nguyễn Huệ', 'TP.HCM', 'Việt Nam', '20/08/1985', 'Giáo viên'
    ]
  ];

  const handleCustomerSelect = (rowData: any[], index: number) => {
    Alert.alert(
      'Thông tin khách hàng',
      `Tên: ${rowData[1]}\nEmail: ${rowData[2]}\nSĐT: ${rowData[3]}\nNghề nghiệp: ${rowData[8]}`
    );
  };

  return (
    <DataTable
      title="Danh sách khách hàng chi tiết"
      tableHead={headers}
      tableData={customers}
      onRowPress={handleCustomerSelect}
      horizontalScrollEnabled={true}
      showScrollHint={true}
      maxHeight={350}
      // Để tự động tính toán width hoặc có thể custom:
      // columnWidths={[50, 120, 180, 100, 200, 80, 80, 90, 120]}
    />
  );
};
```

## 🎯 Tùy chỉnh giao diện

### Custom container style

```typescript
const {theme} = useTheme();

const customStyle = {
  backgroundColor: theme.surface,
  borderRadius: 16,
  marginHorizontal: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
};

<DataTable
  // ... other props
  containerStyle={customStyle}
  tableStyle={{borderRadius: 12}}
/>
```

### Custom header render

```typescript
const renderCustomHeader = (headerData: string, columnIndex: number) => {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={{fontWeight: 'bold', color: '#1976D2'}}>
        {headerData}
      </Text>
      {columnIndex === 2 && <Icon name="sort" size={16} />}
    </View>
  );
};

<DataTable
  // ... other props
  renderHeaderCell={renderCustomHeader}
/>
```

## 💡 Best Practices

### 1. Xử lý dữ liệu lớn

```typescript
// Với dữ liệu lớn, nên phân trang
const ITEMS_PER_PAGE = 50;
const [currentPage, setCurrentPage] = useState(0);

const paginatedData = useMemo(() => {
  const startIndex = currentPage * ITEMS_PER_PAGE;
  return allData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
}, [allData, currentPage]);

<DataTable
  tableData={paginatedData}
  maxHeight={400} // Giới hạn chiều cao
/>
```

### 2. Loading state

```typescript
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState<any[][]>([]);

// Hiển thị loading
if (isLoading) {
  return <ActivityIndicator size="large" />;
}

<DataTable
  tableHead={headers}
  tableData={data}
  noDataText="Không có dữ liệu để hiển thị"
/>
```

### 3. Error handling

```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return (
    <View style={{padding: 20}}>
      <Text style={{color: 'red', textAlign: 'center'}}>
        Lỗi: {error}
      </Text>
    </View>
  );
}
```

### 4. Responsive design

```typescript
import {isTablet} from '../../utils';

const columnWidths = isTablet 
  ? [100, 200, 150, 120] // Tablet
  : [80, 120, 100, 90];  // Phone

<DataTable
  columnWidths={columnWidths}
  maxHeight={isTablet ? 500 : 350}
/>
```

### 5. Performance optimization

```typescript
// Sử dụng useMemo cho dữ liệu được tính toán
const processedData = useMemo(() => {
  return rawData.map(item => [
    item.id,
    item.name,
    formatCurrency(item.price),
    formatDate(item.createdAt)
  ]);
}, [rawData]);

// Sử dụng useCallback cho handlers
const handleRowPress = useCallback((rowData: any[], index: number) => {
  // Handle selection
}, []);
```

## ❗ Troubleshooting

### Các vấn đề thường gặp

**1. Bảng không hiển thị**
```typescript
// Kiểm tra dữ liệu
console.log('Headers:', tableHead);
console.log('Data:', tableData);

// Đảm bảo tableHead và tableData không rỗng
if (!tableHead?.length || !tableData?.length) {
  return <Text>Không có dữ liệu</Text>;
}
```

**2. Cột bị cắt hoặc quá rộng**
```typescript
// Set columnWidths cố định
<DataTable
  columnWidths={[80, 150, 100, 120]}
  horizontalScrollEnabled={true}
/>
```

**3. Performance kém với dữ liệu lớn**
```typescript
// Sử dụng pagination hoặc virtualization
const VISIBLE_ROWS = 20;
const visibleData = data.slice(0, VISIBLE_ROWS);

// Hoặc sử dụng FlatList cho dữ liệu rất lớn
```

**4. Lỗi render cell**
```typescript
const safeRenderCell = (cellData: any, rowIndex: number, columnIndex: number) => {
  try {
    // Custom render logic
    return <Text>{cellData}</Text>;
  } catch (error) {
    console.error('Render cell error:', error);
    return <Text>-</Text>;
  }
};
```

**5. Theme không apply**
```typescript
// Đảm bảo component được wrap trong ThemeProvider
import {useTheme} from '../../styles/ThemeContext';

const {theme} = useTheme();
// theme sẽ có các giá trị: text, surface, border, etc.
```

## 🔄 Changelog

### v1.0.0
- ✨ Ra mắt component DataTable
- ✨ Hỗ trợ custom render cell và header
- ✨ Tích hợp theme và i18n
- ✨ Auto-calculate column widths
- ✨ Scroll ngang và dọc
- ✨ Row selection với callback

### Future Plans
- 🔮 Sorting columns
- 🔮 Filtering
- 🔮 Column resizing
- 🔮 Export to CSV/Excel
- 🔮 Virtual scrolling cho dữ liệu lớn

## 📞 Hỗ trợ

Nếu gặp vấn đề hoặc có đề xuất, vui lòng tạo issue hoặc liên hệ team phát triển.

---

**Chúc bạn coding vui vẻ! 🚀**
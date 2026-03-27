
## Cach su dung TreeDataTable

### 1. **Cấu trúc Tree Node**
```typescript
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[]; // Child nodes
  // ... other properties
}
```

### 2. **Tính năng chính:**
- ✅ **Expand/Collapse**: Click vào icon để đóng/mở node
- ✅ **Tree Lines**: Hiển thị đường kẻ tree structure (optional)
- ✅ **Indentation**: Tự động thụt lề theo level
- ✅ **Custom Icons**: Folder, file, expand/collapse icons
- ✅ **Controlled/Uncontrolled**: Quản lý state expand keys
- ✅ **Deep nesting**: Hỗ trợ nhiều cấp độ

### 3. **Cách sử dụng:**

#### **Basic Usage:**
```typescript
const treeData = [
  {
    id: '1',
    name: 'Root Folder',
    type: 'folder',
    children: [
      {
        id: '1-1',
        name: 'Sub Folder 1',
        type: 'folder',
        children: [
          { id: '1-1-1', name: 'File 1.txt', type: 'file' },
          { id: '1-1-2', name: 'File 2.txt', type: 'file' }
        ]
      },
      { id: '1-2', name: 'File 3.txt', type: 'file' }
    ]
  },
  {
    id: '2',
    name: 'Another Folder',
    type: 'folder',
    children: [
      { id: '2-1', name: 'File 4.txt', type: 'file' }
    ]
  }
];

const columns = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    isTreeColumn: true, // Cột chính để hiển thị tree
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type',
  },
  {
    key: 'size',
    title: 'Size',
    dataIndex: 'size',
    render: (value) => value ? `${value} KB` : '-'
  }
];

<TreeDataTable
  title="File Explorer"
  columns={columns}
  dataSource={treeData}
  rowKey="id"
  defaultExpandAll={false}
  showTreeLines={true}
  onRowPress={(record) => console.log('Selected:', record)}
/>
```

#### **Advanced Usage với Custom Icons:**
```typescript
<TreeDataTable
  columns={columns}
  dataSource={treeData}
  treeColumnIndex={0} // Cột 0 là tree column
  indentSize={24} // Kích thước thụt lề
  expandIcon={<Text>▶</Text>}
  collapseIcon={<Text>▼</Text>}
  leafIcon={<Text>📄</Text>}
  onExpand={(expanded, record) => {
    console.log('Node expanded:', expanded, record);
  }}
  onExpandedKeysChange={(keys) => {
    console.log('Expanded keys:', keys);
  }}
/>
```

#### **Controlled Expand State:**
```typescript
const [expandedKeys, setExpandedKeys] = useState(['1', '2']);

<TreeDataTable
  columns={columns}
  dataSource={treeData}
  expandedKeys={expandedKeys}
  onExpandedKeysChange={setExpandedKeys}
/>
```

### 4. **Tree-specific Props:**

- `treeColumnIndex`: Index cột để hiển thị tree (default: 0)
- `defaultExpandAll`: Mở tất cả nodes khi load
- `expandedKeys`: Controlled expanded keys
- `onExpand`: Callback khi expand/collapse
- `onExpandedKeysChange`: Callback khi expanded keys thay đổi
- `indentSize`: Kích thước thụt lề (default: 20)
- `showTreeLines`: Hiển thị đường kẻ tree
- `expandIcon`, `collapseIcon`, `leafIcon`: Custom icons

### 5. **Features:**
- 🎯 **Auto-flatten**: Tự động flatten tree structure
- 📱 **Responsive**: Tương thích mobile/tablet
- 🎨 **Themeable**: Hỗ trợ dark/light theme
- ⚡ **Performance**: Optimized rendering
- 🪟 **Windows Compatible**: Hoạt động trên Windows

Component này hoàn hảo cho file explorer, organization chart, category trees, và bất kỳ dữ liệu hierarchical nào! 🚀
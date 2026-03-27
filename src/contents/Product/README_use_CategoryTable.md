### 1. **Tính năng chính:**
- ✅ **Tree Structure**: Hiển thị categories theo cấu trúc cây hierarchical
- ✅ **Expand/Collapse**: Đóng/mở từng node category
- ✅ **Real-time Data**: Load dữ liệu từ SQLite offline database
- ✅ **Active/Inactive Filter**: Lọc theo trạng thái active
- ✅ **Multi-selection**: Chọn nhiều categories
- ✅ **CRUD Operations**: Edit, Delete, Toggle Status
- ✅ **Responsive Design**: Tương thích mobile/tablet

### 2. **Cách sử dụng:**

#### **Basic Usage:**
```typescript
<CategoriesTree
  storeId="store_123"
  title="Category Management"
  showActiveOnly={false}
/>
```

#### **Advanced Usage với callbacks:**
```typescript
<CategoriesTree
  storeId="store_123"
  title="Product Categories"
  showActiveOnly={true}
  enableSelection={true}
  selectedCategoryIds={[1, 3, 5]}
  maxHeight={600}
  onCategorySelect={(category) => {
    console.log('Selected category:', category);
  }}
  onCategoryEdit={(category) => {
    // Navigate to edit screen
    navigation.navigate('EditCategory', {categoryId: category.id});
  }}
  onCategoryDelete={async (category) => {
    try {
      await categoryService.delete(category.id);
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete category');
    }
  }}
  onCategoryToggleStatus={async (category) => {
    try {
      if (category.is_active) {
        await categoryService.deactivateCategory(category.id);
      } else {
        await categoryService.activateCategory(category.id);
      }
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  }}
  refreshTrigger={refreshTrigger}
/>
```

### 3. **Props Interface:**
```typescript
interface CategoriesTreeProps {
  storeId: string;                                    // Required: Store ID
  title?: string;                                     // Table title
  showActiveOnly?: boolean;                           // Filter active only
  enableSelection?: boolean;                          // Enable row selection
  onCategorySelect?: (category: CategoryTreeNode) => void;
  onCategoryEdit?: (category: CategoryTreeNode) => void;
  onCategoryDelete?: (category: CategoryTreeNode) => void;
  onCategoryToggleStatus?: (category: CategoryTreeNode) => void;
  selectedCategoryIds?: number[];                     // Controlled selection
  maxHeight?: number;                                 // Table max height
  refreshTrigger?: number;                            // Trigger refresh
}
```

### 4. **Columns Display:**
- **Name**: Category name với color indicator và status
- **Description**: Mô tả category (truncated)
- **Level**: Cấp độ trong hierarchy
- **Sort Order**: Thứ tự sắp xếp
- **Status**: Active/Inactive với toggle button
- **Actions**: Edit và Delete buttons

### 5. **Tree Structure Logic:**
```typescript
// Tự động build tree từ flat array
const buildCategoryTree = (categories: Category[]) => {
  // Tạo map để lookup nhanh
  // Xây dựng parent-child relationships
  // Sort theo sort_order và name
  // Return tree structure
}
```

### 6. **Error Handling:**
- Loading states
- Error display với retry button
- Empty states
- Database connection errors

### 7. **Integration Example:**
```typescript
// In your screen component
const CategoryScreen = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  return (
    <View>
      <CategoriesTree
        storeId="your_store_id"
        refreshTrigger={refreshTrigger}
        onCategoryEdit={(category) => {
          // Handle edit
        }}
        onCategoryDelete={async (category) => {
          await categoryService.delete(category.id);
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </View>
  );
};
```

Component này hoàn toàn integrated với CategoryService và sẽ tự động load, display và manage categories theo cấu trúc cây! 🚀
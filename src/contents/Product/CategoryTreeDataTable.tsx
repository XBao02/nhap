import React from 'react';
import {View, Text} from 'react-native';
import {
  TreeDataTable,
  TreeDataTableProps,
  TreeNode,
  FilterOption,
  SortOrder,
} from '../../components';

// Định nghĩa CategoryTreeNode với children được type đúng
interface CategoryTreeNode extends Omit<TreeNode, 'children'> {
  id: string;
  store_id: string;
  name: string;
  parent_id?: number;
  color?: string;
  description?: string;
  level?: number;
  sort_order?: number;
  is_active: boolean;
  children?: CategoryTreeNode[];
}

// Tạo props riêng cho CategoryTreeDataTable
interface CategoryTreeDataTableProps
  extends Omit<TreeDataTableProps, 'onRowPress' | 'dataSource' | 'columns'> {
  dataSource?: CategoryTreeNode[];
  onRowPress?: (record: CategoryTreeNode, index: number) => void;
  // Override columns để support category-specific features
  columns?: any[];
  // Filter & Sort callbacks
  onFiltersChange?: (filters: Record<string, any>) => void;
  onSortChange?: (sortKey: string | null, sortOrder: SortOrder) => void;
}

// Component wrapper
const CategoryTreeDataTable: React.FC<CategoryTreeDataTableProps> = ({
  onRowPress,
  dataSource = [],
  columns: providedColumns,
  onFiltersChange,
  onSortChange,
  ...otherProps
}) => {
  // Default columns cho categories với filter, sort và resize
  const defaultColumns = React.useMemo(
    () => [
      {
        key: 'id',
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        minWidth: 60,
        maxWidth: 120,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search by ID...',
        },
        render: (value: string) => `#${value}`,
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          return Number(a.id) - Number(b.id);
        },
      },
      {
        key: 'name',
        title: 'Category Name',
        dataIndex: 'name',
        width: 250,
        minWidth: 150,
        maxWidth: 400,
        isTreeColumn: true,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search category name...',
        },
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          return a.name.localeCompare(b.name);
        },
      },
      {
        key: 'description',
        title: 'Description',
        dataIndex: 'description',
        width: 200,
        minWidth: 120,
        maxWidth: 300,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search description...',
        },
        render: (value: string) => value || '-',
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          const aDesc = a.description || '';
          const bDesc = b.description || '';
          return aDesc.localeCompare(bDesc);
        },
      },
      {
        key: 'level',
        title: 'Level',
        dataIndex: 'level',
        width: 80,
        minWidth: 60,
        maxWidth: 100,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'select' as const,
          options: [
            {text: 'Level 1', value: 1},
            {text: 'Level 2', value: 2},
            {text: 'Level 3', value: 3},
            {text: 'Level 4', value: 4},
            {text: 'Level 5', value: 5},
          ] as FilterOption[],
        },
        render: (value: number) => `L${value || 1}`,
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          return (a.level || 1) - (b.level || 1);
        },
      },
      {
        key: 'sort_order',
        title: 'Sort Order',
        dataIndex: 'sort_order',
        width: 100,
        minWidth: 80,
        maxWidth: 120,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'number' as const,
          placeholder: 'Enter sort order...',
        },
        render: (value: number) => value || 0,
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          return (a.sort_order || 0) - (b.sort_order || 0);
        },
      },
      {
        key: 'is_active',
        title: 'Status',
        dataIndex: 'is_active',
        width: 100,
        minWidth: 80,
        maxWidth: 120,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'select' as const,
          options: [
            {text: 'Active', value: true},
            {text: 'Inactive', value: false},
          ] as FilterOption[],
        },
        render: (value: boolean) => (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: value ? '#4CAF50' : '#F44336',
              alignItems: 'center',
            }}>
            <Text style={{color: '#fff', fontSize: 12, fontWeight: '600'}}>
              {value ? 'Active' : 'Inactive'}
            </Text>
          </View>
        ),
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          return Number(b.is_active) - Number(a.is_active); // Active first
        },
      },
      {
        key: 'parent_id',
        title: 'Parent ID',
        dataIndex: 'parent_id',
        width: 100,
        minWidth: 80,
        maxWidth: 120,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search parent ID...',
        },
        render: (value: number) => (value ? `#${value}` : '-'),
        sorter: (a: CategoryTreeNode, b: CategoryTreeNode) => {
          const aParent = a.parent_id || 0;
          const bParent = b.parent_id || 0;
          return aParent - bParent;
        },
      },
    ],
    [],
  );

  // Sử dụng columns được truyền vào hoặc default columns
  const columns = providedColumns || defaultColumns;

  // Type-safe conversion function
  const convertToTreeNode = React.useCallback(
    (categories: CategoryTreeNode[]): TreeNode[] => {
      return categories.map(category => ({
        ...category,
        children: category.children
          ? convertToTreeNode(category.children)
          : undefined,
      }));
    },
    [],
  );

  // Cast lại type cho onRowPress với proper type checking
  const handleRowPress = React.useCallback(
    (record: TreeNode, index: number) => {
      if (onRowPress) {
        onRowPress(record as CategoryTreeNode, index);
      }
    },
    [onRowPress],
  );

  // Handle filters change
  const handleFiltersChange = React.useCallback(
    (filters: Record<string, any>) => {
      console.log('Filters changed:', filters);
      onFiltersChange?.(filters);
    },
    [onFiltersChange],
  );

  // Handle sort change
  const handleSortChange = React.useCallback(
    (sortKey: string | null, sortOrder: SortOrder) => {
      console.log('Sort changed:', {sortKey, sortOrder});
      onSortChange?.(sortKey, sortOrder);
    },
    [onSortChange],
  );

  // Convert dataSource with memoization
  const treeDataSource = React.useMemo(() => {
    return dataSource ? convertToTreeNode(dataSource) : [];
  }, [dataSource, convertToTreeNode]);

  return (
    <TreeDataTable
      {...otherProps}
      columns={columns}
      dataSource={treeDataSource}
      onRowPress={handleRowPress}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      // Enhanced features
      striped={true}
      bordered={true}
      showTreeLines={true}
      indentSize={24}
      expandIcon={<Text style={{fontSize: 16}}>📂</Text>}
      collapseIcon={<Text style={{fontSize: 16}}>📁</Text>}
      leafIcon={<Text style={{fontSize: 16}}>📄</Text>}
    />
  );
};

export default CategoryTreeDataTable;
export type {CategoryTreeNode, CategoryTreeDataTableProps};

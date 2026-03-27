// components/categories/CategoriesTree.tsx
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import CategoryTreeDataTable, {CategoryTreeNode} from './CategoryTreeDataTable';

import {categoryService, Category} from '../../services';
import {useTheme} from '../../styles/ThemeContext';
import {useLanguage} from '../../i18n';
import {isTablet} from '../../utils';

// Props interface for CategoriesTree component
interface CategoriesTreeProps {
  storeId?: string;
  showActiveOnly?: boolean;
  refreshTrigger?: any;
  selectedCategoryIds?: (string | number)[];
  enableSelection?: boolean;
  title?: string;
  maxHeight?: number;
  showIdColumn?: boolean;
  onCategorySelect?: (category: CategoryTreeNode) => void;
  onCategoryEdit?: (category: CategoryTreeNode) => void;
  onCategoryDelete?: (category: CategoryTreeNode) => void;
  onCategoryToggleStatus?: (category: CategoryTreeNode) => void;
}

export const CategoriesTree: React.FC<CategoriesTreeProps> = ({
  storeId,
  showActiveOnly = false,
  refreshTrigger,
  selectedCategoryIds = [],
  enableSelection = false,
  title,
  maxHeight,
  showIdColumn = true,
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryToggleStatus,
}) => {
  const {theme} = useTheme();
  const {t} = useLanguage();

  // States
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortInfo, setSortInfo] = useState<{key: string | null, order: 'ascend' | 'descend' | null}>({
    key: null,
    order: null
  });

  // Refs to track previous values
  const prevSelectedCategoryIds = useRef<(string | number)[]>([]);
  const prevRefreshTrigger = useRef<any>(refreshTrigger);

  // Load categories từ database
  const loadCategories = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      setError(null);

      let fetchedCategories: Category[];
      if (showActiveOnly) {
        fetchedCategories = await categoryService.findActiveCategories(storeId);
      } else {
        fetchedCategories = await categoryService.findByStoreId(storeId);
      }

      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [storeId, showActiveOnly]);

  // Load dữ liệu khi component mount hoặc essential props thay đổi
  useEffect(() => {
    const shouldReload = 
      storeId && 
      (categories.length === 0 || prevRefreshTrigger.current !== refreshTrigger);
    
    if (shouldReload) {
      prevRefreshTrigger.current = refreshTrigger;
      loadCategories();
    }
  }, [storeId, refreshTrigger, loadCategories]);

  // Update selected row keys only when selectedCategoryIds actually changes
  useEffect(() => {
    const hasChanged = 
      selectedCategoryIds.length !== prevSelectedCategoryIds.current.length ||
      selectedCategoryIds.some((id, index) => id !== prevSelectedCategoryIds.current[index]);

    if (hasChanged) {
      prevSelectedCategoryIds.current = [...selectedCategoryIds];
      setSelectedRowKeys(selectedCategoryIds);
    }
  }, [selectedCategoryIds]);

  // Build category tree function
  const buildCategoryTree = useCallback(
    (categories: Category[]): CategoryTreeNode[] => {
      if (!categories || categories.length === 0) return [];

      // Apply filters first
      let filteredCategories = [...categories];
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        
        filteredCategories = filteredCategories.filter(category => {
          switch (key) {
            case 'id':
              return category.id?.toString().includes(value.toString());
            case 'name':
              return category.name?.toLowerCase().includes(value.toLowerCase());
            case 'description':
              return category.description?.toLowerCase().includes(value.toLowerCase());
            case 'level':
              return category.level === value;
            case 'sort_order':
              return category.sort_order === Number(value);
            case 'is_active':
              return category.is_active === value;
            case 'parent_id':
              return category.parent_id?.toString().includes(value.toString());
            default:
              return true;
          }
        });
      });

      // Apply sorting
      if (sortInfo.key && sortInfo.order) {
        filteredCategories.sort((a, b) => {
          let comparison = 0;
          
          switch (sortInfo.key) {
            case 'id':
              comparison = Number(a.id) - Number(b.id);
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'description':
              comparison = (a.description || '').localeCompare(b.description || '');
              break;
            case 'level':
              comparison = (a.level || 1) - (b.level || 1);
              break;
            case 'sort_order':
              comparison = (a.sort_order || 0) - (b.sort_order || 0);
              break;
            case 'is_active':
              comparison = Number(b.is_active) - Number(a.is_active);
              break;
            case 'parent_id':
              comparison = (a.parent_id || 0) - (b.parent_id || 0);
              break;
          }
          
          return sortInfo.order === 'descend' ? -comparison : comparison;
        });
      }

      // Create map for lookup
      const categoryMap = new Map<number, CategoryTreeNode>();
      const rootCategories: CategoryTreeNode[] = [];

      // Create tree nodes
      filteredCategories.forEach((category: any) => {
        const treeNode: CategoryTreeNode = {
          ...category,
          children: [],
        };
        if (category.id) {
          categoryMap.set(category.id, treeNode);
        }
      });

      // Build tree structure
      filteredCategories.forEach(category => {
        if (!category.id) return;

        const treeNode = categoryMap.get(category.id);
        if (!treeNode) return;

        if (category.parent_id && categoryMap.has(category.parent_id)) {
          const parent = categoryMap.get(category.parent_id);
          parent?.children?.push(treeNode);
        } else {
          rootCategories.push(treeNode);
        }
      });

      // Sort categories by sort_order and name (if no custom sorting applied)
      if (!sortInfo.key) {
        const sortCategories = (categories: CategoryTreeNode[]) => {
          categories.sort((a, b) => {
            if (a.sort_order !== b.sort_order) {
              return (a.sort_order || 0) - (b.sort_order || 0);
            }
            return a.name.localeCompare(b.name);
          });

          categories.forEach(category => {
            if (category.children && category.children.length > 0) {
              sortCategories(category.children);
            }
          });
        };
        sortCategories(rootCategories);
      }

      return rootCategories;
    },
    [filters, sortInfo],
  );

  // Memoized tree data
  const treeData = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories, buildCategoryTree]);

  // Dynamic columns based on showIdColumn prop
  const columns = useMemo(() => {
    const baseColumns = [];

    // Add ID column if requested
    if (showIdColumn) {
      baseColumns.push({
        key: 'id',
        title: t('category.id', 'ID'),
        dataIndex: 'id',
        width: isTablet ? 80 : 60,
        minWidth: 60,
        maxWidth: 120,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search ID...'
        },
        render: (value: string, record: CategoryTreeNode) => (
          <View style={styles.idCell}>
            <Text style={[styles.idText, {color: theme.primary}]}>
              #{value}
            </Text>
            {record.parent_id && (
              <Text style={[styles.parentIdText, {color: theme.textSecondary}]}>
                ↳{record.parent_id}
              </Text>
            )}
          </View>
        ),
      });
    }

    // Add other columns
    baseColumns.push(
      {
        key: 'name',
        title: t('category.name', 'Name'),
        dataIndex: 'name',
        isTreeColumn: true,
        width: isTablet ? (showIdColumn ? 250 : 300) : (showIdColumn ? 180 : 200),
        minWidth: 150,
        maxWidth: 400,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search name...'
        },
        render: (value: string, record: CategoryTreeNode) => (
          <View style={styles.nameCell}>
            {record.color && (
              <View
                style={[styles.colorIndicator, {backgroundColor: record.color}]}
              />
            )}
            <Text
              style={[
                styles.categoryName,
                {
                  color: record.is_active ? theme.text : theme.textSecondary,
                  fontWeight: record.is_active ? '600' : 'normal',
                },
              ]}>
              {value}
            </Text>
            {!record.is_active && (
              <Text style={[styles.inactiveLabel, {color: theme.error}]}>
                {t('common.inactive', 'Inactive')}
              </Text>
            )}
          </View>
        ),
      },
      {
        key: 'description',
        title: t('category.description', 'Description'),
        dataIndex: 'description',
        width: isTablet ? 200 : 150,
        minWidth: 120,
        maxWidth: 300,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'text' as const,
          placeholder: 'Search description...'
        },
        render: (value: string) => (
          <Text
            style={[styles.description, {color: theme.textSecondary}]}
            numberOfLines={2}>
            {value || '-'}
          </Text>
        ),
      },
      {
        key: 'level',
        title: t('category.level', 'Level'),
        dataIndex: 'level',
        width: isTablet ? 80 : 60,
        minWidth: 60,
        maxWidth: 100,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'select' as const,
          options: [
            { text: 'Level 1', value: 1 },
            { text: 'Level 2', value: 2 },
            { text: 'Level 3', value: 3 },
            { text: 'Level 4', value: 4 },
            { text: 'Level 5', value: 5 },
          ]
        },
        render: (value: number) => (
          <Text style={[styles.levelText, {color: theme.text}]}>
            {value || 1}
          </Text>
        ),
      },
      {
        key: 'sort_order',
        title: t('category.sortOrder', 'Sort'),
        dataIndex: 'sort_order',
        width: isTablet ? 80 : 60,
        minWidth: 60,
        maxWidth: 100,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'number' as const,
          placeholder: 'Enter sort order...'
        },
        render: (value: number) => (
          <Text style={[styles.sortText, {color: theme.text}]}>
            {value || 0}
          </Text>
        ),
      },
      {
        key: 'is_active',
        title: t('category.status', 'Status'),
        dataIndex: 'is_active',
        width: isTablet ? 120 : 100,
        minWidth: 80,
        maxWidth: 150,
        align: 'center' as const,
        sortable: true,
        filterable: true,
        resizable: true,
        filter: {
          type: 'select' as const,
          options: [
            { text: 'Active', value: true },
            { text: 'Inactive', value: false },
          ]
        },
        render: (value: boolean, record: CategoryTreeNode) => (
          <TouchableOpacity
            style={[
              styles.statusButton,
              {
                backgroundColor: value
                  ? theme.success || '#4CAF50'
                  : theme.error || '#F44336',
              },
            ]}
            onPress={() => onCategoryToggleStatus?.(record)}
            disabled={!onCategoryToggleStatus}>
            <Text style={[styles.statusText, {color: '#FFFFFF'}]}>
              {value
                ? t('common.active', 'Active')
                : t('common.inactive', 'Inactive')}
            </Text>
          </TouchableOpacity>
        ),
      },
      {
        key: 'actions',
        title: t('common.actions', 'Actions'),
        dataIndex: 'id',
        width: isTablet ? 150 : 120,
        minWidth: 100,
        maxWidth: 180,
        align: 'center' as const,
        resizable: false, // Actions column không resize
        render: (value: number, record: CategoryTreeNode) => (
          <View style={styles.actionButtons}>
            {onCategoryEdit && (
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: theme.primary}]}
                onPress={() => onCategoryEdit(record)}>
                <Text style={styles.actionButtonText}>✏️</Text>
              </TouchableOpacity>
            )}
            {onCategoryDelete && (
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: theme.error}]}
                onPress={() => handleDeleteCategory(record)}>
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ),
      }
    );

    return baseColumns;
  }, [theme, t, showIdColumn, onCategoryEdit, onCategoryDelete, onCategoryToggleStatus]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (record: CategoryTreeNode, index: number) => {
      if (enableSelection) {
        setSelectedRowKeys(prev => {
          const newKeys = prev.includes(record.id)
            ? prev.filter(key => key !== record.id)
            : [...prev, record.id];
          return newKeys;
        });
      }
      onCategorySelect?.(record);
    },
    [enableSelection, onCategorySelect],
  );

  // Handle delete with confirmation
  const handleDeleteCategory = useCallback(
    async (record: CategoryTreeNode) => {
      Alert.alert(
        t('category.deleteTitle', 'Delete Category'),
        t('category.deleteMessage', `Are you sure you want to delete "${record.name}"?`),
        [
          {
            text: t('common.cancel', 'Cancel'),
            style: 'cancel',
          },
          {
            text: t('common.delete', 'Delete'),
            style: 'destructive',
            onPress: () => onCategoryDelete?.(record),
          },
        ],
      );
    },
    [t, onCategoryDelete],
  );

  // Handle expand/collapse
  const handleExpandedKeysChange = useCallback((keys: (string | number)[]) => {
    setExpandedKeys(keys);
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sortKey: string | null, sortOrder: 'ascend' | 'descend' | null) => {
    setSortInfo({ key: sortKey, order: sortOrder });
  }, []);

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, {backgroundColor: theme.surface}]}>
        <Text style={[styles.errorTitle, {color: theme.error}]}>
          {t('common.error', 'Error')}
        </Text>
        <Text style={[styles.errorMessage, {color: theme.text}]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: theme.primary}]}
          onPress={loadCategories}>
          <Text style={[styles.retryButtonText, {color: '#FFFFFF'}]}>
            {t('common.retry', 'Retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CategoryTreeDataTable
      title={title}
      columns={columns}
      dataSource={treeData}
      rowKey="id"
      loading={loading}
      emptyText={
        showActiveOnly
          ? t('category.noActiveCategories', 'No active categories found')
          : t('category.noCategories', 'No categories found')
      }
      maxHeight={maxHeight || (isTablet ? 600 : 500)}
      defaultExpandAll={false}
      expandedKeys={expandedKeys}
      onExpandedKeysChange={handleExpandedKeysChange}
      selectedRowKeys={selectedRowKeys}
      onRowPress={handleCategorySelect}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      striped={true}
      showTreeLines={true}
      indentSize={24}
      expandIcon={<Text style={{fontSize: 16}}>📂</Text>}
      collapseIcon={<Text style={{fontSize: 16}}>📁</Text>}
      leafIcon={<Text style={{fontSize: 16}}>📄</Text>}
      containerStyle={styles.tableContainer}
    />
  );
};

// Styles  
const styles = StyleSheet.create({
  tableContainer: {
    marginVertical: 8,
  },
  // ID column styles
  idCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  idText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  parentIdText: {
    fontSize: isTablet ? 10 : 9,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Name column styles
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: isTablet ? 15 : 13,
    flex: 1,
  },
  inactiveLabel: {
    fontSize: isTablet ? 11 : 10,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  description: {
    fontSize: isTablet ? 13 : 11,
    lineHeight: 16,
  },
  levelText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
  },
  sortText: {
    fontSize: isTablet ? 14 : 12,
  },
  statusButton: {
    paddingHorizontal: isTablet ? 12 : 8,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: 12,
    minWidth: isTablet ? 80 : 60,
  },
  statusText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    borderRadius: isTablet ? 16 : 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: isTablet ? 14 : 12,
  },
  errorContainer: {
    padding: isTablet ? 32 : 24,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 16,
  },
  errorTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: isTablet ? 14 : 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
});

export default CategoriesTree;
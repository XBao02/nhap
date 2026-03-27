import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  PanResponder
} from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { useTheme } from '../../styles/ThemeContext';
import { useLanguage } from '../../i18n';
import { isTablet } from '../../utils';

// Định nghĩa kiểu dữ liệu cho tree node
interface TreeNode {
  [key: string]: any;
  children?: TreeNode[];
  _isExpanded?: boolean;
  _level?: number;
  _hasChildren?: boolean;
  _parentKey?: string | number;
}

// Filter types
interface FilterOption {
  text: string;
  value: any;
}

interface ColumnFilter {
  type: 'text' | 'select' | 'number' | 'date' | 'boolean';
  placeholder?: string;
  options?: FilterOption[];
}

// Sort types
type SortOrder = 'ascend' | 'descend' | null;

// Định nghĩa kiểu dữ liệu cho column với tree support
interface TreeTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: TreeNode, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filter?: ColumnFilter;
  isTreeColumn?: boolean; // Cột chính để hiển thị tree structure
  resizable?: boolean; // Có thể resize được không
  sorter?: (a: TreeNode, b: TreeNode) => number; // Custom sort function
}

interface TreeDataTableProps<T = TreeNode> {
  // Dữ liệu cơ bản
  title?: string;
  columns: TreeTableColumn[];
  dataSource: TreeNode[];

  // Tree specific props
  treeColumnIndex?: number; // Index của cột tree (default: 0)
  defaultExpandAll?: boolean;
  expandedKeys?: (string | number)[];
  onExpand?: (expanded: boolean, record: TreeNode) => void;
  onExpandedKeysChange?: (expandedKeys: (string | number)[]) => void;

  // Row selection & interaction
  onRowPress?: (record: T, index: number) => void;
  selectedRowKeys?: (string | number)[];
  rowKey?: string | ((record: TreeNode) => string | number);

  // Styling & Layout
  maxHeight?: number;
  minHeight?: number;
  showHeader?: boolean;
  bordered?: boolean;
  striped?: boolean;

  // Scrolling
  enableHorizontalScroll?: boolean;
  enableVerticalScroll?: boolean;

  // Loading & Empty states
  loading?: boolean;
  emptyText?: string;

  // Tree styling
  indentSize?: number;
  showTreeLines?: boolean;
  expandIcon?: React.ReactNode;
  collapseIcon?: React.ReactNode;
  leafIcon?: React.ReactNode;

  // Custom styling
  containerStyle?: any;
  tableStyle?: any;
  headerStyle?: any;
  rowStyle?: any;

  // Filter & Sort callbacks
  onFiltersChange?: (filters: Record<string, any>) => void;
  onSortChange?: (sortKey: string | null, sortOrder: SortOrder) => void;
}

export const TreeDataTable: React.FC<TreeDataTableProps> = ({
  title,
  columns = [],
  dataSource = [],
  treeColumnIndex = 0,
  defaultExpandAll = false,
  expandedKeys: controlledExpandedKeys,
  onExpand,
  onExpandedKeysChange,
  onRowPress,
  selectedRowKeys = [],
  rowKey = 'id',
  maxHeight = isTablet ? 500 : 400,
  minHeight = 200,
  showHeader = true,
  bordered = true,
  striped = false,
  enableHorizontalScroll = true,
  enableVerticalScroll = true,
  loading = false,
  emptyText,
  indentSize = 20,
  showTreeLines = true,
  expandIcon,
  collapseIcon,
  leafIcon,
  containerStyle,
  tableStyle,
  headerStyle,
  rowStyle,
  onFiltersChange,
  onSortChange,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // States
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<Set<string | number>>(
    new Set(controlledExpandedKeys || (defaultExpandAll ? [] : []))
  );

  // Column widths state for resizing
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  // Filter states
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  // Sort states
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Resize states
  const [resizing, setResizing] = useState(false);
  const [resizeColumnIndex, setResizeColumnIndex] = useState<number | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Sử dụng controlled hoặc uncontrolled expanded keys
  const expandedKeys = controlledExpandedKeys
    ? new Set(controlledExpandedKeys)
    : internalExpandedKeys;

  // Tính toán row key
  const getRowKey = useCallback(
    (record: TreeNode, index: number): string | number => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[rowKey] || index;
    },
    [rowKey],
  );

  // Initialize column widths
  React.useEffect(() => {
    if (columnWidths.length === 0) {
      const initialWidths = columns.map((column, index) => {
        if (column.width) return column.width;

        let maxWidth = column.title.length * 10 + 80;

        // Thêm space cho tree column
        if (index === treeColumnIndex) {
          maxWidth += indentSize * 5;
        }

        const minWidth = column.minWidth || (isTablet ? 120 : 100);
        const maxWidthLimit = column.maxWidth || (isTablet ? 400 : 300);

        return Math.min(Math.max(maxWidth, minWidth), maxWidthLimit);
      });
      setColumnWidths(initialWidths);
    }
  }, [columns, treeColumnIndex, indentSize, columnWidths.length]);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...dataSource];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;

      const column = columns.find(col => col.key === key);
      if (!column) return;

      result = result.filter(record => {
        const recordValue = record[column.dataIndex];

        switch (column.filter?.type) {
          case 'text':
            return String(recordValue || '').toLowerCase().includes(String(value).toLowerCase());
          case 'select':
            return recordValue === value;
          case 'number':
            return Number(recordValue) === Number(value);
          case 'boolean':
            return Boolean(recordValue) === Boolean(value);
          default:
            return String(recordValue || '').toLowerCase().includes(String(value).toLowerCase());
        }
      });
    });

    return result;
  }, [dataSource, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return filteredData;

    const column = columns.find(col => col.key === sortKey);
    if (!column) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      if (column.sorter) {
        return column.sorter(a, b);
      }

      const aValue = a[column.dataIndex];
      const bValue = b[column.dataIndex];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue));
    });

    return sortOrder === 'descend' ? sorted.reverse() : sorted;
  }, [filteredData, sortKey, sortOrder, columns]);

  // Flatten tree data với level information
  const flattenedData = useMemo(() => {
    const result: TreeNode[] = [];

    const flatten = (
      nodes: TreeNode[],
      level = 0,
      parentKey?: string | number,
    ) => {
      nodes.forEach((node, index) => {
        const nodeKey = getRowKey(node, index);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedKeys.has(nodeKey);

        const processedNode: TreeNode = {
          ...node,
          _level: level,
          _hasChildren: hasChildren,
          _isExpanded: isExpanded,
          _parentKey: parentKey,
        };

        result.push(processedNode);

        if (hasChildren && isExpanded) {
          flatten(node.children!, level + 1, nodeKey);
        }
      });
    };

    flatten(sortedData);
    return result;
  }, [sortedData, expandedKeys, getRowKey]);

  // Initialize expanded keys cho defaultExpandAll
  React.useEffect(() => {
    if (defaultExpandAll && !controlledExpandedKeys) {
      const allKeys = new Set<string | number>();
      const collectKeys = (nodes: TreeNode[]) => {
        nodes.forEach((node, index) => {
          if (node.children && node.children.length > 0) {
            allKeys.add(getRowKey(node, index));
            collectKeys(node.children);
          }
        });
      };
      collectKeys(dataSource);
      setInternalExpandedKeys(allKeys);
    }
  }, [dataSource, defaultExpandAll, controlledExpandedKeys, getRowKey]);

  // Toggle expand/collapse
  const toggleExpand = useCallback(
    (record: TreeNode) => {
      const key = getRowKey(record, 0);
      const isCurrentlyExpanded = expandedKeys.has(key);

      let newExpandedKeys: Set<string | number>;

      if (isCurrentlyExpanded) {
        newExpandedKeys = new Set(expandedKeys);
        newExpandedKeys.delete(key);
      } else {
        newExpandedKeys = new Set([...expandedKeys, key]);
      }

      if (!controlledExpandedKeys) {
        setInternalExpandedKeys(newExpandedKeys);
      }

      onExpandedKeysChange?.(Array.from(newExpandedKeys));
      onExpand?.(!isCurrentlyExpanded, record);
    },
    [expandedKeys, controlledExpandedKeys, getRowKey, onExpand, onExpandedKeysChange],
  );

  // Handle sort
  const handleSort = useCallback((columnKey: string) => {
    let newSortOrder: SortOrder = 'ascend';

    if (sortKey === columnKey) {
      if (sortOrder === 'ascend') {
        newSortOrder = 'descend';
      } else if (sortOrder === 'descend') {
        newSortOrder = null;
      }
    }

    const newSortKey = newSortOrder ? columnKey : null;
    setSortKey(newSortKey);
    setSortOrder(newSortOrder);
    onSortChange?.(newSortKey, newSortOrder);
  }, [sortKey, sortOrder, onSortChange]);

  // Handle filter
  const handleFilter = useCallback((columnKey: string, value: any) => {
    const newFilters = { ...filters, [columnKey]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Clear filter
  const clearFilter = useCallback((columnKey: string) => {
    const newFilters = { ...filters };
    delete newFilters[columnKey];
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Handle column resize
  const handleResizeStart = useCallback((columnIndex: number, event: any) => {
    if (!columns[columnIndex].resizable) return;

    setResizing(true);
    setResizeColumnIndex(columnIndex);
    resizeStartX.current = event.nativeEvent.pageX;
    resizeStartWidth.current = columnWidths[columnIndex];
  }, [columns, columnWidths]);

  const handleResizeMove = useCallback((event: any) => {
    if (!resizing || resizeColumnIndex === null) return;

    const deltaX = event.nativeEvent.pageX - resizeStartX.current;
    const newWidth = Math.max(
      columns[resizeColumnIndex].minWidth || 50,
      Math.min(
        columns[resizeColumnIndex].maxWidth || 500,
        resizeStartWidth.current + deltaX
      )
    );

    const newWidths = [...columnWidths];
    newWidths[resizeColumnIndex] = newWidth;
    setColumnWidths(newWidths);
  }, [resizing, resizeColumnIndex, columns, columnWidths]);

  const handleResizeEnd = useCallback(() => {
    setResizing(false);
    setResizeColumnIndex(null);
  }, []);

  // Pan responder for resize
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => resizing,
    onPanResponderMove: handleResizeMove,
    onPanResponderRelease: handleResizeEnd,
  });

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <Text style={styles.sortIcon}>↕</Text>;
    }

    return (
      <Text style={[styles.sortIcon, styles.activeSortIcon]}>
        {sortOrder === 'ascend' ? '↑' : '↓'}
      </Text>
    );
  };

  // Render filter icon
  const renderFilterIcon = (columnKey: string) => {
    const hasFilter = filters[columnKey] !== undefined && filters[columnKey] !== null && filters[columnKey] !== '';
    return (
      <Text style={[styles.filterIcon, hasFilter && styles.activeFilterIcon]}>
        🔍
      </Text>
    );
  };

  // Render filter modal
  const renderFilterModal = () => {
    if (!activeFilterColumn) return null;

    const column = columns.find(col => col.key === activeFilterColumn);
    if (!column || !column.filter) return null;

    return (
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}>
          <View style={[styles.filterModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.filterModalTitle, { color: theme.text }]}>
              Filter: {column.title}
            </Text>

            {column.filter.type === 'text' && (
              <TextInput
                style={[styles.filterInput, { borderColor: theme.border, color: theme.text }]}
                placeholder={column.filter.placeholder || `Filter ${column.title}...`}
                placeholderTextColor={theme.textSecondary}
                value={filters[activeFilterColumn] || ''}
                onChangeText={(text) => handleFilter(activeFilterColumn, text)}
              />
            )}

            {column.filter.type === 'select' && column.filter.options && (
              <ScrollView style={styles.filterOptions}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                bounces={false}>
                {column.filter.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterOption,
                      { backgroundColor: filters[activeFilterColumn] === option.value ? theme.primary : 'transparent' }
                    ]}
                    onPress={() => handleFilter(activeFilterColumn, option.value)}>
                    <Text style={[
                      styles.filterOptionText,
                      { color: filters[activeFilterColumn] === option.value ? '#fff' : theme.text }
                    ]}>
                      {option.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.error }]}
                onPress={() => {
                  clearFilter(activeFilterColumn);
                  setFilterModalVisible(false);
                }}>
                <Text style={styles.filterButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.primary }]}
                onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.filterButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Render tree icons
  const renderTreeIcon = (record: TreeNode) => {
    const hasChildren = record._hasChildren;
    const isExpanded = record._isExpanded;

    if (!hasChildren) {
      return leafIcon || <Text style={styles.treeIcon}>📄</Text>;
    }

    const icon = isExpanded
      ? collapseIcon || <Text style={styles.treeIcon}>📂</Text>
      : expandIcon || <Text style={styles.treeIcon}>📁</Text>;

    return (
      <TouchableOpacity
        onPress={() => toggleExpand(record)}
        style={styles.expandButton}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
        {icon}
      </TouchableOpacity>
    );
  };

  // Render tree lines
  const renderTreeLines = (record: TreeNode) => {
    if (!showTreeLines) return null;

    const level = record._level || 0;
    const lines = [];

    for (let i = 0; i < level; i++) {
      lines.push(
        <View
          key={i}
          style={[
            styles.treeLine,
            {
              left: i * indentSize + 10,
              borderLeftColor: theme.border,
            },
          ]}
        />
      );
    }

    return <>{lines}</>;
  };

  // Render cell content với tree support
  const renderCell = (
    column: TreeTableColumn,
    record: TreeNode,
    index: number,
    columnIndex: number,
  ) => {
    const value = record[column.dataIndex];
    const level = record._level || 0;

    if (columnIndex === treeColumnIndex) {
      return (
        <View style={[styles.treeCellContainer, { marginLeft: level * indentSize }]}>
          {renderTreeLines(record)}
          {renderTreeIcon(record)}
          <Text style={[styles.treeCellText, { color: theme.text }]}>
            {column.render ? column.render(value, record, index) : String(value || '')}
          </Text>
        </View>
      );
    }

    if (column.render) {
      return column.render(value, record, index);
    }
    return String(value || '');
  };

  // Render header
  const renderHeader = () => {
    if (!showHeader) return null;

    const headerData = columns.map((column, index) => (
      <View key={column.key} style={styles.headerCell}>
        <Text style={[styles.tableHeaderText, { color: theme.text }, headerStyle]}>
          {column.title}
        </Text>

        <View style={styles.headerActions}>
          {column.sortable && (
            <TouchableOpacity onPress={() => handleSort(column.key)}>
              {renderSortIcon(column.key)}
            </TouchableOpacity>
          )}

          {column.filterable && column.filter && (
            <TouchableOpacity
              onPress={() => {
                setActiveFilterColumn(column.key);
                setFilterModalVisible(true);
              }}>
              {renderFilterIcon(column.key)}
            </TouchableOpacity>
          )}
        </View>

        {column.resizable !== false && index < columns.length - 1 && (
          <View
            style={styles.resizeHandle}
            {...panResponder.panHandlers}
            onTouchStart={(e) => handleResizeStart(index, e)}
          />
        )}
      </View>
    ));

    return (
      <Table borderStyle={bordered ? { borderWidth: 1, borderColor: theme.border } : {}}>
        <Row
          data={headerData}
          style={[styles.tableHead, { backgroundColor: theme.inputBackground }, headerStyle]}
          widthArr={columnWidths}
        />
      </Table>
    );
  };

  // Render rows
  const renderRows = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('common.loading', 'Loading...')}
          </Text>
        </View>
      );
    }

    if (flattenedData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {emptyText || t('common.noData', 'No data available')}
          </Text>
        </View>
      );
    }

    return (
      <Table borderStyle={bordered ? { borderWidth: 1, borderColor: theme.border } : {}}>
        {flattenedData.map((record, index) => {
          const key = getRowKey(record, index);
          const isSelected = selectedRowKeys.includes(key);

          const rowData = columns.map((column, columnIndex) =>
            renderCell(column, record, index, columnIndex)
          );

          return (
            <TouchableOpacity
              key={key}
              onPress={() => onRowPress?.(record, index)}
              activeOpacity={0.7}
              disabled={!onRowPress}>
              <Row
                data={rowData}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: isSelected
                      ? theme.selectedBackground || 'rgba(0, 217, 255, 0.1)'
                      : striped && index % 2 === 1
                        ? theme.stripedBackground || 'rgba(0, 0, 0, 0.02)'
                        : theme.surface,
                  },
                  rowStyle,
                ]}
                textStyle={[styles.tableText, { color: theme.text }]}
                widthArr={columnWidths}
              />
            </TouchableOpacity>
          );
        })}
      </Table>
    );
  };

  // Render table content
  const renderTableContent = () => (
    <View style={[styles.tableWrapper, tableStyle]}>
      {renderHeader()}
      {enableVerticalScroll ? (
        <ScrollView
          style={[
            styles.verticalScrollView,
            { maxHeight: maxHeight - (showHeader ? 50 : 0) },
          ]}
          showsVerticalScrollIndicator={Platform.OS !== 'windows'}
          nestedScrollEnabled={true}
          bounces={Platform.OS === 'ios'}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}>
          {renderRows()}
        </ScrollView>
      ) : (
        renderRows()
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.sectionContainer,
        { backgroundColor: theme.surface, maxHeight, minHeight },
        containerStyle,
      ]}>
      {title && (
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      )}

      <View style={[styles.tableContainer, { maxHeight: maxHeight - (title ? 40 : 0) }]}>
        {enableHorizontalScroll ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={Platform.OS !== 'windows'}
            style={styles.horizontalScrollView}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {renderTableContent()}
          </ScrollView>
        ) : (
          renderTableContent()
        )}
      </View>

      {renderFilterModal()}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  sectionContainer: {
    padding: isTablet ? 24 : 16,
    marginVertical: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      windows: {
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 1,
  },
  horizontalScrollView: {
    flexGrow: 0,
  },
  tableWrapper: {
    flex: 1,
    minWidth: '100%',
  },
  verticalScrollView: {
    flexGrow: 1,
  },
  tableHead: {
    height: isTablet ? 50 : 45,
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'relative',
  },
  tableHeaderText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortIcon: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  activeSortIcon: {
    color: '#1890ff',
  },
  filterIcon: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  activeFilterIcon: {
    color: '#1890ff',
  },
  resizeHandle: {
    position: 'absolute',
    right: -2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'transparent', // This property is not supported on React Native
    // cursor: 'col-resize', // This property is not supported on React Native
  },
  tableRow: {
    minHeight: isTablet ? 48 : 40,
    borderBottomWidth: 0.5,
  },
  tableText: {
    fontSize: isTablet ? 14 : 12,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  // Tree specific styles
  treeCellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    minHeight: 24,
  },
  treeCellText: {
    fontSize: isTablet ? 14 : 12,
    marginLeft: 8,
    flex: 1,
  },
  treeIcon: {
    fontSize: isTablet ? 16 : 14,
    width: 20,
    textAlign: 'center',
  },
  expandButton: {
    padding: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: isTablet ? 18 : 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
  },
  // Filter modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    width: isTablet ? 400 : 300,
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  filterOptions: {
    maxHeight: 200,
    marginBottom: 16,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 4,
  },
  filterOptionText: {
    fontSize: 16,
  },
  filterModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Export types for external use
export type { TreeDataTableProps, TreeTableColumn, TreeNode, FilterOption, ColumnFilter, SortOrder };
export default TreeDataTable;
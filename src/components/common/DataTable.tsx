import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { useTheme } from '../../styles/ThemeContext';
import { useLanguage } from '../../i18n';
import { isTablet } from '../../utils';

export interface DataTableProps {
  /** Tiêu đề của bảng */
  title?: string;
  /** Tên bảng hiện tại */
  tableName?: string;
  /** Dữ liệu header của bảng */
  tableHead: string[];
  /** Dữ liệu của bảng */
  tableData: any[][];
  /** Callback khi click vào một dòng */
  onRowPress?: (rowData: any[], rowIndex: number) => void;
  /** Có hiển thị gợi ý click để edit không */
  showEditHint?: boolean;
  /** Có hiển thị gợi ý scroll không */
  showScrollHint?: boolean;
  /** Chiều cao tối đa của bảng */
  maxHeight?: number;
  /** Chiều cao tối thiểu của bảng */
  minHeight?: number;
  /** Custom style cho container */
  containerStyle?: any;
  /** Custom style cho table wrapper */
  tableStyle?: any;
  /** Có hiển thị border cho table không */
  showBorder?: boolean;
  /** Custom width cho các cột (nếu không có sẽ tự động tính toán) */
  columnWidths?: number[];
  /** Có cho phép scroll horizontal */
  horizontalScrollEnabled?: boolean;
  /** Có cho phép scroll vertical */
  verticalScrollEnabled?: boolean;
  /** Text hiển thị khi không có dữ liệu */
  noDataText?: string;
  /** Có hiển thị index cột không */
  showRowIndex?: boolean;
  /** Custom render cho cell */
  renderCell?: (cellData: any, rowIndex: number, columnIndex: number) => React.ReactNode;
  /** Custom render cho header cell */
  renderHeaderCell?: (headerData: string, columnIndex: number) => React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  tableName,
  tableHead,
  tableData,
  onRowPress,
  showEditHint = true,
  showScrollHint = true,
  maxHeight,
  minHeight = 200,
  containerStyle,
  tableStyle,
  showBorder = true,
  columnWidths,
  horizontalScrollEnabled = true,
  verticalScrollEnabled = true,
  noDataText,
  showRowIndex = false,
  renderCell,
  renderHeaderCell,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Tính toán chiều rộng cột động
  const calculatedColumnWidths = useMemo(() => {
    if (columnWidths) return columnWidths;

    if (!tableHead || tableHead.length === 0) return [];

    const minWidths = tableHead.map((header, index) => {
      let maxWidth = (header?.length || 0) * 10 + 20;

      tableData.forEach(row => {
        if (row && Array.isArray(row)) {
          const cellContent = String(row[index] || '');
          const cellWidth = cellContent.length * 8 + 20;
          maxWidth = Math.max(maxWidth, cellWidth);
        }
      });

      return Math.min(
        Math.max(maxWidth, isTablet ? 120 : 100),
        isTablet ? 200 : 150,
      );
    });

    // Nếu có showRowIndex, thêm cột đầu tiên cho index
    if (showRowIndex) {
      return [60, ...minWidths];
    }

    return minWidths;
  }, [tableHead, tableData, columnWidths, showRowIndex]);

  // Chuẩn bị header data
  const finalTableHead = useMemo(() => {
    if (showRowIndex) {
      return ['#', ...tableHead];
    }
    return tableHead;
  }, [tableHead, showRowIndex]);

  // Render default cell
  const renderDefaultCell = (cellData: any, rowIndex: number, columnIndex: number) => {
    // Nếu là cột index
    if (showRowIndex && columnIndex === 0) {
      return (
        <Text
          key={`index-${rowIndex}`}
          style={[styles.tableText, styles.indexText, { color: theme.textSecondary }]}>
          {rowIndex + 1}
        </Text>
      );
    }

    const actualColumnIndex = showRowIndex ? columnIndex - 1 : columnIndex;
    const actualCellData = cellData;

    // Kiểm tra xem có phải là hình ảnh không
    const isImage =
      typeof actualCellData === 'string' &&
      actualCellData.match(/\.(jpeg|jpg|png|gif)$/i);

    if (isImage) {
      return (
        <Image
          key={`cell-${rowIndex}-${actualColumnIndex}`}
          source={{ uri: actualCellData }}
          style={styles.tableImage}
        />
      );
    }

    // Render text thông thường
    const displayText = (() => {
      if (actualCellData === null || actualCellData === undefined) {
        return '';
      }
      if (typeof actualCellData === 'boolean') {
        return actualCellData ? 'true' : 'false';
      }
      if (typeof actualCellData === 'object') {
        try {
          return JSON.stringify(actualCellData);
        } catch {
          return '[Object]';
        }
      }
      return String(actualCellData).trim();
    })();

    return (
      <Text
        key={`cell-${rowIndex}-${actualColumnIndex}`}
        style={[styles.tableText, { color: theme.text }]}>
        {displayText}
      </Text>
    );
  };

  // Render default header cell
  const renderDefaultHeaderCell = (headerData: string, columnIndex: number) => {
    return (
      <Text
        key={`header-${columnIndex}-${headerData || 'empty'}`}
        style={[styles.tableHeaderText, { color: theme.text }]}>
        {headerData && typeof headerData === 'string'
          ? headerData
          : `Col ${columnIndex + 1}`}
      </Text>
    );
  };

  // Kiểm tra dữ liệu hợp lệ
  if (!tableHead || !Array.isArray(tableHead) || tableHead.length === 0) {
    return (
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface }, containerStyle]}>
        <Text style={[styles.noDataText, { color: theme.text }]}>
          {t('database.error.invalidTableHead', 'Không thể hiển thị bảng')}
        </Text>
      </View>
    );
  }

  if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
    return (
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface }, containerStyle]}>
        {(title || tableName) && (
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {title || t('database.form.dataTitle', { table: tableName })}
          </Text>
        )}
        <Text style={[styles.noDataText, { color: theme.text }]}>
          {noDataText || t('database.form.noData', 'Không có dữ liệu')}
        </Text>
      </View>
    );
  }

  const defaultMaxHeight = isTablet ? 500 : 400;
  const tableMaxHeight = maxHeight || defaultMaxHeight;

  return (
    <View style={[styles.sectionContainer, { backgroundColor: theme.surface }, containerStyle]}>
      {/* Header */}
      {(title || tableName || showEditHint) && (
        <View style={styles.tableHeaderRow}>
          {(title || tableName) && (
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {title || t('database.form.dataTitle', { table: tableName })}
            </Text>
          )}
          {showEditHint && onRowPress && (
            <Text style={[styles.tableHint, { color: theme.textSecondary }]}>
              {t('database.table.clickToEdit', 'Nhấn vào dòng để chỉnh sửa')}
            </Text>
          )}
        </View>
      )}

      {/* Table Container */}
      <View style={[
        styles.tableContainer,
        {
          maxHeight: tableMaxHeight,
          minHeight,
        },
        tableStyle,
      ]}>
        <ScrollView
          horizontal={horizontalScrollEnabled}
          showsHorizontalScrollIndicator={horizontalScrollEnabled}
          persistentScrollbar={horizontalScrollEnabled}
          style={styles.horizontalScrollView}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={false}>
          <View style={styles.tableWrapper}>
            {/* Header */}
            <Table
              borderStyle={showBorder ? {
                borderWidth: 1,
                borderColor: theme.border
              } : {}}>
              <Row
                data={finalTableHead.map((header, headerIndex) =>
                  renderHeaderCell ?
                    renderHeaderCell(header, headerIndex) :
                    renderDefaultHeaderCell(header, headerIndex)
                )}
                style={[
                  styles.tableHead,
                  { backgroundColor: theme.inputBackground },
                ]}
                widthArr={calculatedColumnWidths}
              />
            </Table>

            {/* Body */}
            <ScrollView
              style={[styles.verticalScrollView, {
                maxHeight: tableMaxHeight - 50, // Trừ đi chiều cao của header
              }]}
              showsVerticalScrollIndicator={verticalScrollEnabled}
              persistentScrollbar={verticalScrollEnabled}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              bounces={true}
              alwaysBounceVertical={true}
              contentContainerStyle={{ flexGrow: 1 }}
              scrollEnabled={verticalScrollEnabled}>
              <Table
                borderStyle={showBorder ? {
                  borderWidth: 1,
                  borderColor: theme.border
                } : {}}>
                {tableData.map((rowData, rowIndex) => {
                  if (!rowData || !Array.isArray(rowData)) {
                    return null;
                  }

                  // Chuẩn bị dữ liệu cho row (bao gồm cả index nếu cần)
                  const finalRowData = showRowIndex ?
                    [rowIndex + 1, ...rowData] :
                    rowData;

                  const rowContent = (
                    <Row
                      key={`row-${rowIndex}`}
                      data={finalRowData.map((cell, cellIndex) =>
                        renderCell ?
                          renderCell(cell, rowIndex, cellIndex) :
                          renderDefaultCell(cell, rowIndex, cellIndex)
                      )}
                      style={[
                        styles.tableRow,
                        { backgroundColor: theme.surface },
                      ]}
                      widthArr={calculatedColumnWidths}
                    />
                  );

                  // Nếu có onRowPress, wrap trong TouchableOpacity
                  if (onRowPress) {
                    return (
                      <TouchableOpacity
                        key={`row-wrapper-${rowIndex}`}
                        onPress={() => onRowPress(rowData, rowIndex)}
                        activeOpacity={0.7}>
                        {rowContent}
                      </TouchableOpacity>
                    );
                  }

                  return rowContent;
                })}
              </Table>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Scroll Hint */}
      {showScrollHint && (
        <View style={styles.scrollHint}>
          <Text style={[styles.scrollHintText, { color: theme.textSecondary }]}>
            💡{' '}
            {t(
              'database.table.scrollHint',
              'Vuốt ngang để xem thêm cột, vuốt dọc để xem thêm dòng',
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  sectionContainer: {
    padding: isTablet ? 24 : 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  tableHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 0,
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
  tableHeaderText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    flexWrap: 'wrap',
  },
  indexText: {
    fontWeight: 'bold',
    fontSize: isTablet ? 12 : 10,
  },
  tableImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 8,
  },
  scrollHint: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  scrollHintText: {
    fontSize: isTablet ? 14 : 12,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    fontSize: isTablet ? 18 : 16,
  },
});

export default DataTable;
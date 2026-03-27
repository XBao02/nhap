import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Icon from '@react-native-vector-icons/material-icons';
import {useTheme} from '../../styles/ThemeContext';
import {useLanguage} from '../../i18n';
import {GradientButton} from '../../components/common';
import {DataTable} from '../../components/common';
import {
  SQLiteDAO,
  ColumnDefinition,
  DatabaseManager,
  schemaConfigurations,
} from '../../database';
import {NavigationService} from '../../registries';
import {DatabaseFormModal, ImportModal} from './modals';
import {
  GoogleSheetParams,
  DirectGoogleSheetParams,
  ProcessedData,
  googleSheetService,
  GoogleSheetServiceError,
} from '../../services';
import {isTablet} from '../../utils';

// Lấy danh sách các key của database từ schema đã đăng ký
const databaseKeys = Object.keys(schemaConfigurations || {});

export const DatabaseContent: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useLanguage();

  // State quản lý UI - loại bỏ isDbInitialized vì không cần khởi tạo tất cả database ngay từ đầu
  const [error, setError] = useState<string | null>(null);
  const [selectedDbKey, setSelectedDbKey] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [tableHead, setTableHead] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State để theo dõi trạng thái khởi tạo của từng database
  const [initializedDatabases, setInitializedDatabases] = useState<Set<string>>(
    new Set(),
  );

  // State để quản lý currentDAO
  const [currentDAO, setCurrentDAO] = useState<SQLiteDAO | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const importFormData: GoogleSheetParams = {
    googleSheetLink:
      'https://docs.google.com/spreadsheets/d/1VPQgrDqbvVhxbjYp5Vv2Korvh2fYCubB/edit?gid=594575742#gid=594575742',
    sheets: 'categories',
    startFromRow: 3,
  };

  const storeId = 'POS1755159103808U1M8'; // Mặc định, có thể lấy từ session

  // Effect để lấy DAO khi selectedDbKey hoặc initializedDatabases thay đổi
  useEffect(() => {
    const getDAO = async () => {
      if (!selectedDbKey || !schemaConfigurations[selectedDbKey]) {
        setCurrentDAO(null);
        return;
      }

      try {
        // Chỉ lấy DAO nếu database đã được khởi tạo
        if (!initializedDatabases.has(selectedDbKey)) {
          setCurrentDAO(null);
          return;
        }

        const dao = await DatabaseManager.getLazyLoading(
          selectedDbKey as keyof typeof schemaConfigurations,
        );
        setCurrentDAO(dao);
      } catch (error) {
        console.error('Error getting DAO:', error);
        setCurrentDAO(null);
      }
    };

    getDAO();
  }, [selectedDbKey, initializedDatabases]);

  // Component mount - chỉ kiểm tra xem DatabaseManager có sẵn sàng không
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!DatabaseManager) {
          throw new Error('DatabaseManager is not initialized');
        }

        // Kiểm tra xem có database nào đã được khởi tạo trước đó không
        const connections = DatabaseManager.getConnections();
        const existingDbs = new Set(Object.keys(connections));
        setInitializedDatabases(existingDbs);

        console.log(
          'DatabaseContent initialized, existing databases:',
          Array.from(existingDbs),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : t('database.error.unknown'));
      }
    };
    initialize();
  }, [t]);

  const currentSchema = useMemo(() => {
    if (!selectedDbKey) return null;
    return (
      schemaConfigurations[
        selectedDbKey as keyof typeof schemaConfigurations
      ] || null
    );
  }, [selectedDbKey]);

  const tableList = useMemo(() => {
    if (!currentSchema) return [];
    return Object.keys(currentSchema.schemas || {});
  }, [currentSchema]);

  const tableColumns = useMemo((): ColumnDefinition[] => {
    if (!currentSchema || !selectedTable) return [];
    return currentSchema.schemas[selectedTable]?.cols || [];
  }, [currentSchema, selectedTable]);

  const primaryKey = useMemo(() => {
    const pkColumn = tableColumns.find(col =>
      col.constraints?.includes('PRIMARY KEY'),
    );
    return pkColumn?.name || 'id';
  }, [tableColumns]);

  // Tính toán chiều rộng cột động
  const columnWidths = useMemo(() => {
    if (tableHead.length === 0) return [];

    const minWidths = tableHead.map((header, index) => {
      let maxWidth = header.length * 10 + 20;

      tableData.forEach(row => {
        const cellContent = String(row[index] || '');
        const cellWidth = cellContent.length * 8 + 20;
        maxWidth = Math.max(maxWidth, cellWidth);
      });

      return Math.min(
        Math.max(maxWidth, isTablet ? 120 : 100),
        isTablet ? 200 : 150,
      );
    });

    return minWidths;
  }, [tableHead, tableData]);

  // Xử lý sự kiện
  const resetStateForNewSelection = () => {
    setSelectedTable(null);
    setTableData([]);
    setTableHead([]);
  };

  // Khởi tạo database lazy khi được chọn
  const initializeDatabaseIfNeeded = useCallback(
    async (dbKey: string): Promise<boolean> => {
      // Kiểm tra xem database đã được khởi tạo chưa
      if (initializedDatabases.has(dbKey)) {
        console.log(`Database '${dbKey}' is already initialized`);
        return true;
      }

      console.log(`Initializing database '${dbKey}'...`);
      setIsLoading(true);

      try {
        // Sử dụng initLazySchema để khởi tạo database khi cần
        const isDaoInit = await DatabaseManager.initLazySchema([
          dbKey as keyof typeof schemaConfigurations,
        ]);

        if (isDaoInit) {
          // Cập nhật danh sách database đã khởi tạo
          setInitializedDatabases(prev => new Set(prev).add(dbKey));
          console.log(`Successfully initialized database '${dbKey}'`);
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Failed to initialize database '${dbKey}':`, error);
        Alert.alert(
          t('database.error.title'),
          t(
            'database.error.initDatabase',
            `Failed to initialize database '${dbKey}': ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          ),
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [initializedDatabases, t],
  );

  const handleDbSelect = useCallback(
    async (dbKey: string, index: number) => {
      console.log('Database selected:', dbKey, 'at index:', index);
      setIsLoading(true);
      setError(null);

      // Reset state cho selection mới
      resetStateForNewSelection();

      try {
        // Khởi tạo database nếu cần
        const initSuccess = await initializeDatabaseIfNeeded(dbKey);

        if (initSuccess) {
          setSelectedDbKey(dbKey);
          console.log(`Database '${dbKey}' is ready for use`);
        } else {
          setSelectedDbKey(null);
          console.error(`Failed to initialize database '${dbKey}'`);
        }
      } catch (error) {
        console.error('Error during database selection:', error);
        setError(
          error instanceof Error ? error.message : 'Unknown error occurred',
        );
        setSelectedDbKey(null);
      } finally {
        setIsLoading(false);
      }
    },
    [initializeDatabaseIfNeeded],
  );

  const fetchData = useCallback(
    async (tableName?: string) => {
      const tableToFetch = tableName || selectedTable;
      if (!currentDAO || !tableToFetch) {
        setTableData([]);
        setTableHead([]);
        return;
      }

      setIsLoading(true);
      try {
        const columns = currentSchema?.schemas[tableToFetch]?.cols.map(
          c => c.name,
        ) || ['*'];
        setTableHead(columns);

        const result = await currentDAO.selectAll({
          name: tableToFetch,
          cols: [],
        });

        const dataForTable = result.map(row =>
          columns.map(colName => {
            const value = row[colName];
            if (value === null || value === undefined) {
              return '';
            }
            if (typeof value === 'boolean') {
              return value ? '1' : '0';
            }
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return String(value).trim();
          }),
        );

        setTableData(dataForTable);
      } catch (error) {
        Alert.alert(
          t('database.error.title'),
          error instanceof Error ? error.message : t('database.error.fetch'),
        );
        setTableData([]);
        setTableHead([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentDAO, selectedTable, currentSchema, t],
  );

  const handleTableSelect = useCallback(
    (tableName: string, index: number) => {
      console.log('Table selected:', tableName, 'at index:', index);
      setIsLoading(true);
      setSelectedTable(tableName);
      fetchData(tableName);
      setIsLoading(false);
    },
    [fetchData],
  );

  const fetchGoogleSheetData = async (params: DirectGoogleSheetParams) => {
    // const result: ProcessedData = await googleSheetService.getData(params);
    const result: ProcessedData = await googleSheetService.getDataDirect(params);
    return result;
  };

  // Refresh data after modal operations
  const handleRefreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const handleShowCreateModal = useCallback(() => {
    if (!currentDAO || !selectedTable || !tableColumns.length) {
      Alert.alert(t('database.error.title'), t('database.error.selectTable'));
      return;
    }

    NavigationService.showModal(DatabaseFormModal, {
      title: t('database.form.createTitle', 'Create new'),
      currentDAO,
      selectedTable,
      tableColumns,
      primaryKey,
      selectedRowData: null,
      onSave: handleRefreshData,
    });
  }, [
    currentDAO,
    selectedTable,
    tableColumns,
    primaryKey,
    t,
    handleRefreshData,
  ]);

  const handleShowEditModal = useCallback(
    (rowData: any[]) => {
      if (!currentDAO || !selectedTable || !tableColumns.length) return;

      const rowObject = tableHead.reduce((acc, head, index) => {
        const cellValue = rowData[index];
        acc[head] =
          cellValue === null || cellValue === undefined ? '' : cellValue;
        return acc;
      }, {} as Record<string, any>);

      NavigationService.showModal(DatabaseFormModal, {
        title: t('database.form.editTitle', 'Chỉnh sửa'),
        currentDAO,
        selectedTable,
        tableColumns,
        primaryKey,
        selectedRowData: rowObject,
        onSave: handleRefreshData,
      });
    },
    [
      currentDAO,
      selectedTable,
      tableColumns,
      primaryKey,
      tableHead,
      t,
      handleRefreshData,
    ],
  );

  const handleShowImportModal = useCallback(() => {
    NavigationService.showModal(ImportModal, {
      title: t('database.form.importTitle', 'Import'),
      selectedDbKey,
      importFormData,
      importLoading,
      onImport: handleImportData,
    });
  }, [importFormData, importLoading, t]);

  const handleImportData = useCallback(
    async (formData: GoogleSheetParams) => {
      if (!selectedDbKey || !currentDAO) {
        Alert.alert('Lỗi', 'Database không khả dụng');
        return;
      }

      if (!formData.googleSheetLink.trim() || !formData.sheets.trim()) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
        return;
      }

      setImportLoading(true);

      try {
        const processedData = await fetchGoogleSheetData(formData as DirectGoogleSheetParams);
        if (!processedData || Object.keys(processedData).length === 0) {
          throw new Error('No data for import');
        }

        const importResults = [];
        let totalImported = 0;
        let totalErrors = 0;

        for (const sheetName of Object.keys(processedData)) {
          const sheetData = processedData[sheetName];

          if (!Array.isArray(sheetData) || sheetData.length === 0) {
            console.log(`Sheet '${sheetName}' is empty, skipping...`);
            continue;
          }

          if (!tableList.includes(sheetName)) {
            console.log(
              `Table '${sheetName}' not found in schema, skipping...`,
            );
            continue;
          }

          try {
            const result = await DatabaseManager.importDataToTable(
              selectedDbKey as keyof typeof schemaConfigurations,
              sheetName,
              sheetData,
              {
                batchSize: 100,
                validateData: true,
                skipErrors: true,
                updateOnConflict: true, // update khi trung key
                conflictColumns: ['id'], // xac dinh key la id
                includeAutoIncrementPK: true, // Import đầy đủ cột bao gồm auto increment PK (mặc định: false)
                onProgress: (current, total) => {
                  console.log(`Progress ${sheetName}: ${current}/${total}`);
                },
                onError: (error, rowIndex) => {
                  console.error(
                    `Error importing row ${rowIndex} to ${sheetName}:`,
                    error,
                  );
                  totalErrors++;
                },
              },
            );

            importResults.push({
              table: sheetName,
              imported: result.successRows || 0,
              errors: result.errors || 0,
              success: true,
            });

            totalImported += result.successRows || 0;
          } catch (tableError) {
            console.error(
              `Error importing to table '${sheetName}':`,
              tableError,
            );
            importResults.push({
              table: sheetName,
              imported: 0,
              errors: 1,
              success: false,
              error:
                tableError instanceof Error
                  ? tableError.message
                  : 'Unknown error',
            });
            totalErrors++;
          }
        }

        const successTables = importResults.filter(r => r.success).length;
        const failedTables = importResults.filter(r => !r.success).length;

        let message = `Import hoàn tất!\n\n`;
        message += `• Tổng số bản ghi đã import: ${totalImported}\n`;
        message += `• Số bảng thành công: ${successTables}\n`;
        if (failedTables > 0) {
          message += `• Số bảng lỗi: ${failedTables}\n`;
        }
        if (totalErrors > 0) {
          message += `• Tổng số lỗi: ${totalErrors}\n`;
        }

        message += `\nChi tiết:\n`;
        importResults.forEach(result => {
          if (result.success) {
            message += `✅ ${result.table}: ${result.imported} bản ghi\n`;
          } else {
            message += `❌ ${result.table}: ${result.error}\n`;
          }
        });

        Alert.alert('Import thành công', message, [
          {
            text: 'OK',
            onPress: () => {
              handleRefreshData();
              NavigationService.hideModal();
            },
          },
        ]);
      } catch (error) {
        console.error('Import error:', error);
        let errorMessage = 'Có lỗi xảy ra khi import dữ liệu';
        if (error instanceof GoogleSheetServiceError) {
          errorMessage = `Google Sheets Error: ${error.message}`;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        Alert.alert('Lỗi Import', errorMessage, [{text: 'OK'}]);
      } finally {
        setImportLoading(false);
      }
    },
    [selectedDbKey, currentDAO, importFormData, tableList, handleRefreshData],
  );

  const handleClearTable = useCallback(() => {
    if (!selectedDbKey || !selectedTable || !currentDAO) {
      Alert.alert(
        t('database.error.title', 'Lỗi'),
        'Vui lòng chọn database và bảng trước khi xóa',
      );
      return;
    }

    Alert.alert(
      'Xác nhận xóa dữ liệu',
      `Bạn có chắc chắn muốn xóa tất cả dữ liệu trong bảng "${selectedTable}"?\n\nHành động này không thể hoàn tác!`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await DatabaseManager.truncateTable(
                selectedDbKey as keyof typeof schemaConfigurations,
                selectedTable,
              );

              Alert.alert(
                'Thành công',
                `Đã xóa tất cả dữ liệu trong bảng "${selectedTable}"`,
                [
                  {
                    text: 'OK',
                    onPress: handleRefreshData,
                  },
                ],
              );
            } catch (error) {
              console.error('Error clearing table:', error);
              Alert.alert(
                'Lỗi',
                error instanceof Error
                  ? error.message
                  : 'Không thể xóa dữ liệu',
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  }, [selectedDbKey, selectedTable, currentDAO, handleRefreshData, t]);

  // Render Components
  const renderDropdown = useCallback(
    (
      title: string,
      placeholder: string,
      data: string[],
      onSelect: (selectedItem: string, index: number) => void,
      defaultValue?: string | null,
      key?: string, // Thêm key parameter
    ) => {
      console.log('Rendering dropdown:', title, 'with data:', data);

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('Dropdown data is empty or invalid');
        return null;
      }

      const safeTitle = title && typeof title === 'string' ? title : '';
      const safePlaceholder =
        placeholder && typeof placeholder === 'string'
          ? placeholder
          : 'Select...';

      const validData = data.filter(item => item && typeof item === 'string');
      console.log('Valid dropdown data:', validData);

      return (
        <View
          style={[styles.sectionContainer, {backgroundColor: theme.surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>
            {safeTitle}
          </Text>
          <SelectDropdown
            key={key} // Sử dụng key để force re-render
            data={validData}
            onSelect={(selectedItem, index) => {
              console.log('Dropdown onSelect called:', selectedItem, index);
              onSelect(selectedItem, index);
            }}
            defaultValue={defaultValue}
            renderButton={(selectedItem, isOpened) => {
              console.log(
                'Rendering dropdown button, selectedItem:',
                selectedItem,
              );
              return (
                <View
                  style={[
                    styles.dropdownButtonStyle,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.dropdownButtonTxtStyle,
                      {color: theme.text},
                    ]}>
                    {selectedItem && typeof selectedItem === 'string'
                      ? selectedItem
                      : safePlaceholder}
                  </Text>
                  <Icon
                    name={
                      isOpened ? 'arrow-drop-up' : ('arrow-drop-down' as any)
                    }
                    style={[
                      styles.dropdownButtonArrowStyle,
                      {color: theme.text},
                    ]}
                  />
                </View>
              );
            }}
            renderItem={(item, index, isSelected) => (
              <View
                style={[
                  styles.dropdownItemStyle,
                  {
                    backgroundColor: isSelected
                      ? theme.selectedBackground
                      : theme.surface,
                  },
                ]}>
                <Text
                  style={[styles.dropdownItemTxtStyle, {color: theme.text}]}>
                  {item && typeof item === 'string' ? item : ''}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            dropdownStyle={[
              styles.dropdownMenuStyle,
              {backgroundColor: theme.surface},
            ]}
          />
        </View>
      );
    },
    [theme],
  );

  const renderDatabaseStatus = () => {
    if (!selectedDbKey) return null;

    const isInitialized = initializedDatabases.has(selectedDbKey);
    return (
      <View style={[styles.statusContainer, {backgroundColor: theme.surface}]}>
        <Text style={[styles.statusText, {color: theme.text}]}>
          {t('database.status.title', 'Trạng thái')}:
          <Text
            style={{
              color: isInitialized
                ? theme.success || '#4CAF50'
                : theme.warning || '#FF9800',
            }}>
            {isInitialized
              ? ` ${t('database.status.initialized', 'Đã khởi tạo')}`
              : ` ${t('database.status.notInitialized', 'Chưa khởi tạo')}`}
          </Text>
        </Text>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!selectedTable || !currentDAO) return null;

    return (
      <View style={[styles.sectionContainer, {backgroundColor: theme.surface}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('database.actions.title', 'Actions')}
        </Text>
        <View style={styles.actionsContainer}>
          <GradientButton
            title= {t('database.actions.import', 'Import')}
            onPress={handleShowImportModal}
            disabled={isLoading || importLoading}
            colors={['#4CAF50', '#45a049']}
            style={styles.actionButton}
          />
          {selectedTable && (
            <GradientButton
              title={t('database.actions.create', 'Create')}
              onPress={handleShowCreateModal}
              disabled={isLoading}
              colors={theme.gradientButton}
              style={styles.actionButton}
            />
          )}
          {selectedTable && tableData.length > 0 && (
            <GradientButton
              title={t('database.actions.reset', 'Create')}
              onPress={handleClearTable}
              disabled={isLoading}
              colors={['#f44336', '#d32f2f']}
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    );
  };

  const renderMainContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: theme.text}]}>
            {t('database.error.init')}
          </Text>
          <Text style={[styles.errorText, {color: theme.text}]}>
            {String(error)}
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={[styles.title, {color: theme.text}]}>
          {t('database.title')}
        </Text>

        {/* Database Selection */}
        {databaseKeys &&
          databaseKeys.length > 0 &&
          renderDropdown(
            t('database.form.selectDb'),
            t('database.form.selectDbPlaceholder'),
            databaseKeys,
            handleDbSelect,
            selectedDbKey,
          )}

        {/* Database Status */}
        {renderDatabaseStatus()}

        {/* Table Selection - Thêm key để force re-render khi database thay đổi */}
        {selectedDbKey &&
          tableList &&
          Array.isArray(tableList) &&
          tableList.length > 0 &&
          renderDropdown(
            t('database.form.selectTable'),
            t('database.form.selectTablePlaceholder'),
            tableList,
            handleTableSelect,
            selectedTable,
            `table-dropdown-${selectedDbKey}`, // Key thay đổi khi database thay đổi
          )}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={styles.loadingIndicator}
          />
        )}

        {/* Data Table - Sử dụng component DataTable mới */}
        {!isLoading && selectedTable && currentDAO && (
          <DataTable
            tableName={selectedTable}
            tableHead={tableHead}
            tableData={tableData}
            onRowPress={handleShowEditModal}
            showEditHint={true}
            showScrollHint={true}
            showRowIndex={true} // Hiển thị số thứ tự dòng
            maxHeight={isTablet ? 500 : 400}
            minHeight={200}
          />
        )}
      </>
    );
  };

  return <View style={styles.scrollContainer}>{renderMainContent()}</View>;
};

// Styles
const styles = StyleSheet.create({
  container: {flex: 1},
  scrollContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionContainer: {
    padding: isTablet ? 24 : 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusContainer: {
    padding: isTablet ? 16 : 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
  },
  dropdownButtonStyle: {
    width: '100%',
    height: isTablet ? 56 : 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
  },
  dropdownButtonArrowStyle: {
    fontSize: isTablet ? 28 : 24,
  },
  dropdownMenuStyle: {
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    minWidth: isTablet ? 200 : '100%',
    marginHorizontal: isTablet ? 8 : 0,
  },
  tableHeaderRow: {
    flexDirection: 'column', // Thay đổi từ 'row' thành 'column'
    justifyContent: 'flex-start',
    alignItems: 'flex-start', // Hoặc 'center' nếu muốn căn giữa
    marginBottom: 0,
  },
  tableHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 0, // Thêm khoảng cách giữa title và hint
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: isTablet ? 500 : 400,
    minHeight: 200,
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
    maxHeight: isTablet ? 450 : 350,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: isTablet ? 18 : 16,
    marginTop: 8,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    fontSize: isTablet ? 18 : 16,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
});

export default DatabaseContent;

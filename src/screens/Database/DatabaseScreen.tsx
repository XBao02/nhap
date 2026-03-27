/**
 * Đây là một màn hình database chuẩn lấy bất kỳ schemaConfig nào cũng sẽ quản lý được csdl này
 * Sử dụng làm mẫu, còn trong phần của dự án sẽ dùng DatabaseContent
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SelectDropdown from 'react-native-select-dropdown';
import { Table, Row } from 'react-native-table-component';
import Icon from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../styles/ThemeContext';
import { useLanguage } from '../../i18n';
import { HeaderControls, CustomInput, GradientButton } from '../../components/common';
import { SQLiteDAO, ColumnDefinition, DatabaseManager, schemaConfigurations } from '../../database';
import { isTablet } from '../../utils';

// Lấy danh sách các key của database từ schema đã đăng ký
const databaseKeys = Object.keys(schemaConfigurations || {});

export const DatabaseScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  // State quản lý khởi tạo Db
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State quản lý UI
  const [selectedDbKey, setSelectedDbKey] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [tableHead, setTableHead] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedRowData, setSelectedRowData] = useState<Record<string, any> | null>(null);

  // Khởi tạo database
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        if (!DatabaseManager) {
          throw new Error('DatabaseManager is not initialized');
        }
        await DatabaseManager.initializeAll();
        setIsDbInitialized(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('database.error.unknown'));
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
    return () => {
      // Cleanup nếu cần
      // DatabaseManager.closeAll();
    };
  }, [t]);

  // Lấy thông tin schema và DAO
  const currentDAO: SQLiteDAO | null = useMemo(() => {
    if (!selectedDbKey || !schemaConfigurations[selectedDbKey]) return null;
    try {
      return DatabaseManager.get(selectedDbKey as keyof typeof schemaConfigurations);
    } catch (error) {
      console.error('Error getting DAO:', error);
      return null;
    }
  }, [selectedDbKey]);

  const currentSchema = useMemo(() => {
    if (!selectedDbKey) return null;
    return schemaConfigurations[selectedDbKey as keyof typeof schemaConfigurations] || null;
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
    const pkColumn = tableColumns.find(col => col.constraints?.includes('PRIMARY KEY'));
    return pkColumn?.name || 'id';
  }, [tableColumns]);

  // Xử lý sự kiện
  const resetStateForNewSelection = () => {
    setSelectedTable(null);
    setTableData([]);
    setTableHead([]);
    setFormData({});
    setSelectedRowData(null);
  };

  const handleDbSelect = (dbKey: string) => {
    setIsLoading(true);
    setSelectedDbKey(dbKey);
    resetStateForNewSelection();
    setIsLoading(false);
  };

  const handleTableSelect = (tableName: string) => {
    setIsLoading(true);
    setSelectedTable(tableName);
    const initialFormData = tableColumns.reduce((acc, col) => {
      acc[col.name] = col.type === 'boolean' ? false : '';
      return acc;
    }, {} as Record<string, any>);
    setFormData(initialFormData);
    setSelectedRowData(null);
    fetchData(tableName);
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        const columns = currentSchema?.schemas[tableToFetch]?.cols.map(c => c.name) || ['*'];
        setTableHead(columns);

        const result = await currentDAO.selectAll({
          name: tableToFetch,
          cols: [],
        });

        const dataForTable = result.map(row =>
          columns.map(colName => {
            const value = row[colName];
            return value === null || value === undefined ? '' : String(value);
          }),
        );

        setTableData(dataForTable);
      } catch (error) {
        Alert.alert(t('database.error.title'), error instanceof Error ? error.message : t('database.error.fetch'));
        setTableData([]);
        setTableHead([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentDAO, selectedTable, currentSchema, t],
  );

  const handleSave = async () => {
    if (!currentDAO || !selectedTable) return;

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      tableColumns.forEach(col => {
        if (col.type === 'boolean') {
          dataToSave[col.name] = dataToSave[col.name] ? 1 : 0;
        }
      });

      if (selectedRowData) {
        const whereClause = { name: primaryKey, value: selectedRowData[primaryKey] };
        await currentDAO.update({
          name: selectedTable,
          cols: Object.entries(dataToSave).map(([name, value]) => ({ name, value })),
          wheres: [whereClause],
        });
        Alert.alert(t('database.success.title'), t('database.success.update'));
      } else {
        await currentDAO.insert({
          name: selectedTable,
          cols: Object.entries(dataToSave).map(([name, value]) => ({ name, value })),
        });
        Alert.alert(t('database.success.title'), t('database.success.insert'));
      }
      clearForm();
      fetchData();
    } catch (error) {
      Alert.alert(t('database.error.title'), error instanceof Error ? error.message : t('database.error.save'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDAO || !selectedTable || !selectedRowData) return;

    Alert.alert(
      t('database.confirm.deleteTitle'),
      t('database.confirm.deleteMessage'),
      [
        { text: t('database.common.cancel'), style: 'cancel' },
        {
          text: t('database.common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const whereClause = { name: primaryKey, value: selectedRowData[primaryKey] };
              await currentDAO.delete({
                name: selectedTable,
                cols: [],
                wheres: [whereClause],
              });
              Alert.alert(t('database.success.title'), t('database.success.delete'));
              clearForm();
              fetchData();
            } catch (error) {
              Alert.alert(t('database.error.title'), error instanceof Error ? error.message : t('database.error.delete'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRowPress = (rowData: any[]) => {
    const rowObject = tableHead.reduce((acc, head, index) => {
      acc[head] = rowData[index];
      return acc;
    }, {} as Record<string, any>);

    const formValues = { ...rowObject };
    tableColumns.forEach(col => {
      if (col.type === 'boolean') {
        formValues[col.name] = formValues[col.name] === '1' || formValues[col.name] === 'true';
      }
    });

    setFormData(formValues);
    setSelectedRowData(rowObject);
  };

  const clearForm = () => {
    const initialFormData = tableColumns.reduce((acc, col) => {
      acc[col.name] = col.type === 'boolean' ? false : '';
      return acc;
    }, {} as Record<string, any>);
    setFormData(initialFormData);
    setSelectedRowData(null);
  };

  // Render Components
  const renderDropdown = (
    title: string,
    placeholder: string,
    data: string[],
    onSelect: (selectedItem: string, index: number) => void,
    defaultValue?: string | null,
  ) => {
    if (data.length === 0) return null;
    return (
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <SelectDropdown
          data={data}
          onSelect={onSelect}
          defaultValue={defaultValue}
          renderButton={(selectedItem, isOpened) => (
            <View style={[styles.dropdownButtonStyle, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Text style={[styles.dropdownButtonTxtStyle, { color: theme.text }]}>
                {selectedItem || placeholder}
              </Text>
              <Icon
                name={isOpened ? 'arrow-drop-up' : 'arrow-drop-down' as any}
                style={[styles.dropdownButtonArrowStyle, { color: theme.text }]}
              />
            </View>
          )}
          renderItem={(item, index, isSelected) => (
            <View
              style={[styles.dropdownItemStyle, { backgroundColor: isSelected ? theme.selectedBackground : theme.surface }]}
            >
              <Text style={[styles.dropdownItemTxtStyle, { color: theme.text }]}>{item}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          dropdownStyle={[styles.dropdownMenuStyle, { backgroundColor: theme.surface }]}
        />
      </View>
    );
  };

  const renderDynamicForm = () => {
    if (!selectedTable || tableColumns.length === 0) return null;

    return (
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('database.form.title', { table: selectedTable })}
        </Text>
        {tableColumns.map(col => {
          if (col.constraints?.includes('AUTO_INCREMENT')) return null;
          if (col.type === 'boolean') {
            return (
              <View key={col.name} style={styles.switchContainer}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>{col.name}</Text>
                <Switch
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={isDark ? theme.accent : '#f4f3f4'}
                  onValueChange={value => handleInputChange(col.name, value)}
                  value={!!formData[col.name]}
                />
              </View>
            );
          }
          return (
            <CustomInput
              key={col.name}
              label={col.name}
              value={String(formData[col.name] ?? '')}
              placeholder={`${t('database.form.enter')} ${col.name}`}
              onChangeText={value => handleInputChange(col.name, value)}
              keyboardType={['integer', 'bigint', 'decimal', 'float'].includes(col.type) ? 'numeric' : 'default'}
            />
          );
        })}
        <View style={styles.formActions}>
          <GradientButton
            title={selectedRowData ? t('database.common.update') : t('database.common.save')}
            onPress={handleSave}
            disabled={isLoading}
            colors={theme.gradientButton}
          />
          {selectedRowData && (
            <GradientButton
              title={t('database.common.delete')}
              onPress={handleDelete}
              disabled={isLoading}
              colors={theme.gradientButton}
            />
          )}
          <TouchableOpacity onPress={clearForm} style={styles.clearButton}>
            <Text style={{ color: theme.accent }}>{t('database.common.clear')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDataTable = () => {
    if (!selectedTable) return null;
    if (tableData.length === 0) {
      return (
        <Text style={[styles.noDataText, { color: theme.text }]}>{t('database.form.noData')}</Text>
      );
    }

    return (
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('database.form.dataTitle', { table: selectedTable })}
        </Text>
        <ScrollView horizontal
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={false}>
          <View>
            <Table borderStyle={{ borderWidth: 1, borderColor: theme.border }}>
              <Row
                data={tableHead}
                style={[styles.tableHead, { backgroundColor: theme.inputBackground }]}
                textStyle={[styles.tableHeaderText, { color: theme.text }]}
                widthArr={tableHead.map(() => (isTablet ? 150 : 100))}
              />
            </Table>
            <ScrollView style={styles.dataWrapper}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              bounces={false}>
              <Table borderStyle={{ borderWidth: 1, borderColor: theme.border }}>
                {tableData.map((rowData, index) => (
                  <TouchableOpacity key={index} onPress={() => handleRowPress(rowData)}>
                    <Row
                      data={rowData}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor:
                            selectedRowData &&
                              selectedRowData[primaryKey] === rowData[tableHead.indexOf(primaryKey)]
                              ? theme.selectedBackground
                              : theme.surface,
                        },
                      ]}
                      textStyle={[styles.tableText, { color: theme.text }]}
                      widthArr={tableHead.map(() => (isTablet ? 150 : 100))}
                    />
                  </TouchableOpacity>
                ))}
              </Table>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
          <HeaderControls isHome={false} />
          <ScrollView contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.text }]}>{t('database.error.init')}</Text>
                <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
              </View>
            ) : !isDbInitialized ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>{t('database.loading')}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: theme.text }]}>{t('database.title')}</Text>
                {renderDropdown(t('database.form.selectDb'), t('database.form.selectDbPlaceholder'), databaseKeys, handleDbSelect, selectedDbKey)}
                {selectedDbKey && tableList.length > 0 &&
                  renderDropdown(t('database.form.selectTable'), t('database.form.selectTablePlaceholder'), tableList, handleTableSelect, selectedTable)}
                {isLoading ? (
                  <ActivityIndicator size="large" color={theme.primary} style={styles.loadingIndicator} />
                ) : (
                  <>
                    {renderDynamicForm()}
                    {renderDataTable()}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
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
  formActions: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    gap: isTablet ? 16 : 8,
  },
  clearButton: {
    padding: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switchLabel: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
  },
  tableHead: {
    height: isTablet ? 48 : 40,
  },
  tableHeaderText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    minHeight: isTablet ? 48 : 40,
  },
  tableText: {
    fontSize: isTablet ? 16 : 14,
    textAlign: 'center',
  },
  dataWrapper: {
    marginTop: -1,
    maxHeight: isTablet ? 400 : 300,
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

export default DatabaseScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../styles/ThemeContext';
import { useLanguage } from '../../../i18n';
import { CustomInput, GradientButton } from '../../../components/common';
import { SQLiteDAO, ColumnDefinition } from '../../../database';
import { isTablet } from '../../../utils';

interface DatabaseFormModalProps {
  title?: string;
  visible?: boolean;
  currentDAO: SQLiteDAO;
  selectedTable: string;
  tableColumns: ColumnDefinition[];
  primaryKey: string;
  selectedRowData?: Record<string, any> | null;
  onClose: () => void;
  onSave: () => void;
}

export const DatabaseFormModal: React.FC<DatabaseFormModalProps> = ({
  title = 'Nhập liệu Database',
  currentDAO,
  selectedTable,
  tableColumns,
  primaryKey,
  selectedRowData = null,
  onClose,
  onSave,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to check if field is required (NOT NULL constraint)
  const isFieldRequired = (col: ColumnDefinition): boolean => {
    return col.constraints?.includes('NOT NULL') || false;
  };

  // Helper function to check if field is auto increment
  const isAutoIncrement = (col: ColumnDefinition): boolean => {
    return col.auto_increment || col.constraints?.includes('AUTO_INCREMENT') || false;
  };

  // Initialize form data
  useEffect(() => {
    const initialFormData = tableColumns.reduce((acc, col) => {
      if (selectedRowData) {
        // Edit mode - populate with selected row data
        const value = selectedRowData[col.name];
        if (col.type === 'boolean') {
          acc[col.name] =
            value === '1' ||
            value === 'true' ||
            value === true ||
            (typeof value === 'string' && value.toLowerCase() === 'true');
        } else {
          acc[col.name] = value === null || value === undefined ? '' : value;
        }
      } else {
        // Create mode - set defaults
        if (col.type === 'boolean') {
          // Check for default value in constraints
          if (col.constraints?.includes('DEFAULT TRUE')) {
            acc[col.name] = true;
          } else if (col.constraints?.includes('DEFAULT FALSE')) {
            acc[col.name] = false;
          } else {
            acc[col.name] = false;
          }
        } else {
          // Handle other default values
          if (col.default !== undefined) {
            acc[col.name] = col.default;
          } else if (col.constraints?.includes('DEFAULT')) {
            // Extract default value from constraints string
            const defaultMatch = col.constraints.match(/DEFAULT\s+([^,\s]+)/i);
            if (defaultMatch) {
              const defaultValue = defaultMatch[1];
              if (defaultValue === 'CURRENT_TIMESTAMP') {
                acc[col.name] = new Date().toISOString();
              } else if (!isNaN(Number(defaultValue))) {
                acc[col.name] = Number(defaultValue);
              } else {
                acc[col.name] = defaultValue.replace(/['"]/g, '');
              }
            } else {
              acc[col.name] = '';
            }
          } else {
            acc[col.name] = '';
          }
        }
      }
      return acc;
    }, {} as Record<string, any>);

    setFormData(initialFormData);
  }, [tableColumns, selectedRowData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentDAO || !selectedTable) return;

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };

      // Process data before saving
      tableColumns.forEach(col => {
        if (col.type === 'boolean') {
          dataToSave[col.name] = dataToSave[col.name] ? 1 : 0;
        }

        // Remove auto increment fields for insert operations
        if (!selectedRowData && isAutoIncrement(col)) {
          delete dataToSave[col.name];
        }
      });

      if (selectedRowData) {
        // Update mode
        const whereClause = {
          name: primaryKey,
          value: selectedRowData[primaryKey],
        };
        await currentDAO.update({
          name: selectedTable,
          cols: Object.entries(dataToSave).map(([name, value]) => ({
            name,
            value,
          })),
          wheres: [whereClause],
        });
        Alert.alert(t('database.success.title'), t('database.success.update'));
      } else {
        // Insert mode
        await currentDAO.insert({
          name: selectedTable,
          cols: Object.entries(dataToSave).map(([name, value]) => ({
            name,
            value,
          })),
        });
        Alert.alert(t('database.success.title'), t('database.success.insert'));
      }

      onSave(); // Callback to refresh parent data
      onClose(); // Close modal
    } catch (error) {
      Alert.alert(
        t('database.error.title'),
        error instanceof Error ? error.message : t('database.error.save'),
      );
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
              const whereClause = {
                name: primaryKey,
                value: selectedRowData[primaryKey],
              };
              await currentDAO.delete({
                name: selectedTable,
                cols: [],
                wheres: [whereClause],
              });
              Alert.alert(
                t('database.success.title'),
                t('database.success.delete'),
              );
              onSave(); // Callback to refresh parent data
              onClose(); // Close modal
            } catch (error) {
              Alert.alert(
                t('database.error.title'),
                error instanceof Error
                  ? error.message
                  : t('database.error.delete'),
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const clearForm = () => {
    const initialFormData = tableColumns.reduce((acc, col) => {
      if (col.type === 'boolean') {
        if (col.constraints?.includes('DEFAULT TRUE')) {
          acc[col.name] = true;
        } else if (col.constraints?.includes('DEFAULT FALSE')) {
          acc[col.name] = false;
        } else {
          acc[col.name] = false;
        }
      } else {
        if (col.default !== undefined) {
          acc[col.name] = col.default;
        } else if (col.constraints?.includes('DEFAULT')) {
          const defaultMatch = col.constraints.match(/DEFAULT\s+([^,\s]+)/i);
          if (defaultMatch) {
            const defaultValue = defaultMatch[1];
            if (defaultValue === 'CURRENT_TIMESTAMP') {
              acc[col.name] = new Date().toISOString();
            } else if (!isNaN(Number(defaultValue))) {
              acc[col.name] = Number(defaultValue);
            } else {
              acc[col.name] = defaultValue.replace(/['"]/g, '');
            }
          } else {
            acc[col.name] = '';
          }
        } else {
          acc[col.name] = '';
        }
      }
      return acc;
    }, {} as Record<string, any>);
    setFormData(initialFormData);
  };

  const renderFormFields = () => {
    if (
      !tableColumns ||
      !Array.isArray(tableColumns) ||
      tableColumns.length === 0
    ) {
      return null;
    }

    return tableColumns.map(col => {
      if (!col || !col.name || typeof col.name !== 'string') {
        return null;
      }

      const isRequired = isFieldRequired(col);
      const isAutoInc = isAutoIncrement(col);

      if (col.type === 'boolean') {
        return (
          <View key={col.name} style={styles.fieldContainer}>
            <View style={[styles.switchContainer, { borderBottomColor: theme.border }]}>
              <View style={styles.labelContainer}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>
                  {col.name}
                  {isRequired && (
                    <Text style={[styles.requiredMark, { color: theme.error }]}> *</Text>
                  )}
                </Text>
                {col.description && (
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                    {col.description}
                  </Text>
                )}
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? theme.accent : '#f4f3f4'}
                onValueChange={value => handleInputChange(col.name, value)}
                value={!!formData[col.name]}
                disabled={isLoading}
              />
            </View>
          </View>
        );
      }

      const hintText = col.description
        ? `${col.description}${isAutoInc && !selectedRowData ? ' (Tự động tạo)' : ''}`
        : (isAutoInc && !selectedRowData ? 'Tự động tạo' : undefined);

      return (
        <View key={col.name} style={styles.fieldContainer}>
          <CustomInput
            label={col.name}
            value={String(formData[col.name] ?? '')}
            placeholder={
              isAutoInc && !selectedRowData
                ? t('database.form.autoGenerated', 'Giá trị sẽ được tự động tạo')
                : `${t('database.form.enter')} ${col.name}`
            }
            onChangeText={value => handleInputChange(col.name, value)}
            keyboardType={
              ['integer', 'bigint', 'decimal', 'float'].includes(col.type)
                ? 'numeric'
                : 'default'
            }
            editable={!isLoading && (!isAutoInc || selectedRowData !== null)}
            hint={hintText}
            required={isRequired}
          />
        </View>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.background,
        borderBottomColor: theme.border
      }]}>
        <TouchableOpacity
          onPress={() => !isLoading && onClose()}
          disabled={isLoading}
          style={[styles.cancelButton, { backgroundColor: 'transparent' }]}>
          <Text
            style={[
              styles.cancelButtonText,
              { color: theme.textSecondary },
              isLoading && styles.disabledText,
            ]}>
            {t('button.close', 'close')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {title} - {selectedTable}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={[styles.saveButton, { backgroundColor: theme.primary }]}>
          <Text
            style={[styles.saveButtonText, isLoading && styles.disabledText]}>
            {isLoading
              ? t('button.saving', 'saving')
              : selectedRowData
                ? t('button.update', 'update')
                : t('button.save', 'save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={false}>
        <View style={styles.formContainer}>
          {/* Required fields notice */}
          <View style={[styles.noticeContainer, {
            backgroundColor: theme.background,
            borderLeftColor: theme.accent,
            borderColor: theme.border
          }]}>
            <Text style={[styles.noticeText, { color: theme.error }]}>
              {t('database.form.requiredNotice', 'Fields with (*) are required')}
            </Text>
          </View>

          {renderFormFields()}
        </View>

        {/* Actions */}
        <View style={styles.formActions}>
          {selectedRowData && (
            <GradientButton
              title={t('button.delete', 'delete')}
              onPress={handleDelete}
              disabled={isLoading}
              colors={['#ff6b6b', '#ee5a5a']}
            />
          )}

          <TouchableOpacity
            onPress={clearForm}
            style={[styles.clearButton, {
              borderColor: theme.border,
              backgroundColor: 'transparent'
            }]}
            disabled={isLoading}>
            <Text style={[styles.clearButtonText, { color: theme.accent }]}>
              {t('button.clear', 'clear')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={[styles.loadingContainer, {
            backgroundColor: theme.background,
            borderColor: theme.border
          }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {selectedRowData
                ? t('button.updating', 'updating')
                : t('button.saving', 'saving')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Form styles
  formContainer: {
    paddingVertical: 16,
  },

  // Notice styles
  noticeContainer: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Field container
  fieldContainer: {
    marginBottom: 16,
  },

  // Switch styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  requiredMark: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },

  // Hint text styles (for boolean fields only now)
  hintText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    fontStyle: 'italic',
  },



  // Actions styles
  formActions: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: isTablet ? 16 : 12,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Loading styles
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default DatabaseFormModal;
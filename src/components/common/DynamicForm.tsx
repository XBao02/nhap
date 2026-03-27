import React from 'react';
import {View, Text, Switch, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../styles/ThemeContext';
import {useLanguage} from '../../i18n';
import {CustomInput, GradientButton} from './index';
import {ColumnDefinition} from '../../database';
import {isTablet} from '../../utils';

interface DynamicFormProps {
  tableName: string;
  columns: ColumnDefinition[];
  formData: Record<string, any>;
  isEditMode: boolean;
  isLoading: boolean;
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClear: () => void;
  showDeleteButton?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  tableName,
  columns,
  formData,
  isEditMode,
  isLoading,
  onInputChange,
  onSave,
  onDelete,
  onClear,
  showDeleteButton = true,
}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();

  if (!tableName || columns.length === 0) return null;

  return (
    <View style={[styles.sectionContainer, {backgroundColor: theme.surface}]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>
        {t('database.form.title', {table: tableName})}
      </Text>
      
      {columns.map(col => {
        if (col.constraints?.includes('AUTO_INCREMENT')) return null;
        
        if (col.type === 'boolean') {
          return (
            <View key={col.name} style={styles.switchContainer}>
              <Text style={[styles.switchLabel, {color: theme.text}]}>
                {col.name}
              </Text>
              <Switch
                trackColor={{false: theme.border, true: theme.primary}}
                thumbColor={isDark ? theme.accent : '#f4f3f4'}
                onValueChange={value => onInputChange(col.name, value)}
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
            onChangeText={value => onInputChange(col.name, value)}
            keyboardType={
              ['integer', 'bigint', 'decimal', 'float'].includes(col.type)
                ? 'numeric'
                : 'default'
            }
          />
        );
      })}
      
      <View style={styles.formActions}>
        <GradientButton
          title={
            isEditMode
              ? t('database.common.update')
              : t('database.common.save')
          }
          onPress={onSave}
          disabled={isLoading}
          colors={theme.gradientButton}
        />
        
        {isEditMode && showDeleteButton && onDelete && (
          <GradientButton
            title={t('database.common.delete')}
            onPress={onDelete}
            disabled={isLoading}
            colors={theme.gradientButton}
          />
        )}
        
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Text style={{color: theme.accent}}>
            {t('database.common.clear')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
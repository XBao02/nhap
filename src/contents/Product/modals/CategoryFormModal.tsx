import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, Switch, Alert} from 'react-native';
import {useTheme} from '../../../styles/ThemeContext';
import {useLanguage} from '../../../i18n';
import {categoryService, Category} from '../../../services';
import {GradientButton} from '../../../components';
import {NavigationService} from '../../../registries';

interface CategoryFormModalProps {
  title: string;
  category: Category | null; // Null cho create
  storeId: string;
  onSave: () => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  title,
  category,
  storeId,
  onSave,
}) => {
  const {theme} = useTheme();
  const {t} = useLanguage();
  const [formData, setFormData] = useState<Category>({
    store_id: storeId,
    name: '',
    description: '',
    parent_id: null,
    level: 1,
    sort_order: 0,
    color: '',
    is_active: true,
    ...category, // Override nếu edit
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof Category, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (category?.id) {
        await categoryService.update(category.id, formData);
      } else {
        await categoryService.create(formData);
      }
      onSave();
      Alert.alert(t('common.success', 'Thành công'));
      NavigationService.hideModal();
    } catch (err: any) {
      Alert.alert(t('common.error', 'Lỗi'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <Text style={[styles.title, {color: theme.text}]}>{title}</Text>
      {/* Form fields */}
      <TextInput
        style={[
          styles.input,
          {backgroundColor: theme.inputBackground, color: theme.text},
        ]}
        placeholder={t('category.name', 'Tên')}
        value={formData.name}
        onChangeText={text => handleChange('name', text)}
      />
      <TextInput
        style={[
          styles.input,
          {backgroundColor: theme.inputBackground, color: theme.text},
        ]}
        placeholder={t('category.description', 'Mô tả')}
        value={formData.description || ''}
        onChangeText={text => handleChange('description', text)}
      />
      <TextInput
        style={[
          styles.input,
          {backgroundColor: theme.inputBackground, color: theme.text},
        ]}
        placeholder={t('category.parentId', 'Parent ID')}
        value={formData.parent_id?.toString() || ''}
        keyboardType="numeric"
        onChangeText={text => handleChange('parent_id', parseInt(text) || null)}
      />
      {/* Thêm fields khác: level, sort_order, color, is_active (Switch) */}
      <View style={styles.switchContainer}>
        <Text style={{color: theme.text}}>
          {t('category.active', 'Active')}
        </Text>
        <Switch
          value={formData.is_active}
          onValueChange={value => handleChange('is_active', value)}
        />
      </View>
      <GradientButton
        title={t('common.save', 'Lưu')}
        onPress={handleSave}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, borderRadius: 8},
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 16},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

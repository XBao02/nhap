import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useTheme} from '../../styles/ThemeContext';
import {useLanguage} from '../../i18n';
import {categoryService} from '../../services';
import {NavigationService} from '../../registries';
import CategoriesTree from './CategoriesTree';
import {ImportModal, CategoryFormModal} from './modals';
import {
  GoogleSheetParams,
  ProcessedData,
  googleSheetService,
} from '../../services';

import {isTablet} from '../../utils';
import Icon from '@react-native-vector-icons/material-icons';
import {CategoryTreeNode} from './CategoryTreeDataTable';

export const CategoryContent: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useLanguage();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [importFormData, setImportFormData] = useState<GoogleSheetParams>({
    googleSheetLink:
      'https://docs.google.com/spreadsheets/d/1VPQgrDqbvVhxbjYp5Vv2Korvh2fYCubB/edit?gid=594575742#gid=594575742',
    sheets: 'categories',
    startFromRow: 3,
  });
  const [importLoading, setImportLoading] = useState(false);
  const storeId = 'POS1755159103808U1M8'; // Mặc định, có thể lấy từ session

  // Handle show import modal
  const handleShowImportModal = useCallback(() => {
    NavigationService.showModal(ImportModal, {
      title: t('category.importTitle', 'Import Categories từ Google Sheet'),
      importFormData,
      importLoading,
      onFormDataChange: (newFormData: GoogleSheetParams) =>
        setImportFormData(newFormData),
      onImport: handleImportData,
    });
  }, [importFormData, importLoading, t]);

  // Handle import data
  const handleImportData = useCallback(async () => {
    setImportLoading(true);
    try {
      // Giả định bạn có service để fetch raw data từ Google Sheet (như trong CategoriesContent.tsx)
      // Ở đây tôi dùng placeholder: fetch raw data rồi import vào DB
      const rawData = await fetchGoogleSheetData(importFormData); // ket qua tra ve la du lieu raw da lay
      const importOptions = {
        updateIfExists: true,
        skipDuplicates: true,
        validateHierarchy: true,
        allowInvalidParents: true,
      };
      const result = await categoryService.importCategories(
        storeId,
        rawData,
        importOptions,
      );

      if (result.success) {
        console.log(`✅ Import thành công: ${result.successCount} categories`);
        Alert.alert(
          t('common.success', 'Thành công'),
          `Imported ${result.successCount} categories`,
        );
        setRefreshTrigger(prev => prev + 1); // Refresh tree
      } else {
        console.log(`❌ Import thất bại:`);
        Alert.alert(
          t('common.error', 'Lỗi'),
          `Failed: ${result.failedCount} items`,
        );
      }
      NavigationService.hideModal();
    } catch (err: any) {
      Alert.alert(t('common.error', 'Lỗi'), err.message);
    } finally {
      setImportLoading(false);
    }
  }, [importFormData, storeId, t]);

  // Placeholder cho fetch Google Sheet (dựa trên mẫu CategoriesContent.tsx)
  const fetchGoogleSheetData = async (params: GoogleSheetParams) => {
    // Implement logic fetch từ Google Sheet (sử dụng googleSheetService nếu có)
    console.log('Fecthing raw data with params:', params);
    const result: ProcessedData = await googleSheetService.getData(params);
    const firstSheetName = params.sheets.split(',')[0].trim();
    const importedData = result[firstSheetName] || [];
    return importedData; // Trả về array raw data
  };

  // Handle create new
  const handleCreateNew = useCallback(() => {
    NavigationService.showModal(CategoryFormModal, {
      title: t('category.createTitle', 'Tạo mới Category'),
      category: null, // Null cho create
      storeId,
      onSave: () => setRefreshTrigger(prev => prev + 1),
    });
  }, [storeId, t]);

  // Handle edit (truyền từ tree)
  const handleEdit = useCallback(
    (category: CategoryTreeNode) => {
      NavigationService.showModal(CategoryFormModal, {
        title: t('category.editTitle', 'Sửa Category'),
        category,
        storeId,
        onSave: () => setRefreshTrigger(prev => prev + 1),
      });
    },
    [storeId, t],
  );

  // Handle delete (truyền từ tree)
  const handleDelete = useCallback(
    async (category: CategoryTreeNode) => {
      const categoryId: number = Number(category.id);

      if (await categoryService.hasChildCategories(categoryId!)) {
        Alert.alert(
          t('category.hasChildren', 'Không thể xóa category có children'),
        );
        return;
      }
      try {
        await categoryService.delete(category.id!);
        setRefreshTrigger(prev => prev + 1);
        Alert.alert(
          t('common.success', 'Thành công'),
          t('category.deleted', 'Đã xóa'),
        );
      } catch (err: any) {
        Alert.alert(t('common.error', 'Lỗi'), err.message);
      }
    },
    [t],
  );

  // Handle toggle status (optional, truyền từ tree)
  const handleToggleStatus = useCallback(
    async (category: CategoryTreeNode) => {
      try {
        const categoryId: number = Number(category.id);

        if (category.is_active) {
          await categoryService.deactivateCategory(categoryId!);
        } else {
          await categoryService.activateCategory(categoryId!);
        }
        setRefreshTrigger(prev => prev + 1);
      } catch (err: any) {
        Alert.alert(t('common.error', 'Lỗi'), err.message);
      }
    },
    [t],
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {/* Header với buttons */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
          {t('category.management', 'Quản lý Categories')}
        </Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: theme.primary}]}
            onPress={handleShowImportModal}>
            <Icon name="cloud-download" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {t('category.import', 'Import từ Google Sheet')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: theme.accent}]}
            onPress={handleCreateNew}>
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {t('category.create', 'Tạo mới')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách tree */}
      <CategoriesTree
        storeId={storeId}
        showActiveOnly={false}
        refreshTrigger={refreshTrigger}
        onCategoryEdit={handleEdit}
        onCategoryDelete={handleDelete}
        onCategoryToggleStatus={handleToggleStatus}
        title={t('category.list', 'Danh sách Categories')}
        maxHeight={isTablet ? 600 : 400}
        showIdColumn={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  header: {marginBottom: 16},
  headerTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 8},
  buttonsContainer: {flexDirection: 'row', justifyContent: 'space-between'},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {color: '#fff', fontWeight: '600'},
});

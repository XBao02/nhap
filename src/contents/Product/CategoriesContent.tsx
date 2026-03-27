import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  GoogleSheetParams,
  ProcessedData,
  googleSheetService,
} from '../../services';
import {Category, categoryService} from '../../services';
import {NavigationService} from '../../registries/NavigationService';
import {ImportModal} from './modals';
import Icon from '@react-native-vector-icons/material-icons';

// Props cho component
interface CategoriesContentProps {
  showHierarchy?: boolean;
  enableSearch?: boolean;
  onCategorySelect?: (category: Category) => void;
}

export const CategoriesContent: React.FC<CategoriesContentProps> = ({
  showHierarchy = true,
  enableSearch = true,
  onCategorySelect,
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | undefined | null>(
    null,
  );

  // Data states
  const [rawCategories, setRawCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import form data state
  const [importFormData, setImportFormData] = useState<GoogleSheetParams>({
    googleSheetLink:
      'https://docs.google.com/spreadsheets/d/1VPQgrDqbvVhxbjYp5Vv2Korvh2fYCubB/edit?gid=594575742#gid=594575742',
    sheets: 'categories',
    startFromRow: 3,
  });

  // Thêm state để trigger remount
  const [modalRefreshKey, setModalRefreshKey] = useState(0);

  const [importLoading, setImportLoading] = useState(false);

  // Load initial data (có thể từ local storage hoặc API khác)
  useEffect(() => {
    console.log('ImportFormData updated in parent:', importFormData);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Thay thế bằng logic load dữ liệu ban đầu của bạn
      // Ví dụ: load từ AsyncStorage, SQLite, hoặc API khác
      console.log('Loading initial categories data...');
      setRawCategories([]); // Placeholder
    } catch (err) {
      setError('Không thể tải dữ liệu ban đầu');
      console.error('Load initial data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show Import Modal using NavigationService
  const handleShowImportModal = () => {
    NavigationService.showModal(ImportModal, {
      title: 'Import Categories từ Google Sheet',
      importFormData,
      importLoading,
      onFormDataChange: (newFormData: GoogleSheetParams) => {
        console.log('Form data updated:', newFormData);
        setImportFormData(newFormData);
        setModalRefreshKey(prev => prev + 1); // Trigger remount
      },
      onImport: handleImportData,
      key: `import-modal-${modalRefreshKey}`, // Truyền key để remount
    });
  };

  // Import data from Excel/Google Sheets
  const handleImportData = async () => {
    console.log('handleImportData:', importFormData);

    if (!importFormData.googleSheetLink.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đường dẫn Google Sheet');
      return;
    }

    if (!importFormData.sheets.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên sheet');
      return;
    }

    if (importFormData.startFromRow < 1) {
      Alert.alert('Lỗi', 'Dòng bắt đầu phải lớn hơn 0');
      return;
    }

    setImportLoading(true);
    setError(null);

    try {
      const params: GoogleSheetParams = {
        googleSheetLink: importFormData.googleSheetLink.trim(),
        sheets: importFormData.sheets.trim(),
        startFromRow: importFormData.startFromRow,
      };

      console.log('Importing data with params:', params);
      const result: ProcessedData = await googleSheetService.getData(params);

      // Lấy dữ liệu từ sheet đầu tiên được chỉ định
      const firstSheetName = importFormData.sheets.split(',')[0].trim();
      const importedData = result[firstSheetName] || [];

      if (importedData && importedData.length > 0) {
        setRawCategories(importedData);

        // Đóng modal sau khi import thành công
        NavigationService.hideModal();

        Alert.alert(
          'Thành công',
          `Đã import ${importedData.length} danh mục từ GoogleSheet`,
          [{text: 'OK'}],
        );
      } else {
        Alert.alert(
          'Thông báo',
          'Không tìm thấy dữ liệu trong sheet được chỉ định',
        );
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Lỗi khi import dữ liệu');
      Alert.alert(
        'Lỗi Import',
        err.message || 'Không thể import dữ liệu từ GoogleSheet',
      );
    } finally {
      setImportLoading(false);
    }
  };

  // Import to local database
  const handleImportToDatabase = async () => {
    if (rawCategories.length === 0) {
      Alert.alert('Thông báo', 'Không có dữ liệu để import vào cơ sở dữ liệu');
      return;
    }

    Alert.alert(
      'Xác nhận Import',
      `Bạn có muốn import ${rawCategories.length} danh mục vào cơ sở dữ liệu không?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Import',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Thực hiện logic import vào SQLite/AsyncStorage
              console.log('Importing to local database:', rawCategories);

              // Placeholder - thay thế bằng logic thực tế
              // await new Promise(resolve => setTimeout(resolve, 2000));
              const storeId = 'POS1755159103808U1M8';
              // lấy store từ session của user hiện tại

              const importOptions: any = {
                updateIfExists: true, // Cập nhật nếu đã tồn tại ID
                skipDuplicates: true, // Bỏ qua các bản ghi trùng lặp
                validateHierarchy: true, // Kiểm tra tính hợp lệ của cấu trúc phân cấp
                allowInvalidParents: true, // Cho phép parent_id không tồn tại (sẽ set null)
              };

              const result = await categoryService.importCategories(
                storeId,
                rawCategories,
                importOptions,
              );

              /**
               * {
                    success: true,
                    totalRecords: 100,
                    successCount: 95,
                    failedCount: 3,
                    skippedCount: 2,
                    errors: [// chi tiết lỗi ],
                    warnings: [// cảnh báo ]
                    importedCategories: [// danh sách đã import]
                  }
               */
              // Xử lý kết quả
              if (result.success) {
                console.log(
                  `✅ Import thành công: ${result.successCount} categories`,
                );

                Alert.alert(
                  'Thành công',
                  `Đã import ${result.successCount} dữ liệu vào cơ sở dữ liệu thành công!`,
                  [{text: 'OK'}],
                );
              } else {
                console.log(`❌ Import thất bại:`);
                result.errors.forEach(error => {
                  console.log(`- Row ${error.index + 1}: ${error.error}`);
                });
                throw new Error('Import thất bại');
              }
            } catch (err) {
              console.error('Database import error:', err);
              Alert.alert('Lỗi', 'Không thể import vào cơ sở dữ liệu');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Refetch data
  const refetch = () => {
    loadInitialData();
  };

  // Chuyển đổi dữ liệu thô thành Category objects
  // Chuyển đổi dữ liệu thô thành Category objects với xử lý lỗi
  const categories: Category[] = useMemo(() => {
    // Kiểm tra dữ liệu đầu vào
    if (
      !rawCategories ||
      !Array.isArray(rawCategories) ||
      rawCategories.length === 0
    ) {
      // console.warn('Raw categories is empty or invalid');
      return [];
    }

    const validCategories: Category[] = [];

    rawCategories.forEach((item: any, index: number) => {
      try {
        // Kiểm tra item có tồn tại
        if (!item || typeof item !== 'object') {
          // console.warn(`Invalid category item at index ${index}:`, item);
          return;
        }

        // Helper function để parse số an toàn
        const safeParseInt = (value: any, defaultValue: number): number => {
          if (value === null || value === undefined || value === '') {
            return defaultValue;
          }
          const parsed = parseInt(String(value));
          return isNaN(parsed) ? defaultValue : parsed;
        };

        // Helper function để parse JSON an toàn
        const safeParseJSON = (value: any): any => {
          if (!value) return {};
          if (typeof value === 'object') return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (error) {
              console.warn(
                `Failed to parse JSON metadata for category at index ${index}:`,
                error,
              );
              return {};
            }
          }
          return {};
        };

        // Helper function để validate string
        const safeString = (value: any, defaultValue: string = ''): string => {
          return value && typeof value === 'string'
            ? value.trim()
            : defaultValue;
        };

        // Helper function để parse boolean an toàn
        const safeParseBoolean = (
          value: any,
          defaultValue: boolean = true,
        ): boolean => {
          if (value === undefined || value === null) return defaultValue;
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            return lowerValue === 'true' || lowerValue === '1';
          }
          if (typeof value === 'number') return value === 1;
          return defaultValue;
        };

        // Validate required fields
        const categoryId = safeParseInt(item.id, index + 1);
        const categoryName = safeString(item.name);

        // Nếu không có name và không thể tạo default name, skip item này
        if (!categoryName && !item.name) {
          console.warn(
            `Category at index ${index} has no valid name, using default`,
          );
        }

        // Validate date strings
        const validateDate = (dateStr: any): string => {
          if (!dateStr) return new Date().toISOString();
          if (typeof dateStr === 'string') {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? new Date().toISOString() : dateStr;
          }
          return new Date().toISOString();
        };

        // Validate color format (hex color)
        const validateColor = (color: any): string => {
          const defaultColor = '#007AFF';
          if (!color || typeof color !== 'string') return defaultColor;

          const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
          return hexColorRegex.test(color.trim()) ? color.trim() : defaultColor;
        };

        // Validate URL format
        const validateUrl = (url: any): string => {
          if (!url || typeof url !== 'string') return '';
          const trimmedUrl = url.trim();

          // Basic URL validation
          try {
            if (
              trimmedUrl &&
              (trimmedUrl.startsWith('http://') ||
                trimmedUrl.startsWith('https://') ||
                trimmedUrl.startsWith('/'))
            ) {
              return trimmedUrl;
            }
            return trimmedUrl; // Cho phép relative URLs
          } catch (error) {
            console.warn(
              `Invalid URL format for category at index ${index}: ${url}`,
            );
            return '';
          }
        };

        // Tạo category object với validation
        const category: Category = {
          id: categoryId,
          store_id: safeString(item.store_id),
          name: categoryName || `Category ${index + 1}`,
          description: safeString(item.description),
          parent_id: item.parent_id
            ? safeParseInt(item.parent_id, 0)
            : undefined,
          level: Math.max(1, safeParseInt(item.level, 1)), // Level tối thiểu là 1
          sort_order: Math.max(0, safeParseInt(item.sort_order, index)), // Sort order tối thiểu là 0
          image_url: validateUrl(item.image_url),
          icon: safeString(item.icon),
          color: validateColor(item.color),
          is_active: safeParseBoolean(item.is_active, true),
          metadata: safeParseJSON(item.metadata),
          created_at: validateDate(item.created_at),
          updated_at: validateDate(item.updated_at),
        };

        // Final validation - đảm bảo category object hợp lệ
        if (category.id && category.name) {
          validCategories.push(category);
        } else {
          console.warn(`Skipping invalid category at index ${index}:`, {
            id: category.id,
            name: category.name,
            originalItem: item,
          });
        }
      } catch (error) {
        console.error(`Error processing category at index ${index}:`, {
          error: error instanceof Error ? error.message : error,
          item: item,
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Continue processing other items instead of breaking the entire operation
      }
    });

    console.info(
      `Successfully processed ${validCategories.length} out of ${rawCategories.length} categories`,
    );
    return validCategories;
  }, [rawCategories]);

  // Lọc và sắp xếp categories
  const filteredCategories = useMemo(() => {
    let filtered = categories.filter(
      cat =>
        cat.is_active &&
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Lọc theo level nếu được chọn
    if (selectedLevel !== null) {
      filtered = filtered.filter(cat => cat.level === selectedLevel);
    }

    // Sắp xếp theo sort_order và tên
    return filtered.sort((a, b) => {
      if (a.sort_order && b.sort_order && a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories, searchQuery, selectedLevel]);

  // Tạo cấu trúc phân cấp
  const hierarchicalCategories = useMemo(() => {
    if (!showHierarchy) return filteredCategories;

    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // Tạo map cho việc lookup nhanh
    filteredCategories.forEach(cat => {
      categoryMap.set(cat.id, {...cat, children: []});
    });

    // Xây dựng cấu trúc cây
    filteredCategories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }, [filteredCategories, showHierarchy]);

  // Lấy danh sách levels có sẵn
  const availableLevels = useMemo(() => {
    const levels = [...new Set(categories.map(cat => cat.level))].sort();
    return levels;
  }, [categories]);

  // Handle category selection
  const handleCategoryPress = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      Alert.alert(
        'Danh mục được chọn',
        `Tên: ${category.name}\nMô tả: ${
          category.description || 'Không có mô tả'
        }`,
        [{text: 'OK'}],
      );
    }
  };

  // Helper function để render icon với thứ tự ưu tiên
  const renderCategoryIcon = (category: Category) => {
    const iconBackgroundColor = category.color
      ? category.color + '20'
      : '#007AFF20';
    const iconColor = category.color || '#007AFF';

    // Thứ tự ưu tiên: image_url > icon (material-icons) > text

    // 1. Ưu tiên image_url nếu có
    if (category.image_url && category.image_url.trim() !== '') {
      return (
        <View
          style={[styles.categoryIcon, {backgroundColor: iconBackgroundColor}]}>
          <Image
            source={{uri: category.image_url}}
            style={styles.categoryImage}
            defaultSource={require('../../assets/images/add_image.png')}
            onError={() => {
              console.warn(`Failed to load image: ${category.image_url}`);
            }}
          />
        </View>
      );
    }

    // 2. Sử dụng icon từ material-icons nếu có
    if (category.icon && category.icon.trim() !== '') {
      // Kiểm tra xem có phải là tên icon hợp lệ từ material-icons không
      const isValidIcon =
        typeof category.icon === 'string' && category.icon.length > 0;

      if (isValidIcon) {
        return (
          <View
            style={[
              styles.categoryIcon,
              {backgroundColor: iconBackgroundColor},
            ]}>
            <Icon // @ts-ignore
              name={category.icon}
              size={24}
              color={iconColor}
              onError={() => {
                console.warn(`Invalid material icon name: ${category.icon}`);
              }}
            />
          </View>
        );
      }
    }

    // 3. Fallback: sử dụng text (chữ cái đầu của tên)
    return (
      <View
        style={[styles.categoryIcon, {backgroundColor: iconBackgroundColor}]}>
        <Text style={[styles.categoryIconText, {color: iconColor}]}>
          {category.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  // Render category item
  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: Category & {children?: Category[]};
    index: number;
  }) => {
    const indentLevel =
      showHierarchy && item.level !== undefined && item.level !== null
        ? (item.level - 1) * 20
        : 0;

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.categoryItem,
            {
              marginLeft: indentLevel,
              borderLeftColor: item.color || '#007AFF',
            },
          ]}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}>
          {/* Icon với thứ tự ưu tiên: image_url > icon > text */}
          {renderCategoryIcon(item)}

          {/* Category Info */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.categoryDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryLevel}>Cấp {item.level}</Text>
              {item.children && item.children.length > 0 && (
                <Text style={styles.childrenCount}>
                  {item.children.length} danh mục con
                </Text>
              )}
            </View>
          </View>

          {/* Arrow indicator */}
          <View style={styles.arrowContainer}>
            <Icon name="chevron-right" size={20} color="#6c757d" />
          </View>
        </TouchableOpacity>

        {/* Render children if in hierarchy mode */}
        {showHierarchy && item.children && item.children.length > 0 && (
          <View>
            {item.children.map((child, childIndex) => (
              <View key={`child-${child.id}-${childIndex}`}>
                {renderCategoryItem({item: child, index: childIndex})}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render level filter
  const renderLevelFilter = () => (
    <View style={styles.levelFilter}>
      <TouchableOpacity
        style={[
          styles.levelButton,
          selectedLevel === null && styles.levelButtonActive,
        ]}
        onPress={() => setSelectedLevel(null)}>
        <Text
          style={[
            styles.levelButtonText,
            selectedLevel === null && styles.levelButtonTextActive,
          ]}>
          Tất cả
        </Text>
      </TouchableOpacity>
      {availableLevels.map(level => (
        <TouchableOpacity
          key={level}
          style={[
            styles.levelButton,
            selectedLevel === level && styles.levelButtonActive,
          ]}
          onPress={() => setSelectedLevel(level)}>
          <Text
            style={[
              styles.levelButtonText,
              selectedLevel === level && styles.levelButtonTextActive,
            ]}>
            Cấp {level}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render header component for FlatList
  const renderListHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh mục sản phẩm</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? 'Đang tải...' : `${filteredCategories.length} danh mục`}
        </Text>
      </View>

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Search Bar */}
      {enableSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Level Filter */}
      {!showHierarchy && availableLevels.length > 1 && renderLevelFilter()}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={styles.importButton}
        onPress={handleShowImportModal}
        disabled={loading || importLoading}>
        <Icon
          name="cloud-download"
          size={16}
          color="#fff"
          style={{marginRight: 8}}
        />
        <Text style={styles.importButtonText}>
          {importLoading ? 'Đang load...' : 'Load từ GoogleSheet'}
        </Text>
      </TouchableOpacity>

      {rawCategories.length > 0 && (
        <TouchableOpacity
          style={styles.saveToDatabaseButton}
          onPress={handleImportToDatabase}
          disabled={loading}>
          <Icon name="save" size={16} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.saveToDatabaseButtonText}>Import vào CSDL</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Handle error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon
          name="error"
          size={48}
          color="#dc3545"
          style={{marginBottom: 16}}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Icon
            name="refresh"
            size={16}
            color="#fff"
            style={{marginRight: 8}}
          />
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải danh mục...</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {renderListHeader()}
          {(showHierarchy ? hierarchicalCategories : filteredCategories).map(
            (item, index) => (
              <View key={`category-${item.id}`}>
                {renderCategoryItem({item, index})}
              </View>
            ),
          )}
          {(showHierarchy ? hierarchicalCategories : filteredCategories)
            .length === 0 && (
            <View style={styles.emptyContainer}>
              <Icon
                name="inventory"
                size={64}
                color="#adb5bd"
                style={{marginBottom: 16}}
              />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Không tìm thấy danh mục nào'
                  : 'Chưa có danh mục nào'}
              </Text>
              <Text style={styles.emptySubText}>
                Nhấn "Load từ GoogleSheet" để import dữ liệu
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    gap: 12,
  },
  importButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveToDatabaseButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveToDatabaseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
  },
  levelFilter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  levelButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  levelButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flexGrow: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  categoryIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLevel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 12,
  },
  childrenCount: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  arrow: {
    fontSize: 20,
    color: '#6c757d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
});

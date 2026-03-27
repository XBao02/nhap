import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import {DataTable} from '../../components/common';
import {usePhotoContentLogic} from './hooks/usePhotoContentLogic';
import {useTheme} from '../../styles/ThemeContext';
import {useLanguage} from '../../i18n';
import {
  isTablet,
  width as screenWidth,  
} from '../../utils';

export const PhotoContent: React.FC = () => {
  console.log(`[PhotoContent][render] Rendering PhotoContent component`);
  const {
    loading,
    refreshing,
    serviceInitialized,
    serviceError,
    tableHead,
    tableData,
    handleSelectFromLibrary,
    handleTakePhoto,
    handleShowUrlModal,
    handleClearAllImages,
    handleRowPress,
    initializeService,
    loadImagesFromDatabase,
    images,
  } = usePhotoContentLogic();
  const {theme} = useTheme();
  const {t} = useLanguage();

  if (serviceError) {
    console.log(`[PhotoContent][render] Rendering service error view`);
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: theme.background}]}>
        <View style={styles.errorContainer}>
          <Icon
            name="error-outline"
            size={64}
            color={theme.error || '#FF3B30'}
          />
          <Text style={[styles.errorTitle, {color: theme.error || '#FF3B30'}]}>
            Lỗi Dịch Vụ
          </Text>
          <Text style={[styles.errorMessage, {color: theme.textSecondary}]}>
            {serviceError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: theme.primary}]}
            onPress={initializeService}>
            <Text style={styles.retryButtonText}>Thử Lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!serviceInitialized) {
    console.log(`[PhotoContent][render] Rendering initializing view`);
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: theme.background}]}>
        <View style={styles.initializingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.initializingText, {color: theme.text}]}>
            Đang khởi tạo dịch vụ cơ sở dữ liệu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log(
    `[PhotoContent][render] Rendering main view, images count: ${images.length}, loading: ${loading}, refreshing: ${refreshing}`,
  );
  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.text}]}>Quản lý ảnh</Text>
          <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
            Tải ảnh từ thư viện, chụp ảnh mới hoặc lấy từ URL
          </Text>
          <View style={styles.serviceStatus}>
            <View style={[styles.statusDot, {backgroundColor: '#34C759'}]} />
            <Text
              style={[styles.serviceStatusText, {color: theme.textSecondary}]}>
              Dịch vụ hoạt động
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSelectFromLibrary}
            disabled={loading || !serviceInitialized}>
            <View style={styles.buttonContent}>
              <Icon name="photo-library" size={24} color="white" />
              <Text style={styles.buttonText}>Từ thư viện</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleTakePhoto}
            disabled={loading || !serviceInitialized}>
            <View style={styles.buttonContent}>
              <Icon name="camera-alt" size={24} color="white" />
              <Text style={styles.buttonText}>Chụp ảnh</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleShowUrlModal}
            disabled={loading || !serviceInitialized}>
            <View style={styles.buttonContent}>
              <Icon name="link" size={24} color="white" />
              <Text style={styles.buttonText}>Từ URL</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, {color: theme.textSecondary}]}>
              Đang xử lý ảnh...
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, {color: theme.text}]}>
            Đã lưu: {images.length} ảnh
          </Text>
          {images.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAllImages}
              style={styles.clearButton}
              disabled={loading || !serviceInitialized}>
              <View style={styles.buttonContent}>
                <Icon name="delete-sweep" size={20} color="white" />
                <Text style={styles.clearButtonText}>Xóa tất cả</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <DataTable
          title="Danh sách ảnh"
          tableHead={tableHead}
          tableData={tableData}
          onRowPress={handleRowPress}
          showEditHint={true}
          showScrollHint={true}
          maxHeight={isTablet ? 600 : 500}
          minHeight={200}
          showRowIndex={true}
          noDataText="Chưa có ảnh nào được lưu. Hãy chọn một trong các tùy chọn ở trên để bắt đầu."
          containerStyle={[
            styles.tableContainer,
            {backgroundColor: theme.surface},
          ]}
        />

        <View style={styles.refreshContainer}>
          <TouchableOpacity
            onPress={loadImagesFromDatabase}
            style={[styles.refreshButton, {backgroundColor: theme.primary}]}
            disabled={refreshing || !serviceInitialized}>
            <View style={styles.buttonContent}>
              {refreshing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon name="refresh" size={20} color="white" />
              )}
              <Text style={styles.refreshButtonText}>
                {refreshing ? 'Đang tải...' : 'Làm mới'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const SPACING = 16;
const BUTTON_HEIGHT = 48;
const BUTTON_WIDTH = (screenWidth - SPACING * 4) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: SPACING,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING * 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  serviceStatusText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING * 1.5,
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  initializingText: {
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tableContainer: {
    marginBottom: SPACING,
  },
  refreshContainer: {
    alignItems: 'center',
    marginTop: SPACING,
  },
  refreshButton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PhotoContent;

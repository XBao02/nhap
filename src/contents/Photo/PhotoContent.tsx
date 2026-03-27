import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import {
  photoService,
  ProcessedImageResult,
  ImageProcessingOptions,
} from '../../services';
import {
  isTablet,
  width as screenWidth,
  height as screenHeight,
} from '../../utils';
import { NavigationService } from '../../registries';
import { UrlInputModal, ImageViewModal } from './modals';

interface ProcessedImage extends ProcessedImageResult {
  id: string;
  createdAt: Date;
}

export const PhotoContent: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultOptions: ImageProcessingOptions = {
    maxWidth: Math.min(screenWidth * 2, 800),
    maxHeight: Math.min(screenHeight * 2, 1200),
    quality: 80,
    format: 'JPEG',
  };

  useEffect(() => {
    loadLocalImages();
  }, []);

  const loadLocalImages = async () => {
    try {
      const localPaths = await photoService.getLocalImages();
      const imageInfos: ProcessedImage[] = [];

      for (const path of localPaths) {
        const info = await photoService.getImageInfo(path);
        if (info.exists) {
          imageInfos.push({
            id: path.split('/').pop() || Date.now().toString(),
            localPath: path,
            width: 0,
            height: 0,
            size: info.size,
            createdAt: new Date(info.modificationTime),
          });
        }
      }

      setImages(
        imageInfos.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        ),
      );
    } catch (error) {
      console.error('Error loading local images:', error);
    }
  };

  const handleSelectFromLibrary = async () => {
    try {
      setLoading(true);
      const result = await photoService.uploadImage('library', defaultOptions);
      const newImage: ProcessedImage = {
        ...result,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setImages(prev => [newImage, ...prev]);
      Alert.alert('Thành công', 'Đã tải ảnh từ thư viện và xử lý thành công!');
    } catch (error: any) {
      if (error !== 'User cancelled image picker') {
        Alert.alert('Lỗi', `Không thể tải ảnh từ thư viện: ${error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setLoading(true);
      const result = await photoService.uploadImage('camera', defaultOptions);
      const newImage: ProcessedImage = {
        ...result,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setImages(prev => [newImage, ...prev]);
      Alert.alert('Thành công', 'Đã chụp ảnh và xử lý thành công!');
    } catch (error: any) {
      if (error !== 'User cancelled image picker') {
        Alert.alert('Lỗi', `Không thể chụp ảnh: ${error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowUrlModal = () => {
    NavigationService.showModal(UrlInputModal, {
      title: 'Nhập URL ảnh',
      initialUrl: 'https://mypos.ddns.net/myPos.png',
      onConfirm: handleLoadFromUrl,
      onCancel: () => {
        console.log('URL input cancelled');
      },
    });
  };

  const handleLoadFromUrl = async (url: string) => {
    try {
      setLoading(true);
      const result = await photoService.getImageFromUrl(
        url.trim(),
        defaultOptions,
      );
      const newImage: ProcessedImage = {
        ...result,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setImages(prev => [newImage, ...prev]);
      Alert.alert('Thành công', 'Đã tải ảnh từ URL và xử lý thành công!');
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể tải ảnh từ URL: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (image: ProcessedImage) => {
    try {
      await photoService.deleteLocalImage(image.localPath);
      setImages(prev => prev.filter(img => img.id !== image.id));
      Alert.alert('Thành công', 'Đã xóa ảnh thành công!');
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể xóa ảnh: ${error}`);
    }
  };

  const handleClearAllImages = async () => {
    Alert.alert(
      'Xác nhận xóa tất cả',
      'Bạn có chắc chắn muốn xóa tất cả ảnh đã lưu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await photoService.clearLocalImages();
              setImages([]);
              Alert.alert('Thành công', 'Đã xóa tất cả ảnh thành công!');
            } catch (error: any) {
              Alert.alert('Lỗi', `Không thể xóa ảnh: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleShowImageModal = (image: ProcessedImage) => {
    NavigationService.showModal(ImageViewModal, {
      image,
      onDelete: handleDeleteImage,
      onClose: () => {
        console.log('Image modal closed');
      },
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderImageItem = (image: ProcessedImage, index: number) => (
    <View key={image.id} style={styles.imageItem}>
      <TouchableOpacity
        onPress={() => handleShowImageModal(image)}
        style={styles.imageContainer}>
        <Image
          source={{ uri: `file://${image.localPath}` }}
          style={styles.thumbnail}
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageIndex}>#{index + 1}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.imageInfo}>
        <Text style={styles.imageSize}>{formatFileSize(image.size)}</Text>
        <Text style={styles.imageDimensions}>
          {image.width > 0 &&
            image.height > 0 &&
            `${image.width}x${image.height}`}
        </Text>
        <Text style={styles.imageDate}>
          {image.createdAt.toLocaleDateString('vi-VN')}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteImage(image)}
        style={styles.deleteButton}>
        <Icon name="delete" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Xử lý ảnh</Text>
          <Text style={styles.subtitle}>
            Tải ảnh từ thư viện, chụp ảnh mới hoặc lấy từ URL
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSelectFromLibrary}
            disabled={loading}>
            <View style={styles.buttonContent}>
              <Icon name="photo-library" size={24} color="white" />
              <Text style={styles.buttonText}>Từ thư viện</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleTakePhoto}
            disabled={loading}>
            <View style={styles.buttonContent}>
              <Icon name="camera-alt" size={24} color="white" />
              <Text style={styles.buttonText}>Chụp ảnh</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleShowUrlModal}
            disabled={loading}>
            <View style={styles.buttonContent}>
              <Icon name="link" size={24} color="white" />
              <Text style={styles.buttonText}>Từ URL</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Đang xử lý ảnh...</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Đã lưu: {images.length} ảnh</Text>
          {images.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAllImages}
              style={styles.clearButton}>
              <View style={styles.buttonContent}>
                <Icon name="delete-sweep" size={20} color="white" />
                <Text style={styles.clearButtonText}>Xóa tất cả</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imagesGrid}>
          {images.map((image, index) => renderImageItem(image, index))}
        </View>

        {images.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="photo-library" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Chưa có ảnh nào được lưu</Text>
            <Text style={styles.emptyStateSubtext}>
              Hãy chọn một trong các tùy chọn ở trên để bắt đầu
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const SPACING = 16;
const BUTTON_HEIGHT = 48;
const BUTTON_WIDTH = (screenWidth - SPACING * 4) / 3; // Chia đều cho 3 button

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: SPACING,
    paddingBottom: 100, // Đảm bảo đủ không gian cuộn
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING * 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
    shadowOffset: { width: 0, height: 2 },
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
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  statsText: {
    fontSize: 16,
    color: '#333',
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
  imagesGrid: {
    marginBottom: SPACING,
  },
  imageItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: SPACING,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  imageIndex: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageInfo: {
    flex: 1,
  },
  imageSize: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imageDimensions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  imageDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PhotoContent;

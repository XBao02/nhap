import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../../styles/ThemeContext';
import { useLanguage } from '../../../i18n';
import { NavigationService } from '../../../registries';
import { isTablet, width as screenWidth, height as screenHeight } from '../../../utils';

interface ProcessedImage {
  id: string;
  localPath: string;
  width: number;
  height: number;
  size: number;
  createdAt: Date;
}

interface ImageViewModalProps {
  image: ProcessedImage;
  onDelete?: (image: ProcessedImage) => void;
  onClose?: () => void;
}

export const ImageViewModal: React.FC<ImageViewModalProps> = ({
  image,
  onDelete,
  onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isZoomed, setIsZoomed] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleClose = () => {
    onClose?.();
    NavigationService.hideModal();
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            onDelete(image);
            handleClose();
          },
        },
      ]
    );
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  const imageStyle = isZoomed
    ? { width: screenWidth * 2, height: screenHeight * 2 }
    : { width: '100%', height: '100%' };

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleInfo} style={styles.controlButton}>
            <Icon
              name={showInfo ? 'info' : 'info-outline'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleZoom} style={styles.controlButton}>
            <Icon
              name={isZoomed ? 'zoom-out' : 'zoom-in'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.controlButton}>
              <Icon name="delete" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Container */}
      <View style={styles.imageContainer}>
        {isZoomed ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={true}
            bouncesZoom={true}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            <TouchableOpacity onPress={toggleZoom} activeOpacity={1}>
              <Image
                source={{ uri: `file://${image.localPath}` }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <TouchableOpacity onPress={toggleZoom} style={styles.imageWrapper} activeOpacity={1}>
            <Image
              source={{ uri: `file://${image.localPath}` }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Image Info */}
      {showInfo && (
        <View style={[styles.infoContainer, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
          <Text style={styles.infoTitle}>Thông tin ảnh</Text>

          <View style={styles.infoRow}>
            <Icon name="photo-size-select-actual" size={16} color="white" />
            <Text style={styles.infoText}>
              Kích thước: {formatFileSize(image.size)}
            </Text>
          </View>

          {image.width > 0 && image.height > 0 && (
            <View style={styles.infoRow}>
              <Icon name="aspect-ratio" size={16} color="white" />
              <Text style={styles.infoText}>
                Độ phân giải: {image.width} × {image.height} px
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="schedule" size={16} color="white" />
            <Text style={styles.infoText}>
              Thời gian: {image.createdAt.toLocaleString('vi-VN')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="fingerprint" size={16} color="white" />
            <Text style={styles.infoText}>
              ID: {image.id}
            </Text>
          </View>
        </View>
      )}

      {/* Usage Hints */}
      {!isZoomed && (
        <View style={styles.hintsContainer}>
          <Text style={styles.hintText}>
            Chạm để phóng to • Vuốt để cuộn khi phóng to
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: isTablet ? 60 : 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    // backdropFilter: 'blur(10px)',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isTablet ? 120 : 100,
    marginBottom: isTablet ? 200 : 180,
  },
  imageWrapper: {
    width: '90%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxWidth: screenWidth * 0.9,
    maxHeight: screenHeight * 0.7,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: isTablet ? 200 : 160,
  },
  infoTitle: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    color: 'white',
    fontSize: isTablet ? 14 : 12,
    flex: 1,
    opacity: 0.9,
  },
  hintsContainer: {
    position: 'absolute',
    bottom: isTablet ? 40 : 30,
    left: 20,
    right: 20,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: isTablet ? 14 : 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ImageViewModal;
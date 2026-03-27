import { useState, useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import {
  photoService,
  ProcessedImageResult,
  ImageProcessingOptions,
  ServiceManager,
  ImageService,
  Image,
} from '../../../services';
import { width as screenWidth, height as screenHeight, generateUID } from '../../../utils';
import { NavigationService } from '../../../registries';
import { UrlInputModal, ImageViewModal } from '../modals';

// Mở rộng interface Image để tương thích với ProcessedImage
interface ExtendedImage extends Image {
  width?: number;
  height?: number;
  localPath?: string;
}

const DEFAULT_STORE_ID = 'default_store';
const DEFAULT_FOLDER_ID = 1;

const defaultOptions: ImageProcessingOptions = {
  maxWidth: Math.min(screenWidth * 2, 800),
  maxHeight: Math.min(screenHeight * 2, 1200),
  quality: 80,
  format: 'JPEG',
};

export const usePhotoContentLogic = () => {
  const [images, setImages] = useState<ExtendedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const serviceManagerRef = useRef<ServiceManager | null>(null);
  const imageServiceRef = useRef<ImageService | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    console.log(`[usePhotoContentLogic][useEffect] Mounting hook, setting mountedRef to true`);
    mountedRef.current = true;
    initializeService();

    return () => {
      console.log(`[usePhotoContentLogic][useEffect] Unmounting hook, setting mountedRef to false and cleaning up service`);
      mountedRef.current = false;
      cleanupService();
    };
  }, []);

  const initializeService = async () => {
    console.log(`[usePhotoContentLogic][initializeService] Initializing service`);
    try {
      setLoading(true);
      setServiceError(null);

      const serviceManager = ServiceManager.getInstance();
      serviceManagerRef.current = serviceManager;
      console.log(`[usePhotoContentLogic][initializeService] ServiceManager instance obtained`);

      if (!serviceManager.hasSchema('media')) {
        console.log(`[usePhotoContentLogic][initializeService] Registering media schema`);
        serviceManager.registerSchema({
          schemaName: 'media',
          tables: [
            {
              tableName: 'images',
              primaryKeyFields: ['id'],
              autoInit: true,
              serviceClass: ImageService,
            },
          ],
          defaultPrimaryKeyFields: ['id'],
          defaultAutoInit: true,
          defaultServiceClass: ImageService,
        });
      }

      const imageService = (await serviceManager.getService('media', 'images')) as ImageService;
      imageServiceRef.current = imageService;
      console.log(`[usePhotoContentLogic][initializeService] ImageService obtained:`, imageService);

      // Kiểm tra trạng thái service và khởi tạo nếu cần
      const serviceStatus = imageService.getStatus();
      console.log(`[usePhotoContentLogic][initializeService] Service status:`, serviceStatus);

      if (!serviceStatus.isInitialized) {
        console.log(`[usePhotoContentLogic][initializeService] Initializing images service in media schema`);
        await serviceManager.initService('media', 'images');
        console.log(`[usePhotoContentLogic][initializeService] Service initialization completed`);
      }

      if (mountedRef.current) {
        setServiceInitialized(true);
        console.log(`[usePhotoContentLogic][initializeService] Service ready, loading images`);
        await loadImagesFromDatabase();
      }
    } catch (error) {
      console.error(`[usePhotoContentLogic][initializeService] Error initializing service:`, (error as Error).stack);
      if (mountedRef.current) {
        setServiceError(`Không thể khởi tạo dịch vụ cơ sở dữ liệu: ${error}`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      console.log(`[usePhotoContentLogic][initializeService] Service initialization completed`);
    }
  };

  const cleanupService = async () => {
    console.log(`[usePhotoContentLogic][cleanupService] Cleaning up service`);
    try {
      if (serviceManagerRef.current && imageServiceRef.current) {
        const serviceStatus = serviceManagerRef.current.getStatus();
        const mediaSchema = serviceStatus.schemas.find(s => s.schemaName === 'media');

        if (mediaSchema && mediaSchema.activeTables === 1) {
          console.log(`[usePhotoContentLogic][cleanupService] Closing images service in media schema`);
          await serviceManagerRef.current.closeService('media', 'images');
          console.log(`[usePhotoContentLogic][cleanupService] ImageService closed successfully`);
        }
      }
    } catch (error) {
      console.error(`[usePhotoContentLogic][cleanupService] Error cleaning up service:`, (error as Error).stack);
    }
  };

  const loadImagesFromDatabase = async () => {
    console.log(`[usePhotoContentLogic][loadImagesFromDatabase] Loading images from database`);
    
    // Chỉ kiểm tra imageServiceRef, không kiểm tra serviceInitialized để tránh circular dependency
    if (!imageServiceRef.current) {
      console.warn(`[usePhotoContentLogic][loadImagesFromDatabase] ImageService not available`);
      return;
    }

    // Kiểm tra lại trạng thái service trước khi sử dụng
    const serviceStatus = imageServiceRef.current.getStatus();
    if (!serviceStatus.isInitialized) {
      console.warn(`[usePhotoContentLogic][loadImagesFromDatabase] ImageService not properly initialized`);
      return;
    }

    try {
      setRefreshing(true);
      const dbImages = await imageServiceRef.current.findByStoreId(DEFAULT_STORE_ID);
      console.log(`[usePhotoContentLogic][loadImagesFromDatabase] Retrieved ${dbImages.length} images from database`);

      const validImages: ExtendedImage[] = [];
      for (const dbImage of dbImages) {
        try {
          console.log(`[usePhotoContentLogic][loadImagesFromDatabase] Checking image: ${dbImage.name}`);
          const info = await photoService.getImageInfo(dbImage.path);
          if (info.exists) {
            validImages.push({
              ...dbImage,
              localPath: dbImage.path,
              width: 0,
              height: 0,
            });
          } else {
            if (dbImage.id) {
              console.log(`[usePhotoContentLogic][loadImagesFromDatabase] Deleting non-existent image record: ${dbImage.name}`);
              await imageServiceRef.current.delete(dbImage.id);
            }
          }
        } catch (error) {
          console.warn(`[usePhotoContentLogic][loadImagesFromDatabase] Error checking image ${dbImage.name}:`, (error as Error).stack);
        }
      }

      validImages.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
      console.log(`[usePhotoContentLogic][loadImagesFromDatabase] Sorted ${validImages.length} valid images`);

      if (mountedRef.current) {
        setImages(validImages);
      }
    } catch (error) {
      console.error(`[usePhotoContentLogic][loadImagesFromDatabase] Error loading images from database:`, (error as Error).stack);
      if (mountedRef.current) {
        Alert.alert('Lỗi', 'Không thể tải danh sách ảnh từ cơ sở dữ liệu');
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
      console.log(`[usePhotoContentLogic][loadImagesFromDatabase] Load images completed`);
    }
  };

  const saveImageToDatabase = async (processedResult: ProcessedImageResult): Promise<ExtendedImage> => {
    console.log(`[usePhotoContentLogic][saveImageToDatabase] Saving image to database`);
    if (!imageServiceRef.current) {
      console.error(`[usePhotoContentLogic][saveImageToDatabase] ImageService not available`);
      throw new Error('ImageService không khả dụng');
    }

    try {
      const imageName = `IMG_${Date.now()}.${defaultOptions.format?.toLowerCase() || 'jpg'}`;
      console.log(`[usePhotoContentLogic][saveImageToDatabase] Generated image name: ${imageName}`);

      const imageData: Image = {
        store_id: DEFAULT_STORE_ID,
        folder_id: DEFAULT_FOLDER_ID,
        name: imageName,
        path: processedResult.localPath,
        size: processedResult.size,
        mime_type: `image/${defaultOptions.format?.toLowerCase() || 'jpeg'}`,
      };
      console.log(`[usePhotoContentLogic][saveImageToDatabase] Image data prepared:`, imageData);

      const savedImage = await imageServiceRef.current.create(imageData);
      console.log(`[usePhotoContentLogic][saveImageToDatabase] Image saved to database:`, savedImage);

      return {
        ...savedImage,
        localPath: savedImage.path,
        width: processedResult.width,
        height: processedResult.height,
      };
    } catch (error) {
      console.error(`[usePhotoContentLogic][saveImageToDatabase] Error saving image to database:`, (error as Error).stack);
      throw new Error('Không thể lưu thông tin ảnh vào cơ sở dữ liệu');
    }
  };

  const checkServiceReady = (): boolean => {
    console.log(`[usePhotoContentLogic][checkServiceReady] Checking if service is ready`);
    
    if (!imageServiceRef.current) {
      console.log(`[usePhotoContentLogic][checkServiceReady] ImageService not available`);
      Alert.alert('Lỗi', 'Dịch vụ cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.');
      return false;
    }

    const serviceStatus = imageServiceRef.current.getStatus();
    if (!serviceStatus.isInitialized) {
      console.log(`[usePhotoContentLogic][checkServiceReady] ImageService not initialized`);
      Alert.alert('Lỗi', 'Dịch vụ cơ sở dữ liệu chưa được khởi tạo. Vui lòng thử lại sau.');
      return false;
    }

    console.log(`[usePhotoContentLogic][checkServiceReady] Service is ready`);
    return true;
  };

  const handleSelectFromLibrary = async () => {
    console.log(`[usePhotoContentLogic][handleSelectFromLibrary] Handling select from library`);
    if (!checkServiceReady()) return;

    try {
      setLoading(true);
      const result = await photoService.uploadImage('library', defaultOptions);
      console.log(`[usePhotoContentLogic][handleSelectFromLibrary] Image uploaded from library:`, result);
      const savedImage = await saveImageToDatabase(result);

      if (mountedRef.current) {
        setImages(prev => [savedImage, ...prev]);
        Alert.alert('Thành công', 'Đã tải ảnh từ thư viện và lưu thành công!');
      }
    } catch (error: any) {
      console.error(`[usePhotoContentLogic][handleSelectFromLibrary] Error selecting from library:`, (error as Error).stack);
      if (error !== 'User cancelled image picker' && mountedRef.current) {
        Alert.alert('Lỗi', `Không thể tải ảnh từ thư viện: ${error}`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      console.log(`[usePhotoContentLogic][handleSelectFromLibrary] Select from library completed`);
    }
  };

  const handleTakePhoto = async () => {
    console.log(`[usePhotoContentLogic][handleTakePhoto] Handling take photo`);
    if (!checkServiceReady()) return;

    try {
      setLoading(true);
      const result = await photoService.uploadImage('camera', defaultOptions);
      console.log(`[usePhotoContentLogic][handleTakePhoto] Photo taken:`, result);
      const savedImage = await saveImageToDatabase(result);

      if (mountedRef.current) {
        setImages(prev => [savedImage, ...prev]);
        Alert.alert('Thành công', 'Đã chụp ảnh và lưu thành công!');
      }
    } catch (error: any) {
      console.error(`[usePhotoContentLogic][handleTakePhoto] Error taking photo:`, (error as Error).stack);
      if (error !== 'User cancelled image picker' && mountedRef.current) {
        Alert.alert('Lỗi', `Không thể chụp ảnh: ${error}`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      console.log(`[usePhotoContentLogic][handleTakePhoto] Take photo completed`);
    }
  };

  const handleShowUrlModal = () => {
    console.log(`[usePhotoContentLogic][handleShowUrlModal] Showing URL modal`);
    if (!checkServiceReady()) return;

    NavigationService.showModal(UrlInputModal, {
      title: 'Nhập URL ảnh',
      initialUrl: 'https://mypos.ddns.net/myPos.png',
      onConfirm: handleLoadFromUrl,
      onCancel: () => {
        console.log(`[usePhotoContentLogic][handleShowUrlModal] URL input cancelled`);
      },
    });
    console.log(`[usePhotoContentLogic][handleShowUrlModal] URL modal shown`);
  };

  const handleLoadFromUrl = async (url: string) => {
    console.log(`[usePhotoContentLogic][handleLoadFromUrl] Loading image from URL: ${url}`);
    if (!checkServiceReady()) return;

    try {
      setLoading(true);
      const result = await photoService.getImageFromUrl(url.trim(), defaultOptions);
      console.log(`[usePhotoContentLogic][handleLoadFromUrl] Image loaded from URL:`, result);
      const savedImage = await saveImageToDatabase(result);

      if (mountedRef.current) {
        setImages(prev => [savedImage, ...prev]);
        Alert.alert('Thành công', 'Đã tải ảnh từ URL và lưu thành công!');
      }
    } catch (error: any) {
      console.error(`[usePhotoContentLogic][handleLoadFromUrl] Error loading from URL:`, (error as Error).stack);
      if (mountedRef.current) {
        Alert.alert('Lỗi', `Không thể tải ảnh từ URL: ${error}`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      console.log(`[usePhotoContentLogic][handleLoadFromUrl] Load from URL completed`);
    }
  };

  const handleDeleteImage = async (image: ExtendedImage) => {
    console.log(`[usePhotoContentLogic][handleDeleteImage] Deleting image: ${image.name || image.id}`);
    if (!checkServiceReady()) return;

    try {
      if (image.localPath || image.path) {
        console.log(`[usePhotoContentLogic][handleDeleteImage] Deleting local image file: ${image.localPath || image.path}`);
        await photoService.deleteLocalImage(image.localPath || image.path);
      }

      if (image.id && imageServiceRef.current) {
        console.log(`[usePhotoContentLogic][handleDeleteImage] Deleting image record from database: ${image.id}`);
        await imageServiceRef.current.delete(image.id);
      }

      if (mountedRef.current) {
        setImages(prev => prev.filter(img => img.id !== image.id));
        Alert.alert('Thành công', 'Đã xóa ảnh thành công!');
      }
    } catch (error: any) {
      console.error(`[usePhotoContentLogic][handleDeleteImage] Error deleting image:`, (error as Error).stack);
      if (mountedRef.current) {
        Alert.alert('Lỗi', `Không thể xóa ảnh: ${error}`);
      }
    }
    console.log(`[usePhotoContentLogic][handleDeleteImage] Delete image completed`);
  };

  const handleClearAllImages = async () => {
    console.log(`[usePhotoContentLogic][handleClearAllImages] Clearing all images`);
    if (!checkServiceReady()) return;

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

              for (const image of images) {
                try {
                  if (image.localPath || image.path) {
                    console.log(`[usePhotoContentLogic][handleClearAllImages] Deleting local image file: ${image.localPath || image.path}`);
                    await photoService.deleteLocalImage(image.localPath || image.path);
                  }
                  if (image.id && imageServiceRef.current) {
                    console.log(`[usePhotoContentLogic][handleClearAllImages] Deleting image record from database: ${image.id}`);
                    await imageServiceRef.current.delete(image.id);
                  }
                } catch (error) {
                  console.warn(`[usePhotoContentLogic][handleClearAllImages] Error deleting image ${image.name}:`, (error as Error).stack);
                }
              }

              if (mountedRef.current) {
                setImages([]);
                Alert.alert('Thành công', 'Đã xóa tất cả ảnh thành công!');
              }
            } catch (error: any) {
              console.error(`[usePhotoContentLogic][handleClearAllImages] Error clearing all images:`, (error as Error).stack);
              if (mountedRef.current) {
                Alert.alert('Lỗi', `Không thể xóa ảnh: ${error}`);
              }
            } finally {
              if (mountedRef.current) {
                setLoading(false);
              }
              console.log(`[usePhotoContentLogic][handleClearAllImages] Clear all images completed`);
            }
          },
        },
      ],
    );
  };

  const handleShowImageModal = (image: ExtendedImage) => {
    console.log(`[usePhotoContentLogic][handleShowImageModal] Showing image modal for: ${image.name || image.id}`);
    const processedImage = {
      id: image.id?.toString() || generateUID(),
      localPath: image.localPath || image.path,
      width: image.width || 0,
      height: image.height || 0,
      size: image.size || 0,
      createdAt: new Date(image.created_at || Date.now()),
    };

    NavigationService.showModal(ImageViewModal, {
      image: processedImage,
      onDelete: () => handleDeleteImage(image),
      onClose: () => {
        console.log(`[usePhotoContentLogic][handleShowImageModal] Image modal closed`);
      },
    });
    console.log(`[usePhotoContentLogic][handleShowImageModal] Image modal shown`);
  };

  const formatFileSize = (bytes: number): string => {
    console.log(`[usePhotoContentLogic][formatFileSize] Formatting file size: ${bytes} bytes`);
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    console.log(`[usePhotoContentLogic][formatFileSize] Formatted size: ${formatted}`);
    return formatted;
  };

  const tableHead = useMemo(() => {
    console.log(`[usePhotoContentLogic][useMemo] Computing table head`);
    return ['Tên', 'Kích thước', 'Loại', 'Ngày tạo'];
  }, []);

  const tableData = useMemo(() => {
    console.log(`[usePhotoContentLogic][useMemo] Computing table data, images count: ${images.length}`);
    return images.map((image, index) => [
      image.name || `Ảnh ${index + 1}`,
      formatFileSize(image.size || 0),
      image.mime_type || 'image/jpeg',
      new Date(image.created_at || Date.now()).toLocaleDateString('vi-VN'),
    ]);
  }, [images]);

  const handleRowPress = (rowData: any[], rowIndex: number) => {
    console.log(`[usePhotoContentLogic][handleRowPress] Handling row press at index: ${rowIndex}`);
    const selectedImage = images[rowIndex];
    if (selectedImage) {
      handleShowImageModal(selectedImage);
    }
  };

  return {
    images,
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
  };
};
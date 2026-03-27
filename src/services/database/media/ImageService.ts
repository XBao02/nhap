import { BaseService } from '../../../database';
import { generateUID } from '../../../utils';

// Định nghĩa interface cho Image
export interface Image {
  id?: number;
  store_id: string;
  folder_id: number;
  name: string;
  path: string;
  size?: number;
  mime_type?: string;
  created_at?: string;
  updated_at?: string;
}

// Safe Image interface không chứa thông tin nhạy cảm
export interface SafeImage extends Image {}

export class ImageService extends BaseService {
  constructor() {
    super('media', 'images');
  }

  /**
   * Xác thực dữ liệu cho Image
   * @param data - Dữ liệu cần xác thực
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.folder_id && typeof data.folder_id !== 'number') {
      throw new Error('Folder ID is required and must be a number');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Name is required and must be a string');
    }

    if (data.path && typeof data.path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    if (data.name && data.name.length > 255) {
      throw new Error('Image name must not exceed 255 characters');
    }

    if (data.path && data.path.length > 512) {
      throw new Error('Image path must not exceed 512 characters');
    }

    if (data.size && (typeof data.size !== 'number' || data.size < 0)) {
      throw new Error('Size must be a non-negative number');
    }

    if (
      data.mime_type &&
      typeof data.mime_type === 'string' &&
      data.mime_type.length > 50
    ) {
      throw new Error('MIME type must not exceed 50 characters');
    }

    if (
      data.mime_type &&
      !/^image\/(jpeg|png|gif|bmp|webp)$/.test(data.mime_type)
    ) {
      throw new Error('Invalid MIME type. Must be image/jpeg, image/png, image/gif, image/bmp, or image/webp');
    }
  }

  // Image-specific methods
  async findByStoreId(storeId: string): Promise<Image[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findByFolderId(folderId: number): Promise<Image[]> {
    return await this.findAll({ folder_id: folderId });
  }

  async findByName(name: string): Promise<Image | null> {
    const images = await this.findAll({ name });
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Tạo image mới
   * @param data - Dữ liệu image
   * @returns Promise<Image> - Image đã được tạo
   */
  async create(data: Image): Promise<Image> {
    const imageData = {
      ...data,
      store_id: data.store_id,
      folder_id: data.folder_id,
      name: data.name,
      path: data.path,
      size: data.size || 0,
      mime_type: data.mime_type || 'image/jpeg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await super.create(imageData);
  }

  /**
   * Cập nhật image
   * @param id - ID của image
   * @param data - Dữ liệu cần cập nhật
   * @returns Promise<Image> - Image đã được cập nhật
   */
  async update(id: number, data: Partial<Image>): Promise<Image> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }

  /**
   * Di chuyển image sang folder mới
   * @param id - ID của image
   * @param newFolderId - ID của folder mới
   * @returns Promise<Image>
   */
  async moveImage(id: number, newFolderId: number): Promise<Image> {
    const folderService = await import('./FolderService').then(m => m.folderService);
    if (!(await folderService.folderExists(newFolderId))) {
      throw new Error('Destination folder does not exist');
    }

    return await this.update(id, { folder_id: newFolderId });
  }

  /**
   * Kiểm tra xem image có tồn tại không
   * @param id - ID của image
   * @returns Promise<boolean>
   */
  async imageExists(id: number): Promise<boolean> {
    const image = await this.findById(id);
    return !!image;
  }

  /**
   * Kiểm tra xem tên image đã tồn tại trong folder chưa
   * @param folderId - ID của folder
   * @param name - Tên image
   * @returns Promise<boolean>
   */
  async imageNameExistsInFolder(folderId: number, name: string): Promise<boolean> {
    const images = await this.findAll({ folder_id: folderId, name });
    return images.length > 0;
  }
}

// Export singleton instance
export const imageService = new ImageService();
export default imageService;
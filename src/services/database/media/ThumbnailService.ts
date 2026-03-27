import { BaseService } from '../../../database';
// Định nghĩa interface cho Thumbnail
export interface Thumbnail {
  id?: number;
  store_id: string;
  image_id: number;
  size: 'small' | 'medium' | 'large';
  path: string;
  created_at?: string;
}

// Safe Thumbnail interface không chứa thông tin nhạy cảm
export interface SafeThumbnail extends Thumbnail {}

export class ThumbnailService extends BaseService {
  constructor() {
    super('media', 'thumbnails');
  }

  /**
   * Xác thực dữ liệu cho Thumbnail
   * @param data - Dữ liệu cần xác thực
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.image_id && typeof data.image_id !== 'number') {
      throw new Error('Image ID is required and must be a number');
    }

    if (data.size && !['small', 'medium', 'large'].includes(data.size)) {
      throw new Error('Size must be one of: small, medium, large');
    }

    if (data.path && typeof data.path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    if (data.path && data.path.length > 512) {
      throw new Error('Thumbnail path must not exceed 512 characters');
    }
  }

  // Thumbnail-specific methods
  async findByStoreId(storeId: string): Promise<Thumbnail[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findByImageId(imageId?: number | null): Promise<Thumbnail[]> {
    if (!imageId) return [];
    return await this.findAll({ image_id: imageId });
  }

  async findBySize(imageId: number, size: 'small' | 'medium' | 'large'): Promise<Thumbnail | null> {
    const thumbnails = await this.findAll({ image_id: imageId, size });
    return thumbnails.length > 0 ? thumbnails[0] : null;
  }

  /**
   * Tạo thumbnail mới
   * @param data - Dữ liệu thumbnail
   * @returns Promise<Thumbnail> - Thumbnail đã được tạo
   */
  async create(data: Thumbnail): Promise<Thumbnail> {
    const thumbnailData = {
      ...data,
      store_id: data.store_id,
      image_id: data.image_id,
      size: data.size,
      path: data.path,
      created_at: new Date().toISOString(),
    };

    return await super.create(thumbnailData);
  }

  /**
   * Cập nhật thumbnail
   * @param id - ID của thumbnail
   * @param data - Dữ liệu cần cập nhật
   * @returns Promise<Thumbnail> - Thumbnail đã được cập nhật
   */
  async update(id: number, data: Partial<Thumbnail>): Promise<Thumbnail> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }

  /**
   * Kiểm tra xem thumbnail có tồn tại không
   * @param id - ID của thumbnail
   * @returns Promise<boolean>
   */
  async thumbnailExists(id: number): Promise<boolean> {
    const thumbnail = await this.findById(id);
    return !!thumbnail;
  }

  /**
   * Kiểm tra xem thumbnail cho kích thước cụ thể của image đã tồn tại chưa
   * @param imageId - ID của image
   * @param size - Kích thước thumbnail
   * @returns Promise<boolean>
   */
  async thumbnailExistsForImage(imageId: number, size: 'small' | 'medium' | 'large'): Promise<boolean> {
    const thumbnail = await this.findBySize(imageId, size);
    return !!thumbnail;
  }

  /**
   * Xóa tất cả thumbnail của một image
   * @param imageId - ID của image
   * @returns Promise<void>
   */
  async deleteByImageId(imageId: number): Promise<void> {
    const thumbnails = await this.findByImageId(imageId);
    for (const thumbnail of thumbnails) {
      await super.delete(thumbnail.id!);
    }
  }
}

// Export singleton instance
export const thumbnailService = new ThumbnailService();
export default thumbnailService;
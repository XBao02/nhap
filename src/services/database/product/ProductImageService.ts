// ProductImageService.ts
import { BaseService } from '../../../database';
export interface ProductImage {
  id?: number;
  product_id: number;
  store_id: string;
  url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export class ProductImageService extends BaseService {
  constructor() {
    super('product', 'product_images');
  }

  /**
   * Specific validation for ProductImage
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng product_images nếu truyền vào
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.product_id && typeof data.product_id !== 'number') {
      throw new Error('Product ID is required and must be a number');
    }

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.url && typeof data.url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (data.url && !this.isValidUrl(data.url)) {
      throw new Error('URL must be a valid URL format');
    }

    if (data.sort_order && typeof data.sort_order !== 'number') {
      throw new Error('Sort order must be a number');
    }
  }

  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ProductImage-specific methods
  async findByProductId(productId: number): Promise<ProductImage[]> {
    return await this.findAll({ product_id: productId });
  }

  async findByStoreId(storeId: string): Promise<ProductImage[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findPrimaryImage(productId: number): Promise<ProductImage | null> {
    const images = await this.findAll({ 
      product_id: productId, 
      is_primary: true 
    });
    return images.length > 0 ? images[0] : null;
  }

  async findSecondaryImages(productId: number): Promise<ProductImage[]> {
    return await this.findAll({ 
      product_id: productId, 
      is_primary: false 
    });
  }

  // Get images sorted by sort_order
  async findImagesSorted(productId: number): Promise<ProductImage[]> {
    const images = await this.findByProductId(productId);
    return images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  // Set primary image (ensure only one primary image per product)
  async setPrimaryImage(id: number): Promise<ProductImage | null> {
    const image = await this.findById(id);
    if (!image) return null;

    return await this.executeTransaction(async () => {
      // First, set all images for this product as non-primary
      const allImages = await this.findByProductId(image.product_id);
      for (const img of allImages) {
        if (img.is_primary) {
          await this.update(img.id!, { is_primary: false });
        }
      }

      // Then set the specified image as primary
      return await this.update(id, { is_primary: true });
    });
  }

  // Remove primary status (no primary image)
  async removePrimaryStatus(productId: number): Promise<boolean> {
    const primaryImage = await this.findPrimaryImage(productId);
    if (primaryImage) {
      await this.update(primaryImage.id!, { is_primary: false });
      return true;
    }
    return false;
  }

  // Update sort order
  async updateSortOrder(id: number, sortOrder: number): Promise<ProductImage | null> {
    return await this.update(id, { sort_order: sortOrder });
  }

  // Reorder images
  async reorderImages(imageUpdates: { id: number; sort_order: number }[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const update of imageUpdates) {
        await this.updateSortOrder(update.id, update.sort_order);
      }
      return true;
    });
  }

  // Update alt text
  async updateAltText(id: number, altText: string): Promise<ProductImage | null> {
    return await this.update(id, { alt_text: altText });
  }

  // Replace image URL
  async updateImageUrl(id: number, newUrl: string): Promise<ProductImage | null> {
    if (!this.isValidUrl(newUrl)) {
      throw new Error('Invalid URL format');
    }
    return await this.update(id, { url: newUrl });
  }

  // Get image statistics for a product
  async getImageStatistics(productId: number): Promise<any> {
    const images = await this.findByProductId(productId);
    const primaryImage = images.find(img => img.is_primary);
    
    return {
      total: images.length,
      hasPrimary: !!primaryImage,
      primaryImageId: primaryImage?.id || null,
      secondaryCount: images.filter(img => !img.is_primary).length
    };
  }

  // Check if product has images
  async hasImages(productId: number): Promise<boolean> {
    const images = await this.findByProductId(productId);
    return images.length > 0;
  }

  // Get first image (primary or first by sort_order)
  async getFirstImage(productId: number): Promise<ProductImage | null> {
    const primaryImage = await this.findPrimaryImage(productId);
    if (primaryImage) return primaryImage;

    const images = await this.findImagesSorted(productId);
    return images.length > 0 ? images[0] : null;
  }

  // Bulk operations
  async bulkUpdateSortOrder(productId: number, imageIds: number[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (let i = 0; i < imageIds.length; i++) {
        await this.updateSortOrder(imageIds[i], i);
      }
      return true;
    });
  }

  async bulkDeleteByProductId(productId: number): Promise<boolean> {
    const images = await this.findByProductId(productId);
    return await this.executeTransaction(async () => {
      for (const image of images) {
        await this.delete(image.id!);
      }
      return true;
    });
  }

  async bulkAddImages(productId: number, imageData: Omit<ProductImage, 'id' | 'product_id' | 'created_at'>[]): Promise<ProductImage[]> {
    return await this.executeTransaction(async () => {
      const results: ProductImage[] = [];
      for (let i = 0; i < imageData.length; i++) {
        const data = {
          ...imageData[i],
          product_id: productId,
          sort_order: imageData[i].sort_order !== undefined ? imageData[i].sort_order : i
        };
        const result = await this.create(data);
        results.push(result);
      }
      return results;
    });
  }

  // Override create to add timestamps and defaults
  async create(data: ProductImage): Promise<ProductImage> {
    const imageData = {
      ...data,
      sort_order: data.sort_order !== undefined ? data.sort_order : 0,
      is_primary: data.is_primary !== undefined ? data.is_primary : false,
      created_at: new Date().toISOString(),
    };

    // If this is set as primary, make sure no other image is primary for this product
    if (imageData.is_primary) {
      await this.executeTransaction(async () => {
        const existingImages = await this.findByProductId(imageData.product_id);
        for (const img of existingImages) {
          if (img.is_primary) {
            await this.update(img.id!, { is_primary: false });
          }
        }
      });
    }

    return await super.create(imageData);
  }

  // Override delete to handle primary image reassignment
  async delete(id: string | number): Promise<boolean> {
    const image = await this.findById(id);
    if (!image) return false;

    const wasDeleted = await super.delete(id);
    
    // If we deleted a primary image, assign primary to the first remaining image
    if (wasDeleted && image.is_primary) {
      const remainingImages = await this.findImagesSorted(image.product_id);
      if (remainingImages.length > 0) {
        await this.update(remainingImages[0].id!, { is_primary: true });
      }
    }

    return wasDeleted;
  }
}

// Export singleton instance
export const productImageService = new ProductImageService();
export default productImageService;
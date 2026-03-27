// ProductAttributeService.ts
import { BaseService } from '../../../database';

export interface ProductAttribute {
  id?: number;
  store_id: string;
  name: string;
  is_required?: boolean;
  is_variation?: boolean;
  sort_order?: number;
  created_at?: string;
}

export class ProductAttributeService extends BaseService {
  constructor() {
    super('product', 'product_attributes');
  }

  /**
   * Specific validation for ProductAttribute
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng product_attributes nếu truyền vào
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Attribute name is required and must be a string');
    }

    if (data.sort_order && typeof data.sort_order !== 'number') {
      throw new Error('Sort order must be a number');
    }
  }

  // ProductAttribute-specific methods
  async findByStoreId(storeId: string): Promise<ProductAttribute[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findByName(storeId: string, name: string): Promise<ProductAttribute | null> {
    const attributes = await this.findAll({ 
      store_id: storeId, 
      name: name 
    });
    return attributes.length > 0 ? attributes[0] : null;
  }

  async findRequiredAttributes(storeId: string): Promise<ProductAttribute[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_required: true 
    });
  }

  async findVariationAttributes(storeId: string): Promise<ProductAttribute[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_variation: true 
    });
  }

  async findNonVariationAttributes(storeId: string): Promise<ProductAttribute[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_variation: false 
    });
  }

  // Get attributes sorted by sort_order
  async findAttributesSorted(storeId: string): Promise<ProductAttribute[]> {
    const attributes = await this.findByStoreId(storeId);
    return attributes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  // Update attribute properties
  async setRequired(id: number, isRequired: boolean): Promise<ProductAttribute | null> {
    return await this.update(id, { is_required: isRequired });
  }

  async setVariation(id: number, isVariation: boolean): Promise<ProductAttribute | null> {
    return await this.update(id, { is_variation: isVariation });
  }

  async updateSortOrder(id: number, sortOrder: number): Promise<ProductAttribute | null> {
    return await this.update(id, { sort_order: sortOrder });
  }

  // Check if attribute name exists
  async attributeNameExists(storeId: string, name: string, excludeId?: number): Promise<boolean> {
    const attributes = await this.findAll({ store_id: storeId, name: name });
    if (excludeId) {
      return attributes.some(attr => attr.id !== excludeId);
    }
    return attributes.length > 0;
  }

  // Reorder attributes
  async reorderAttributes(attributeUpdates: { id: number; sort_order: number }[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const update of attributeUpdates) {
        await this.updateSortOrder(update.id, update.sort_order);
      }
      return true;
    });
  }

  // Get attribute statistics
  async getAttributeStatistics(storeId: string): Promise<any> {
    const allAttributes = await this.findByStoreId(storeId);
    const requiredAttributes = allAttributes.filter(attr => attr.is_required);
    const variationAttributes = allAttributes.filter(attr => attr.is_variation);
    
    return {
      total: allAttributes.length,
      required: requiredAttributes.length,
      variation: variationAttributes.length,
      optional: allAttributes.length - requiredAttributes.length
    };
  }

  // Override create to add timestamps and defaults
  async create(data: ProductAttribute): Promise<ProductAttribute> {
    const attributeData = {
      ...data,
      is_required: data.is_required !== undefined ? data.is_required : false,
      is_variation: data.is_variation !== undefined ? data.is_variation : false,
      sort_order: data.sort_order !== undefined ? data.sort_order : 0,
      created_at: new Date().toISOString(),
    };
    return await super.create(attributeData);
  }

  // Bulk operations
  async bulkSetRequired(ids: number[], isRequired: boolean): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.setRequired(id, isRequired);
      }
      return true;
    });
  }

  async bulkSetVariation(ids: number[], isVariation: boolean): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.setVariation(id, isVariation);
      }
      return true;
    });
  }
}

// Export singleton instance
export const productAttributeService = new ProductAttributeService();
export default productAttributeService;
// ProductVariantService.ts
import { BaseService } from '../../../database';

export interface ProductVariant {
  id?: number;
  product_id: number;
  store_id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  compare_price?: number;
  weight?: number;
  image_url?: string;
  variant_attributes?: any;
  position?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ProductVariantService extends BaseService {
  constructor() {
    super('product', 'product_variants');
  }

  /**
   * Specific validation for ProductVariant
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng product_variants nếu truyền vào
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.product_id && typeof data.product_id !== 'number') {
      throw new Error('Product ID is required and must be a number');
    }

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Variant name is required and must be a string');
    }

    if (data.sku && typeof data.sku !== 'string') {
      throw new Error('SKU is required and must be a string');
    }

    if (data.price && (typeof data.price !== 'number' || data.price < 0)) {
      throw new Error('Price is required and must be a non-negative number');
    }

    if (data.cost_price && (typeof data.cost_price !== 'number' || data.cost_price < 0)) {
      throw new Error('Cost price must be a non-negative number');
    }

    if (data.compare_price && (typeof data.compare_price !== 'number' || data.compare_price < 0)) {
      throw new Error('Compare price must be a non-negative number');
    }

    if (data.weight && (typeof data.weight !== 'number' || data.weight < 0)) {
      throw new Error('Weight must be a non-negative number');
    }

    if (data.position && typeof data.position !== 'number') {
      throw new Error('Position must be a number');
    }
  }

  // ProductVariant-specific methods
  async findByProductId(productId: number): Promise<ProductVariant[]> {
    return await this.findAll({ product_id: productId });
  }

  async findByStoreId(storeId: string): Promise<ProductVariant[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const variants = await this.findAll({ sku: sku });
    return variants.length > 0 ? variants[0] : null;
  }

  async findByBarcode(barcode: string): Promise<ProductVariant | null> {
    const variants = await this.findAll({ barcode: barcode });
    return variants.length > 0 ? variants[0] : null;
  }

  async findActiveVariants(productId: number): Promise<ProductVariant[]> {
    return await this.findAll({ 
      product_id: productId, 
      is_active: true 
    });
  }

  async findInactiveVariants(productId: number): Promise<ProductVariant[]> {
    return await this.findAll({ 
      product_id: productId, 
      is_active: false 
    });
  }

  async findVariantsByAttributes(productId: number, attributes: Record<string, any>): Promise<ProductVariant[]> {
    const allVariants = await this.findByProductId(productId);
    return allVariants.filter(variant => {
      if (!variant.variant_attributes) return false;
      return Object.entries(attributes).every(([key, value]) => 
        variant.variant_attributes[key] === value
      );
    });
  }

  // Get variants sorted by position
  async findVariantsSortedByPosition(productId: number): Promise<ProductVariant[]> {
    const variants = await this.findByProductId(productId);
    return variants.sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  // Update variant status
  async activateVariant(id: number): Promise<ProductVariant | null> {
    return await this.update(id, { 
      is_active: true,
      updated_at: new Date().toISOString() 
    });
  }

  async deactivateVariant(id: number): Promise<ProductVariant | null> {
    return await this.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString() 
    });
  }

  // Price management
  async updatePrice(id: number, price: number): Promise<ProductVariant | null> {
    return await this.update(id, { 
      price: price,
      updated_at: new Date().toISOString() 
    });
  }

  async updatePrices(id: number, price: number, costPrice?: number, comparePrice?: number): Promise<ProductVariant | null> {
    const updateData: any = { 
      price: price,
      updated_at: new Date().toISOString() 
    };
    
    if (costPrice !== undefined) updateData.cost_price = costPrice;
    if (comparePrice !== undefined) updateData.compare_price = comparePrice;

    return await this.update(id, updateData);
  }

  // Position management
  async updatePosition(id: number, position: number): Promise<ProductVariant | null> {
    return await this.update(id, { 
      position: position,
      updated_at: new Date().toISOString() 
    });
  }

  async reorderVariants(variantUpdates: { id: number; position: number }[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const update of variantUpdates) {
        await this.updatePosition(update.id, update.position);
      }
      return true;
    });
  }

  // Attributes management
  async updateAttributes(id: number, attributes: Record<string, any>): Promise<ProductVariant | null> {
    return await this.update(id, { 
      variant_attributes: attributes,
      updated_at: new Date().toISOString() 
    });
  }

  async addAttribute(id: number, key: string, value: any): Promise<ProductVariant | null> {
    const variant = await this.findById(id);
    if (!variant) return null;

    const currentAttributes = variant.variant_attributes || {};
    const updatedAttributes = { ...currentAttributes, [key]: value };

    return await this.updateAttributes(id, updatedAttributes);
  }

  async removeAttribute(id: number, key: string): Promise<ProductVariant | null> {
    const variant = await this.findById(id);
    if (!variant) return null;

    const currentAttributes = variant.variant_attributes || {};
    const { [key]: removed, ...updatedAttributes } = currentAttributes;

    return await this.updateAttributes(id, updatedAttributes);
  }

  // Check if SKU exists
  async skuExists(sku: string, excludeId?: number): Promise<boolean> {
    const variants = await this.findAll({ sku: sku });
    if (excludeId) {
      return variants.some(variant => variant.id !== excludeId);
    }
    return variants.length > 0;
  }

  // Check if barcode exists
  async barcodeExists(barcode: string, excludeId?: number): Promise<boolean> {
    const variants = await this.findAll({ barcode: barcode });
    if (excludeId) {
      return variants.some(variant => variant.id !== excludeId);
    }
    return variants.length > 0;
  }

  // Get variant statistics for a product
  async getVariantStatistics(productId: number): Promise<any> {
    const allVariants = await this.findByProductId(productId);
    const activeVariants = allVariants.filter(v => v.is_active);
    
    return {
      total: allVariants.length,
      active: activeVariants.length,
      inactive: allVariants.length - activeVariants.length,
      averagePrice: activeVariants.reduce((sum, v) => sum + v.price, 0) / activeVariants.length || 0,
      priceRange: activeVariants.length > 0 ? {
        min: Math.min(...activeVariants.map(v => v.price)),
        max: Math.max(...activeVariants.map(v => v.price))
      } : null
    };
  }

  // Get all unique attribute keys for a product's variants
  async getProductVariantAttributeKeys(productId: number): Promise<string[]> {
    const variants = await this.findByProductId(productId);
    const allKeys = new Set<string>();
    
    variants.forEach(variant => {
      if (variant.variant_attributes && typeof variant.variant_attributes === 'object') {
        Object.keys(variant.variant_attributes).forEach(key => allKeys.add(key));
      }
    });
    
    return Array.from(allKeys);
  }

  // Find variant by exact attribute match
  async findVariantByExactAttributes(productId: number, attributes: Record<string, any>): Promise<ProductVariant | null> {
    const variants = await this.findByProductId(productId);
    
    const matchingVariant = variants.find(variant => {
      if (!variant.variant_attributes) return Object.keys(attributes).length === 0;
      
      const variantKeys = Object.keys(variant.variant_attributes);
      const attributeKeys = Object.keys(attributes);
      
      if (variantKeys.length !== attributeKeys.length) return false;
      
      return attributeKeys.every(key => 
        variantKeys.includes(key) && variant.variant_attributes[key] === attributes[key]
      );
    });
    
    return matchingVariant || null;
  }

  // Override create to add timestamps and defaults
  async create(data: ProductVariant): Promise<ProductVariant> {
    const variantData = {
      ...data,
      position: data.position !== undefined ? data.position : 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await super.create(variantData);
  }

  // Override update to add updated_at timestamp
  async update(id: string | number, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }

  // Bulk operations
  async bulkUpdateStatus(ids: number[], isActive: boolean): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.update(id, { is_active: isActive });
      }
      return true;
    });
  }

  async bulkUpdatePrices(priceUpdates: { id: number; price: number; cost_price?: number; compare_price?: number }[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const update of priceUpdates) {
        await this.updatePrices(update.id, update.price, update.cost_price, update.compare_price);
      }
      return true;
    });
  }

  async bulkDeleteByProductId(productId: number): Promise<boolean> {
    const variants = await this.findByProductId(productId);
    return await this.executeTransaction(async () => {
      for (const variant of variants) {
        await this.delete(variant.id!);
      }
      return true;
    });
  }
}

// Export singleton instance
export const productVariantService = new ProductVariantService();
export default productVariantService;
// ProductService.ts
import { BaseService } from '../../../database';

export interface Product {
  id?: number;
  store_id: string;
  category_id?: number;
  name: string;
  description?: string;
  short_description?: string;
  sku: string;
  barcode?: string;
  qr_code?: string;
  price: number;
  cost_price?: number;
  compare_price?: number;
  unit?: string;
  weight?: number;
  dimensions?: any;
  image_urls?: any;
  tags?: any;
  is_active?: boolean;
  is_featured?: boolean;
  tax_class?: string;
  attributes?: any;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  updated_at?: string;
}

export class ProductService extends BaseService {
  constructor() {
    super('product', 'products');
  }

  /**
   * Specific validation for Product
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng products nếu truyền vào
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Product name is required and must be a string');
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

    if (data.category_id && typeof data.category_id !== 'number') {
      throw new Error('Category ID must be a number');
    }
  }

  // Product-specific methods
  async findByStoreId(storeId: string): Promise<Product[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findByCategoryId(categoryId: number): Promise<Product[]> {
    return await this.findAll({ category_id: categoryId });
  }

  async findBySku(sku: string): Promise<Product | null> {
    const products = await this.findAll({ sku: sku });
    return products.length > 0 ? products[0] : null;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const products = await this.findAll({ barcode: barcode });
    return products.length > 0 ? products[0] : null;
  }

  async findActiveProducts(storeId: string): Promise<Product[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_active: true 
    });
  }

  async findInactiveProducts(storeId: string): Promise<Product[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_active: false 
    });
  }

  async findFeaturedProducts(storeId: string): Promise<Product[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_featured: true,
      is_active: true 
    });
  }

  async findProductsByPriceRange(storeId: string, minPrice: number, maxPrice: number): Promise<Product[]> {
    const allProducts = await this.findByStoreId(storeId);
    return allProducts.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );
  }

  async findProductsByTags(storeId: string, tags: string[]): Promise<Product[]> {
    const allProducts = await this.findByStoreId(storeId);
    return allProducts.filter(product => {
      if (!product.tags || !Array.isArray(product.tags)) return false;
      return tags.some(tag => product.tags.includes(tag));
    });
  }

  // Search products by name or description
  async searchProducts(storeId: string, searchTerm: string): Promise<Product[]> {
    const allProducts = await this.findByStoreId(storeId);
    const term = searchTerm.toLowerCase();
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(term) ||
      (product.description && product.description.toLowerCase().includes(term)) ||
      (product.short_description && product.short_description.toLowerCase().includes(term))
    );
  }

  // Update product status
  async activateProduct(id: number): Promise<Product | null> {
    return await this.update(id, { 
      is_active: true,
      updated_at: new Date().toISOString() 
    });
  }

  async deactivateProduct(id: number): Promise<Product | null> {
    return await this.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString() 
    });
  }

  async setFeaturedStatus(id: number, isFeatured: boolean): Promise<Product | null> {
    return await this.update(id, { 
      is_featured: isFeatured,
      updated_at: new Date().toISOString() 
    });
  }

  // Price management
  async updatePrice(id: number, price: number): Promise<Product | null> {
    return await this.update(id, { 
      price: price,
      updated_at: new Date().toISOString() 
    });
  }

  async updatePrices(id: number, price: number, costPrice?: number, comparePrice?: number): Promise<Product | null> {
    const updateData: any = { 
      price: price,
      updated_at: new Date().toISOString() 
    };
    
    if (costPrice !== undefined) updateData.cost_price = costPrice;
    if (comparePrice !== undefined) updateData.compare_price = comparePrice;

    return await this.update(id, updateData);
  }

  // Category management
  async moveToCategory(id: number, categoryId?: number ): Promise<Product | null> {
    return await this.update(id, { 
      category_id: categoryId,
      updated_at: new Date().toISOString() 
    });
  }

  // Tags management
  async addTags(id: number, newTags: string[]): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    const currentTags = Array.isArray(product.tags) ? product.tags : [];
    const updatedTags = [...new Set([...currentTags, ...newTags])];

    return await this.update(id, { 
      tags: updatedTags,
      updated_at: new Date().toISOString() 
    });
  }

  async removeTags(id: number, tagsToRemove: string[]): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    const currentTags = Array.isArray(product.tags) ? product.tags : [];
    const updatedTags = currentTags.filter((tag: string) => !tagsToRemove.includes(tag));

    return await this.update(id, { 
      tags: updatedTags,
      updated_at: new Date().toISOString() 
    });
  }

  // Check if SKU exists
  async skuExists(sku: string, excludeId?: number): Promise<boolean> {
    const products = await this.findAll({ sku: sku });
    if (excludeId) {
      return products.some(product => product.id !== excludeId);
    }
    return products.length > 0;
  }

  // Check if barcode exists
  async barcodeExists(barcode: string, excludeId?: number): Promise<boolean> {
    const products = await this.findAll({ barcode: barcode });
    if (excludeId) {
      return products.some(product => product.id !== excludeId);
    }
    return products.length > 0;
  }

  // Get products with low stock (this would typically be in inventory service)
  async getProductsStatistics(storeId: string): Promise<any> {
    const allProducts = await this.findByStoreId(storeId);
    const activeProducts = allProducts.filter(p => p.is_active);
    const featuredProducts = allProducts.filter(p => p.is_featured);
    
    return {
      total: allProducts.length,
      active: activeProducts.length,
      inactive: allProducts.length - activeProducts.length,
      featured: featuredProducts.length,
      averagePrice: activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length || 0
    };
  }

  // Override create to add timestamps and defaults
  async create(data: Product): Promise<Product> {
    const productData = {
      ...data,
      is_active: data.is_active !== undefined ? data.is_active : true,
      is_featured: data.is_featured !== undefined ? data.is_featured : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await super.create(productData);
  }

  // Override update to add updated_at timestamp
  async update(id: string | number, data: Partial<Product>): Promise<Product> {
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

  async bulkUpdateCategory(ids: number[], categoryId: number): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.update(id, { category_id: categoryId });
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
}

// Export singleton instance
export const productService = new ProductService();
export default productService;
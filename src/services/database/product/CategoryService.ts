// CategoryService.ts
import {BaseService} from '../../../database';

export interface Category {
  id?: number;
  store_id: string;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  level?: number | null;
  sort_order?: number | null;
  image_url?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
  metadata?: any | null;
  created_at?: string;
  updated_at?: string;
}

// Interface cho dữ liệu import (raw data từ Excel)
export interface ImportCategoryData {
  id?: number | string;
  name: string | any;
  description?: string | any;
  parent_id?: number | string | null;
  level?: number | string;
  sort_order?: number | string;
  image_url?: string | any;
  icon?: string | any;
  color?: string | any;
  is_active?: boolean | string | number;
  metadata?: any;
}

// Interface cho dữ liệu đã được chuẩn hóa
export interface NormalizedCategoryData {
  id?: number;
  name: string;
  description?: string;
  parent_id?: number;
  level?: number;
  sort_order?: number;
  image_url?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  metadata?: any;
}

// Interface cho options của hàm import
export interface ImportOptions {
  updateIfExists?: boolean; // Cập nhật nếu đã tồn tại ID
  skipDuplicates?: boolean; // Bỏ qua các bản ghi trùng lặp
  validateHierarchy?: boolean; // Kiểm tra tính hợp lệ của cấu trúc phân cấp
  allowInvalidParents?: boolean; // Cho phép parent_id không tồn tại (sẽ set null)
}

// Interface cho kết quả import
export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: ImportError[];
  warnings: string[];
  importedCategories: Category[];
}

export interface ImportError {
  index: number;
  data: any;
  error: string;
  type: 'validation' | 'duplicate' | 'database' | 'hierarchy' | 'normalization';
}

export class CategoryService extends BaseService {
  constructor() {
    super('product', 'categories');
  }

  /**
   * Data normalization helpers
   */
  private _dataHelpers = {
    // Convert string to number
    toNumber: (value: any): number | undefined => {
      if (
        value === undefined ||
        value === null ||
        value === 'NULL' ||
        value === 'null' ||
        value === 'nil' ||
        value === ''
      ) {
        return undefined;
      }
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const num = Number(value.trim());
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },

    // Convert string to boolean
    toBoolean: (value: any): boolean | undefined => {
      // mặt định giá trị null thì default true
      if (
        value === undefined ||
        value === null ||
        value === 'NULL' ||
        value === 'null' ||
        value === 'nil' ||
        value === ''
      ) {
        return true;
      }
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const str = value.trim().toLowerCase();
        if (str === 'true' || str === '1' || str === 'yes' || str === 'y') {
          return true;
        }
        if (str === 'false' || str === '0' || str === 'no' || str === 'n') {
          return false;
        }
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      return undefined;
    },

    // Clean and normalize string
    toString: (value: any): string | undefined => {
      if (
        value === undefined ||
        value === null ||
        value === 'NULL' ||
        value === 'null' ||
        value === 'nil' ||
        value === ''
      ) {
        return undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return String(value).trim() || undefined;
    },

    // Validate hex color
    isValidHexColor: (color: string): boolean => {
      return /^#[0-9A-Fa-f]{6}$/.test(color);
    },
  };

  /**
   * Normalize import data before validation
   */
  private _normalizeImportData(
    data: ImportCategoryData,
    index: number,
  ): {errors: string[]; normalizedData: NormalizedCategoryData | null} {
    const errors: string[] = [];
    const {toNumber, toBoolean, toString} = this._dataHelpers;

    try {
      const normalizedData: NormalizedCategoryData =
        {} as NormalizedCategoryData;

      // Normalize ID
      if (data.id !== undefined) {
        const id = toNumber(data.id);
        if (data.id !== undefined && id === undefined) {
          errors.push(
            `Row ${index + 1}: ID must be a valid number: ${data.id}`,
          );
        } else if (id !== undefined && id <= 0) {
          errors.push(
            `Row ${index + 1}: ID must be a positive number: ${data.id}`,
          );
        } else {
          normalizedData.id = id;
        }
      }

      // Normalize required name field
      normalizedData.name = toString(data.name) || '';
      if (!normalizedData.name) {
        errors.push(
          `Row ${
            index + 1
          }: Category name is required and must be a non-empty string`,
        );
      }

      // Normalize optional string fields
      normalizedData.description = toString(data.description);
      normalizedData.image_url = toString(data.image_url);
      normalizedData.icon = toString(data.icon);

      // Normalize parent_id
      if (data.parent_id !== undefined && data.parent_id !== null) {
        const parentId = toNumber(data.parent_id);
        if (data.parent_id !== null && parentId === undefined) {
          errors.push(
            `Row ${index + 1}: Parent ID must be a valid number or null: ${
              data.parent_id
            }`,
          );
        } else if (parentId !== undefined && parentId <= 0) {
          errors.push(
            `Row ${index + 1}: Parent ID must be a positive number or null: ${
              data.parent_id
            }`,
          );
        } else {
          normalizedData.parent_id = parentId;
        }
      }

      // Normalize level
      if (data.level !== undefined) {
        const level = toNumber(data.level);
        if (data.level !== undefined && level === undefined) {
          errors.push(
            `Row ${index + 1}: Level must be a valid number: ${data.level}`,
          );
        } else if (level !== undefined && level < 1) {
          errors.push(
            `Row ${index + 1}: Level must be a positive number (minimum 1): ${
              data.level
            }`,
          );
        } else {
          normalizedData.level = level;
        }
      }

      // Normalize sort_order
      if (data.sort_order !== undefined) {
        const sortOrder = toNumber(data.sort_order);
        if (data.sort_order !== undefined && sortOrder === undefined) {
          errors.push(
            `Row ${index + 1}: Sort order must be a valid number: ${
              data.sort_order
            }`,
          );
        } else {
          normalizedData.sort_order = sortOrder;
        }
      }

      // Normalize color
      if (data.color !== undefined && data.color !== null) {
        const color = toString(data.color);
        if (color && !this._dataHelpers.isValidHexColor(color)) {
          errors.push(
            `Row ${
              index + 1
            }: Color must be a valid hex color code (e.g., #FF5733): ${
              data.color
            }`,
          );
        } else {
          normalizedData.color = color;
        }
      }

      // Normalize is_active
      if (data.is_active !== undefined) {
        const isActive = toBoolean(data.is_active);
        if (data.is_active !== undefined && isActive === undefined) {
          errors.push(
            `Row ${
              index + 1
            }: is_active must be a valid boolean value (true/false, 1/0, yes/no): ${
              data.is_active
            }`,
          );
        } else {
          normalizedData.is_active = isActive;
        }
      }

      // Keep metadata as-is
      if (data.metadata !== undefined) {
        normalizedData.metadata = data.metadata;
      }

      return {
        errors,
        normalizedData: errors.length === 0 ? normalizedData : null,
      };
    } catch (error: any) {
      return {
        errors: [
          `Row ${index + 1}: Data normalization failed: ${error.message}`,
        ],
        normalizedData: null,
      };
    }
  }

  /**
   * Validate normalized data
   */
  private _validateNormalizedData(
    data: NormalizedCategoryData,
    index: number,
  ): string[] {
    const errors: string[] = [];

    // Required fields check
    if (!data.name || data.name.trim().length === 0) {
      errors.push(
        `Row ${
          index + 1
        }: Category name is required and must be a non-empty string`,
      );
    }

    // Length constraints
    if (data.name && data.name.length > 255) {
      errors.push(
        `Row ${index + 1}: Category name is too long (maximum 255 characters)`,
      );
    }

    if (data.description && data.description.length > 1000) {
      errors.push(
        `Row ${index + 1}: Description is too long (maximum 1000 characters)`,
      );
    }

    // Business rules validation
    if (data.level !== undefined && !data.parent_id && data.level !== 1) {
      errors.push(
        `Row ${index + 1}: Root category should have level 1, got ${
          data.level
        }`,
      );
    }

    return errors;
  }

  /**
   * Process and validate import data (combines normalization + validation)
   */
  private _processImportData(
    data: ImportCategoryData,
    index: number,
  ): {errors: string[]; normalizedData: NormalizedCategoryData | null} {
    // Step 1: Normalize data
    const {errors: normalizationErrors, normalizedData} =
      this._normalizeImportData(data, index);

    if (normalizationErrors.length > 0 || !normalizedData) {
      return {errors: normalizationErrors, normalizedData: null};
    }

    // Step 2: Validate normalized data
    const validationErrors = this._validateNormalizedData(
      normalizedData,
      index,
    );

    return {
      errors: [...normalizationErrors, ...validationErrors],
      normalizedData: validationErrors.length === 0 ? normalizedData : null,
    };
  }

  /**
   * Specific validation for Category (for regular CRUD operations)
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Category name is required and must be a string');
    }

    if (data.parent_id && typeof data.parent_id !== 'number') {
      throw new Error('Parent ID must be a number');
    }

    if (data.level && (typeof data.level !== 'number' || data.level < 1)) {
      throw new Error('Level must be a positive number');
    }

    if (data.sort_order && typeof data.sort_order !== 'number') {
      throw new Error('Sort order must be a number');
    }

    if (
      data.color &&
      (typeof data.color !== 'string' ||
        !this._dataHelpers.isValidHexColor(data.color))
    ) {
      throw new Error('Color must be a valid hex color code');
    }
  }

  /**
   * Check for duplicate data within the import batch
   */
  private _checkDuplicatesInBatch(
    data: NormalizedCategoryData[],
  ): ImportError[] {
    const errors: ImportError[] = [];
    const seenIds = new Set<number>();
    const seenNames = new Set<string>();

    data.forEach((item, index) => {
      // Check duplicate IDs
      if (item.id !== undefined) {
        if (seenIds.has(item.id)) {
          errors.push({
            index,
            data: item,
            error: `Duplicate ID ${item.id} found in import data`,
            type: 'duplicate',
          });
        } else {
          seenIds.add(item.id);
        }
      }

      // Check duplicate names (case-insensitive)
      const normalizedName = item.name?.toLowerCase().trim();
      if (normalizedName) {
        if (seenNames.has(normalizedName)) {
          errors.push({
            index,
            data: item,
            error: `Duplicate category name "${item.name}" found in import data`,
            type: 'duplicate',
          });
        } else {
          seenNames.add(normalizedName);
        }
      }
    });

    return errors;
  }

  /**
   * Validate hierarchy structure
   */
  private async _validateHierarchy(
    data: NormalizedCategoryData[],
    storeId: string,
    existingCategories: Category[],
  ): Promise<ImportError[]> {
    const errors: ImportError[] = [];

    // Create a map of all categories (existing + import data)
    const allCategories = new Map<
      number,
      {level: number; parent_id?: number | null}
    >();

    // Add existing categories
    existingCategories.forEach(cat => {
      if (cat.id) {
        allCategories.set(cat.id, {
          level: cat.level || 1,
          parent_id: cat.parent_id,
        });
      }
    });

    // Add import data categories
    data.forEach(item => {
      if (item.id) {
        allCategories.set(item.id, {
          level: item.level || 1,
          parent_id: item.parent_id,
        });
      }
    });

    // Validate each item
    data.forEach((item, index) => {
      if (item.parent_id) {
        // Check if parent exists
        const parentExists = allCategories.has(item.parent_id);
        if (!parentExists) {
          errors.push({
            index,
            data: item,
            error: `Parent category with ID ${item.parent_id} does not exist`,
            type: 'hierarchy',
          });
          return;
        }

        // Check level consistency
        const parent = allCategories.get(item.parent_id);
        const expectedLevel = (parent?.level || 1) + 1;
        const actualLevel = item.level || 1;

        if (actualLevel !== expectedLevel) {
          errors.push({
            index,
            data: item,
            error: `Invalid level ${actualLevel}. Expected ${expectedLevel} based on parent level`,
            type: 'hierarchy',
          });
        }
      }
    });

    return errors;
  }

  /**
   * Import bulk categories
   */
  async importCategories(
    storeId: string,
    data: ImportCategoryData[],
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRecords: data.length,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      errors: [],
      warnings: [],
      importedCategories: [],
    };

    // Default options
    const opts: ImportOptions = {
      updateIfExists: false,
      skipDuplicates: true,
      validateHierarchy: true,
      allowInvalidParents: false,
      ...options,
    };

    if (!storeId || typeof storeId !== 'string') {
      result.errors.push({
        index: -1,
        data: null,
        error: 'Store ID is required and must be a string',
        type: 'validation',
      });
      return result;
    }

    if (!Array.isArray(data) || data.length === 0) {
      result.errors.push({
        index: -1,
        data: null,
        error: 'Import data must be a non-empty array',
        type: 'validation',
      });
      return result;
    }

    try {
      // Get existing categories for the store
      const existingCategories = await this.findByStoreId(storeId);
      const existingIds = new Set(
        existingCategories.map(cat => cat.id).filter(Boolean),
      );
      const existingNames = new Map(
        existingCategories.map(cat => [cat.name.toLowerCase().trim(), cat]),
      );

      // Step 1: Normalize and validate individual records
      const normalizedData: NormalizedCategoryData[] = [];
      const originalIndexMap = new Map<NormalizedCategoryData, number>(); // Track original indices

      data.forEach((item, index) => {
        const {errors, normalizedData: normalized} = this._processImportData(
          item,
          index,
        );

        if (errors.length > 0) {
          errors.forEach(error => {
            result.errors.push({
              index,
              data: item,
              error,
              type: 'normalization',
            });
          });
          result.failedCount++;
        } else if (normalized) {
          normalizedData.push(normalized);
          originalIndexMap.set(normalized, index);
        }
      });

      // Step 2: Check duplicates in batch
      const duplicateErrors = this._checkDuplicatesInBatch(normalizedData);
      if (duplicateErrors.length > 0 && !opts.skipDuplicates) {
        // Map back to original indices
        duplicateErrors.forEach(error => {
          const originalIndex =
            originalIndexMap.get(error.data as NormalizedCategoryData) ||
            error.index;
          result.errors.push({
            ...error,
            index: originalIndex,
          });
        });
        result.failedCount += duplicateErrors.length;
      }

      // Step 3: Validate hierarchy if enabled
      if (opts.validateHierarchy) {
        const hierarchyErrors = await this._validateHierarchy(
          normalizedData,
          storeId,
          existingCategories,
        );
        if (hierarchyErrors.length > 0) {
          // Map back to original indices
          hierarchyErrors.forEach(error => {
            const originalIndex =
              originalIndexMap.get(error.data as NormalizedCategoryData) ||
              error.index;
            result.errors.push({
              ...error,
              index: originalIndex,
            });
          });
          if (!opts.allowInvalidParents) {
            result.failedCount += hierarchyErrors.length;
          }
        }
      }

      // Step 4: Process valid records
      const validData = normalizedData.filter(item => {
        const originalIndex = originalIndexMap.get(item);
        return !result.errors.some(error => error.index === originalIndex);
      });

      // Process in transaction
      await this.executeTransaction(async () => {
        for (const item of validData) {
          const originalIndex = originalIndexMap.get(item) || -1;

          try {
            // Check if ID already exists
            if (item.id && existingIds.has(item.id)) {
              if (opts.updateIfExists) {
                // Update existing record
                const updateData: Partial<Category> = {
                  name: item.name.trim(),
                  description: item.description || null,
                  parent_id: item.parent_id || null,
                  level: item.level || 1,
                  sort_order: item.sort_order || 0,
                  image_url: item.image_url || null,
                  icon: item.icon || null,
                  color: item.color || null,
                  is_active:
                    item.is_active !== undefined ? item.is_active : true,
                  metadata: item.metadata || null,
                  updated_at: new Date().toISOString(),
                };

                const updated = await this.update(item.id, updateData);
                result.importedCategories.push(updated);
                result.successCount++;
                result.warnings.push(
                  `Updated existing category with ID ${item.id}`,
                );
              } else {
                result.skippedCount++;
                result.warnings.push(
                  `Skipped existing category with ID ${item.id}`,
                );
                continue;
              }
            }
            // Check if name already exists
            else if (existingNames.has(item.name.toLowerCase().trim())) {
              if (opts.skipDuplicates) {
                result.skippedCount++;
                result.warnings.push(
                  `Skipped duplicate category name "${item.name}"`,
                );
                continue;
              } else {
                result.errors.push({
                  index: originalIndex,
                  data: item,
                  error: `Category name "${item.name}" already exists in store`,
                  type: 'duplicate',
                });
                result.failedCount++;
                continue;
              }
            }
            // Create new record
            else {
              const now = new Date().toISOString();
              const createData: Category = {
                ...(item.id && {id: item.id}),
                store_id: storeId,
                name: item.name.trim(),
                description: item.description || null,
                parent_id: item.parent_id || null,
                level: item.level || 1,
                sort_order: item.sort_order || 0,
                image_url: item.image_url || null,
                icon: item.icon || null,
                color: item.color || null,
                is_active: item.is_active !== undefined ? item.is_active : true,
                metadata: item.metadata || null,
                created_at: now,
                updated_at: now,
              };

              const created = await this.create(createData);
              result.importedCategories.push(created);
              result.successCount++;

              console.log(`Created new category with ID ${created.id}`);
              
              // Update tracking sets
              if (created.id) {
                existingIds.add(created.id);
                existingNames.set(created.name.toLowerCase().trim(), created);
              }
            }
          } catch (error: any) {
            result.errors.push({
              index: originalIndex,
              data: item,
              error: error.message || 'Unknown database error',
              type: 'database',
            });
            result.failedCount++;
          }
        }
      });

      // Set success status
      result.success = result.successCount > 0 && result.failedCount === 0;

      console.log(
        `Import completed: ${result.successCount} success, ${result.failedCount} failed, ${result.skippedCount} skipped`,
      );

      return result;
    } catch (error: any) {
      result.errors.push({
        index: -1,
        data: null,
        error: `Import transaction failed: ${error.message}`,
        type: 'database',
      });
      result.failedCount = data.length;
      return result;
    }
  }

  // Category-specific methods
  async findByStoreId(storeId?: string): Promise<Category[]> {
    return await this.findAll({store_id: storeId});
  }

  async findByParentId(parentId: number): Promise<Category[]> {
    return await this.findAll({parent_id: parentId});
  }

  async findRootCategories(storeId: string): Promise<Category[]> {
    return await this.findAll({
      store_id: storeId,
      parent_id: null,
    });
  }

  async findByLevel(storeId: string, level: number): Promise<Category[]> {
    return await this.findAll({
      store_id: storeId,
      level: level,
    });
  }

  async findActiveCategories(storeId?: string): Promise<Category[]> {
    return await this.findAll({
      store_id: storeId,
      is_active: true,
    });
  }

  async findInactiveCategories(storeId: string): Promise<Category[]> {
    return await this.findAll({
      store_id: storeId,
      is_active: false,
    });
  }

  async findByName(storeId: string, name: string): Promise<Category | null> {
    const categories = await this.findAll({
      store_id: storeId,
      name: name,
    });
    return categories.length > 0 ? categories[0] : null;
  }

  // Get category hierarchy
  async getCategoryHierarchy(storeId: string): Promise<Category[]> {
    const allCategories = await this.findByStoreId(storeId);
    return allCategories.sort((a, b) => (a.level || 1) - (b.level || 1));
  }

  // Get child categories
  async getChildCategories(parentId: number): Promise<Category[]> {
    return await this.findByParentId(parentId);
  }

  // Check if category has children
  async hasChildCategories(categoryId: number): Promise<boolean> {
    const children = await this.findByParentId(categoryId);
    return children.length > 0;
  }

  // Update category status
  async activateCategory(id: number): Promise<Category | null> {
    return await this.update(id, {
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  async deactivateCategory(id: number): Promise<Category | null> {
    return await this.update(id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  // Update sort order
  async updateSortOrder(
    id: number,
    sortOrder: number,
  ): Promise<Category | null> {
    return await this.update(id, {
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    });
  }

  // Move category to different parent
  async moveCategory(
    id: number,
    newParentId?: number,
    newLevel?: number,
  ): Promise<Category | null> {
    return await this.update(id, {
      parent_id: newParentId,
      level: newLevel,
      updated_at: new Date().toISOString(),
    });
  }

  // Check if category name exists in store
  async categoryNameExists(
    storeId: string,
    name: string,
    excludeId?: number,
  ): Promise<boolean> {
    const categories = await this.findAll({store_id: storeId, name: name});
    if (excludeId) {
      return categories.some(cat => cat.id !== excludeId);
    }
    return categories.length > 0;
  }

  // Override create to add timestamps and defaults
  async create(data: Category): Promise<Category> {
    const categoryData = {
      ...data,
      level: data.level || 1,
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await super.create(categoryData);
  }

  // Override update to add updated_at timestamp
  async update(
    id: string | number,
    data: Partial<Category>,
  ): Promise<Category> {
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
        await this.update(id, {is_active: isActive});
      }
      return true;
    });
  }

  async reorderCategories(
    categoryUpdates: {id: number; sort_order: number}[],
  ): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const update of categoryUpdates) {
        await this.updateSortOrder(update.id, update.sort_order);
      }
      return true;
    });
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;

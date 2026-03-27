import {BaseService} from '../../../database';
import {generateUID} from '../../../utils';

// Định nghĩa interface cho Folder
export interface Folder {
  id?: number;
  store_id: string;
  name: string;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Safe Folder interface không chứa thông tin nhạy cảm
export interface SafeFolder extends Folder {}

export class FolderService extends BaseService {
  constructor() {
    super('media', 'folders');
  }

  /**
   * Xác thực dữ liệu cho Folder
   * @param data - Dữ liệu cần xác thực
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Name is required and must be a string');
    }

    if (data.parent_id && typeof data.parent_id !== 'number') {
      throw new Error('Parent ID must be a number');
    }

    if (data.name && data.name.length > 255) {
      throw new Error('Folder name must not exceed 255 characters');
    }
  }

  // Folder-specific methods
  async findByStoreId(storeId: string): Promise<Folder[]> {
    return await this.findAll({store_id: storeId});
  }

  async findByParentId(parentId: number | null): Promise<Folder[]> {
    return await this.findAll({parent_id: parentId});
  }

  async findRootFolders(storeId: string): Promise<Folder[]> {
    return await this.findAll({store_id: storeId, parent_id: null});
  }

  /**
   * Tìm tất cả folder con của một folder cụ thể (đệ quy)
   * @param folderId - ID của folder cha
   * @returns Promise<Folder[]> - Danh sách folder con
   */
  async findAllChildren(folderId: number): Promise<Folder[]> {
    const children = await this.findByParentId(folderId);
    let result: Folder[] = [...children];

    for (const child of children) {
      const grandChildren = await this.findAllChildren(child.id!);
      result = [...result, ...grandChildren];
    }

    return result;
  }

  /**
   * Tìm đường dẫn đầy đủ từ folder đến root (đệ quy)
   * @param folderId - ID của folder
   * @returns Promise<Folder[]> - Danh sách các folder từ node hiện tại đến root
   */
  async getFolderPath(folderId: number): Promise<Folder[]> {
    const folder = await this.findById(folderId);
    if (!folder) {
      return [];
    }

    const path: Folder[] = [folder];
    if (folder.parent_id) {
      const parentPath = await this.getFolderPath(folder.parent_id);
      path.unshift(...parentPath);
    }

    return path;
  }

  /**
   * Tạo folder mới
   * @param data - Dữ liệu folder
   * @returns Promise<Folder> - Folder đã được tạo
   */
  async create(data: Folder): Promise<Folder> {
    const folderData = {
      ...data,
      store_id: data.store_id,
      name: data.name,
      parent_id: data.parent_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await super.create(folderData);
  }

  /**
   * Cập nhật folder
   * @param id - ID của folder
   * @param data - Dữ liệu cần cập nhật
   * @returns Promise<Folder> - Folder đã được cập nhật
   */
  async update(id: number, data: Partial<Folder>): Promise<Folder> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }

  /**
   * Xóa folder và các folder con (đệ quy)
   * @param id - ID của folder
   * @returns Promise<void>
   */
  async delete(id: number): Promise<boolean> {
    const children = await this.findByParentId(id);
    for (const child of children) {
      return await this.delete(child.id!);
    }
    return await super.delete(id);
  }

  /**
   * Kiểm tra xem folder có tồn tại không
   * @param id - ID của folder
   * @returns Promise<boolean>
   */
  async folderExists(id: number): Promise<boolean> {
    const folder = await this.findById(id);
    return !!folder;
  }

  /**
   * Kiểm tra xem folder có con không
   * @param id - ID của folder
   * @returns Promise<boolean>
   */
  async hasChildren(id: number): Promise<boolean> {
    const children = await this.findByParentId(id);
    return children.length > 0;
  }

  /**
   * Di chuyển folder sang thư mục cha mới
   * @param id - ID của folder cần di chuyển
   * @param newParentId - ID của thư mục cha mới
   * @returns Promise<Folder>
   */
  async moveFolder(id: number, newParentId: number | null): Promise<Folder> {
    if (newParentId !== null && !(await this.folderExists(newParentId))) {
      throw new Error('Parent folder does not exist');
    }

    // Kiểm tra vòng lặp (không cho phép folder trở thành con của chính nó hoặc con cháu)
    if (newParentId !== null) {
      const children = await this.findAllChildren(id);
      if (children.some(child => child.id === newParentId)) {
        throw new Error('Cannot move folder to its own descendant');
      }
    }

    return await this.update(id, {parent_id: newParentId});
  }
}

// Export singleton instance
export const folderService = new FolderService();
export default folderService;

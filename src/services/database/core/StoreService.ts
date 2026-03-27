// StoreService.ts
import {BaseService} from '../../../database';
import {generateUID} from '../../../utils';

export interface Store {
  id?: string;
  enterprise_id: string;
  name: string;
  store_type?: 'retail' | 'warehouse' | 'showroom' | 'factory' | 'office';
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  operating_hours?: any;
  timezone?: string;
  currency?: string;
  tax_rate?: number;
  status?: 'active' | 'inactive' | 'maintenance' | 'closed';
  sync_enabled?: boolean;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

export class StoreService extends BaseService {
  constructor() {
    super('core', 'stores');
  }

  /**
   *  Specific validation for User
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng store nếu truyền vào
   * Còn nếu không thì không cần xác thực
   * */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.enterprise_id && typeof data.enterprise_id !== 'string') {
      throw new Error('Enterprise ID is required and must be a string');
    }

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Store name is required and must be a string');
    }

    if (
      data.store_type &&
      ![
        'retail',
        'warehouse',
        'showroom',
        'factory',
        'office',
        'other',
      ].includes(data.store_type)
    ) {
      throw new Error('Invalid store type');
    }

    if (
      data.status &&
      !['active', 'inactive', 'maintenance', 'closed'].includes(data.status)
    ) {
      throw new Error('Invalid status');
    }

    if (
      data.tax_rate &&
      (typeof data.tax_rate !== 'number' ||
        data.tax_rate < 0 ||
        data.tax_rate > 100)
    ) {
      throw new Error('Tax rate must be a number between 0 and 100');
    }
  }

  // Store-specific methods
  async findByEnterpriseId(enterpriseId: string): Promise<Store[]> {
    return await this.findAll({enterprise_id: enterpriseId});
  }

  async findByStatus(status: string): Promise<Store[]> {
    return await this.findAll({status});
  }

  async findByType(storeType: string): Promise<Store[]> {
    return await this.findAll({store_type: storeType});
  }

  async findActiveStores(): Promise<Store[]> {
    return await this.findByStatus('active');
  }

  async findStoresByEnterprise(
    enterpriseId: string,
    status?: string,
  ): Promise<Store[]> {
    const conditions: any = {enterprise_id: enterpriseId};
    if (status) {
      conditions.status = status;
    }
    return await this.findAll(conditions);
  }

  async updateStatus(
    id: string,
    status: 'active' | 'inactive' | 'maintenance' | 'closed',
  ): Promise<Store | null> {
    return await this.update(id, {
      status,
      updated_at: new Date().toISOString(),
    });
  }

  async updateSyncStatus(
    id: string,
    syncEnabled: boolean,
  ): Promise<Store | null> {
    return await this.update(id, {
      sync_enabled: syncEnabled,
      last_sync: syncEnabled ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    });
  }

  async enableSync(id: string): Promise<Store | null> {
    return await this.updateSyncStatus(id, true);
  }

  async disableSync(id: string): Promise<Store | null> {
    return await this.updateSyncStatus(id, false);
  }

  async updateLastSync(id: string): Promise<Store | null> {
    return await this.update(id, {
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Get stores that need sync
  async getStoresNeedingSync(): Promise<Store[]> {
    return await this.findAll({sync_enabled: true});
  }

  // Override create to add timestamps
  // tự động tạo ID đúng chuẩn
  async create(data: Store): Promise<Store> {
    const id = generateUID('POS'); // tự động tạo mới
    const storeData = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await super.create(storeData);
  }

  // Override update to add updated_at timestamp
  async update(
    id: string | number | undefined,
    data: Partial<Store>,
  ): Promise<Store> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }
}

// Export singleton instance
export const storeService = new StoreService();
export default storeService;

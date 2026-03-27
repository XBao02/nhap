// EnterpriseService.ts
import {BaseService} from '../../../database';
import {generateUID} from '../../../utils';

export interface Enterprise {
  id?: string;
  name: string;
  business_type?:
    | 'hkd'
    | 'ltd'
    | 'joint_stock'
    | 'private'
    | 'partnership'
    | 'sole_proprietorship';
  industries?: any;
  address?: string;
  tax_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  subscription_plan?: 'basic' | 'premium' | 'enterprise';
  created_at?: string;
  updated_at?: string;
}

export class EnterpriseService extends BaseService {
  constructor() {
    super('core', 'enterprises');
  }

  /**
   *  Specific validation for User
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng enterprise nếu truyền vào
   * Còn nếu không thì không cần xác thực
   * */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.name && typeof data.name !== 'string') {
      throw new Error('Enterprise name is required and must be a string');
    }

    if (
      data.business_type &&
      ![
        'hkd',
        'ltd',
        'joint_stock',
        'private',
        'partnership',
        'sole_proprietorship',
      ].includes(data.business_type)
    ) {
      throw new Error('Invalid business type');
    }

    if (
      data.status &&
      !['active', 'inactive', 'suspended', 'pending'].includes(data.status)
    ) {
      throw new Error('Invalid status');
    }

    if (
      data.subscription_plan &&
      !['basic', 'premium', 'enterprise'].includes(data.subscription_plan)
    ) {
      throw new Error('Invalid subscription plan');
    }
  }

  // Enterprise-specific methods
  async findByTaxCode(taxCode: string): Promise<Enterprise | null> {
    const enterprises = await this.findAll({tax_code: taxCode});
    return enterprises.length > 0 ? enterprises[0] : null;
  }

  async findByStatus(status: string): Promise<Enterprise[]> {
    return await this.findAll({status});
  }

  async findBySubscriptionPlan(plan: string): Promise<Enterprise[]> {
    return await this.findAll({subscription_plan: plan});
  }

  async findActiveEnterprises(): Promise<Enterprise[]> {
    return await this.findByStatus('active');
  }

  async updateStatus(
    id: string,
    status: 'active' | 'inactive' | 'suspended' | 'pending',
  ): Promise<Enterprise | null> {
    return await this.update(id, {
      status,
      updated_at: new Date().toISOString(),
    });
  }

  // Override create to add timestamps
  async create(data: Enterprise): Promise<Enterprise> {
    const id = generateUID('ENT');
    const enterpriseData = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await super.create(enterpriseData);
  }

  // Override update to add updated_at timestamp
  async update(
    id: string | number | undefined,
    data: Partial<Enterprise>,
  ): Promise<Enterprise> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }
}

// Export singleton instance
export const enterpriseService = new EnterpriseService();
export default enterpriseService;

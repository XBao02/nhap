import {BaseService} from '../../../database';
import {generateUID} from '../../../utils';
import QuickCrypto from 'react-native-quick-crypto';
import SHA256 from 'crypto-js/sha256';
import * as jwt from 'react-native-pure-jwt';

export interface User {
  id?: string;
  store_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'staff' | 'cashier' | 'viewer';
  permissions?: any;
  avatar_url?: string;
  is_active?: boolean;
  last_login?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  created_at?: string;
  updated_at?: string;
}

// Safe user interface without sensitive data
export interface SafeUser
  extends Omit<
    User,
    'password_hash' | 'password_reset_token' | 'password_reset_expires'
  > {
  password_hash?: never;
  password_reset_token?: never;
  password_reset_expires?: never;
}

export class UserService extends BaseService {
  constructor() {
    super('core', 'users');
  }

  /**
   * Specific validation for User
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng user nếu truyền vào
   * Còn nếu không thì không cần xác thực
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.username && typeof data.username !== 'string') {
      throw new Error('Username is required and must be a string');
    }

    if (data.password_hash && typeof data.password_hash !== 'string') {
      throw new Error('Password hash is required and must be a string');
    }

    if (data.full_name && typeof data.full_name !== 'string') {
      throw new Error('Full name is required and must be a string');
    }

    if (
      data.role &&
      !['admin', 'manager', 'staff', 'cashier', 'viewer'].includes(data.role)
    ) {
      throw new Error('Invalid role');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    if (
      data.failed_login_attempts &&
      (typeof data.failed_login_attempts !== 'number' ||
        data.failed_login_attempts < 0)
    ) {
      throw new Error('Failed login attempts must be a non-negative number');
    }
  }

  // User-specific methods
  async findByUsername(username: string): Promise<User | null> {
    const users = await this.findAll({username});
    return users.length > 0 ? users[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll({email});
    return users.length > 0 ? users[0] : null;
  }

  async findByStoreId(storeId: string): Promise<User[]> {
    return await this.findAll({store_id: storeId});
  }

  async findByRole(role: string): Promise<User[]> {
    return await this.findAll({role});
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.findAll({is_active: true});
  }

  async findInactiveUsers(): Promise<User[]> {
    return await this.findAll({is_active: false});
  }

  async findLockedUsers(): Promise<User[]> {
    const now = new Date().toISOString();
    const allUsers = await this.findAll();
    return allUsers.filter(
      user => user.locked_until && user.locked_until > now,
    );
  }

  // Authentication related methods
  async updateLastLogin(id: string): Promise<User | null> {
    return await this.update(id, {
      last_login: new Date().toISOString(),
      failed_login_attempts: 0,
      updated_at: new Date().toISOString(),
    });
  }

  async incrementFailedLoginAttempts(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    const attempts = (user.failed_login_attempts || 0) + 1;
    const updateData: any = {
      failed_login_attempts: attempts,
      updated_at: new Date().toISOString(),
    };

    if (attempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
      updateData.locked_until = lockUntil.toISOString();
    }

    return await this.update(id, updateData);
  }

  async resetFailedLoginAttempts(id: string): Promise<User | null> {
    return await this.update(id, {
      failed_login_attempts: 0,
      locked_until: undefined,
      updated_at: new Date().toISOString(),
    });
  }

  async lockUser(
    id: string,
    lockDurationMinutes: number = 30,
  ): Promise<User | null> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + lockDurationMinutes);

    return await this.update(id, {
      locked_until: lockUntil.toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async unlockUser(id: string): Promise<User | null> {
    return await this.update(id, {
      locked_until: undefined,
      failed_login_attempts: 0,
      updated_at: new Date().toISOString(),
    });
  }

  async activateUser(id: string): Promise<User | null> {
    return await this.update(id, {
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  async deactivateUser(id: string): Promise<User | null> {
    return await this.update(id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    return await this.update(id, {
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    });
  }

  async updateRole(
    id: string,
    role: 'admin' | 'manager' | 'staff' | 'cashier' | 'viewer',
  ): Promise<User | null> {
    return await this.update(id, {
      role,
      updated_at: new Date().toISOString(),
    });
  }

  async updatePermissions(id: string, permissions: any): Promise<User | null> {
    return await this.update(id, {
      permissions,
      updated_at: new Date().toISOString(),
    });
  }

  async isUserLocked(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user || !user.locked_until) return false;

    const now = new Date();
    const lockUntil = new Date(user.locked_until);
    return lockUntil > now;
  }

  async usernameExists(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return !!user;
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    if (!identifier) return null;

    if (identifier.startsWith('USR')) {
      const user = await this.findById(identifier);
      if (user) return user;
    }

    if (identifier.includes('@')) {
      const user = await this.findByEmail(identifier);
      if (user) return user;
      return await this.findByUsername(identifier);
    }

    return await this.findByUsername(identifier);
  }

  async create(data: User): Promise<User> {
    const id = generateUID('USR');
    const userData = {
      ...data,
      id,
      is_active: data.is_active !== undefined ? data.is_active : true,
      failed_login_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await super.create(userData);
  }

  async update(id: string | number, data: Partial<User>): Promise<User> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    return await super.update(id, updateData);
  }

  // ============ NEW SECURITY METHODS ============
  /**
   * Mã hóa mật khẩu sử dụng crypto-js SHA256
   * @param password - Mật khẩu gốc
   * @returns Promise<string> - Mật khẩu đã được mã hóa
   */
  async hashPassword(password: string): Promise<string> {
    return SHA256(password).toString();
  }
  /**
   * So sánh mật khẩu với hash đã lưu
   * @param password - Mật khẩu gốc
   * @param hash - Mật khẩu đã mã hóa
   * @returns Promise<boolean> - True nếu khớp
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return SHA256(password).toString() === hash;
  }

  /**
   * Tạo JWT token sử dụng react-native-pure-jwt
   * @param user - User object
   * @returns Promise<string> - JWT token
   */
  async generateToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      store_id: user.store_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    return await jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret-key',
      {alg: 'HS256'},
    );
  }

  /**
   * Đăng nhập user với username/password
   * @param username - Tên đăng nhập hoặc email
   * @param password - Mật khẩu gốc
   * @returns Promise<LoginResult> - Kết quả đăng nhập
   */
  async login(
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    user?: SafeUser;
    token?: string;
    message?: string;
    lockUntil?: string;
  }> {
    try {
      if (!username || !password) {
        return {
          success: false,
          message: 'Username and password are required',
        };
      }

      const user = await this.findUserByIdentifier(username);

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials NU',
        };
      }

      const isLocked = await this.isUserLocked(user.id!);
      if (isLocked) {
        return {
          success: false,
          message:
            'Account is temporarily locked due to too many failed login attempts',
          lockUntil: user.locked_until,
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: 'Account is deactivated',
        };
      }

      const isPasswordValid = await this.comparePassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        await this.incrementFailedLoginAttempts(user.id!);
        return {
          success: false,
          message: 'Invalid credentials NP',
        };
      }

      await this.updateLastLogin(user.id!);
      const token = await this.generateToken(user);
      const {
        password_hash,
        password_reset_token,
        password_reset_expires,
        ...safeUser
      } = user;

      return {
        success: true,
        user: safeUser,
        token,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login',
      };
    }
  }

  /**
   * Đặt mật khẩu mới cho user
   * @param id - User ID
   * @param newPassword - Mật khẩu mới
   * @param currentPassword - Mật khẩu hiện tại (tùy chọn, dùng khi user tự đổi)
   * @returns Promise<PasswordChangeResult>
   */
  async setPassword(
    id: string,
    newPassword: string,
    currentPassword?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!newPassword) {
        return {
          success: false,
          message: 'New password is required',
        };
      }

      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      const user = await this.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (currentPassword) {
        const isCurrentPasswordValid = await this.comparePassword(
          currentPassword,
          user.password_hash,
        );
        if (!isCurrentPasswordValid) {
          return {
            success: false,
            message: 'Current password is incorrect',
          };
        }
      }

      const isSamePassword = await this.comparePassword(
        newPassword,
        user.password_hash,
      );
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password must be different from current password',
        };
      }

      const hashedPassword = await this.hashPassword(newPassword);
      await this.updatePassword(id, hashedPassword);

      if (user.failed_login_attempts && user.failed_login_attempts > 0) {
        await this.resetFailedLoginAttempts(id);
      }

      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      console.error('Set password error:', error);
      return {
        success: false,
        message: 'An error occurred while updating password',
      };
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result
   */
  private validatePasswordStrength(password: string): {
    isValid: boolean;
    message: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        message: 'Password must not exceed 128 characters',
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }

    if (!/\d/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character',
      };
    }

    return {
      isValid: true,
      message: 'Password is strong',
    };
  }

  /**
   * Tạo password reset token
   * @param email - Email của user
   * @returns Promise<ResetTokenResult>
   */
  async generatePasswordResetToken(email: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return {
          success: true,
          message: 'If email exists, reset link will be sent',
        };
      }

      const resetToken = QuickCrypto.randomBytes(32).toString('hex');
      const hashedToken = QuickCrypto.createHash('sha256')
        .update(resetToken)
        .digest('hex');

      await this.update(user.id!, {
        password_reset_token: hashedToken,
        password_reset_expires: new Date(
          Date.now() + 10 * 60 * 1000,
        ).toISOString(),
      });

      return {
        success: true,
        message: 'Password reset token generated',
        resetToken,
      };
    } catch (error) {
      console.error('Generate reset token error:', error);
      return {
        success: false,
        message: 'An error occurred while generating reset token',
      };
    }
  }

  /**
   * Reset password bằng token
   * @param token - Reset token
   * @param newPassword - Mật khẩu mới
   * @returns Promise<ResetResult>
   */
  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const hashedToken = QuickCrypto.createHash('sha256')
        .update(token)
        .digest('hex');
      const allUsers = await this.findAll();
      const user = allUsers.find(
        u =>
          u.password_reset_token === hashedToken &&
          u.password_reset_expires &&
          new Date(u.password_reset_expires) > new Date(),
      );

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      const hashedPassword = await this.hashPassword(newPassword);
      await this.update(user.id!, {
        password_hash: hashedPassword,
        password_reset_token: undefined,
        password_reset_expires: undefined,
        failed_login_attempts: 0,
        locked_until: undefined,
      });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'An error occurred while resetting password',
      };
    }
  }

  /**
   * Tạo user mới với password mã hóa
   * @param userData - Dữ liệu user
   * @param plainPassword - Mật khẩu gốc
   * @returns Promise<User>
   */
  async createUserWithPassword(
    userData: Omit<User, 'password_hash'>,
    plainPassword: string,
  ): Promise<{
    success: boolean;
    user?: SafeUser;
    message: string;
  }> {
    try {
      const passwordValidation = this.validatePasswordStrength(plainPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      if (await this.usernameExists(userData.username)) {
        return {
          success: false,
          message: 'Username already exists',
        };
      }

      if (userData.email && (await this.emailExists(userData.email))) {
        return {
          success: false,
          message: 'Email already exists',
        };
      }

      const hashedPassword = await this.hashPassword(plainPassword);
      const user = await this.create({
        ...userData,
        password_hash: hashedPassword,
      });

      const {
        password_hash,
        password_reset_token,
        password_reset_expires,
        ...safeUser
      } = user;

      return {
        success: true,
        user: safeUser,
        message: 'User created successfully',
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: 'An error occurred while creating user',
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;

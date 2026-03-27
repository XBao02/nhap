import { BaseService } from '../../../database';
import { UserSession } from './UserSessionService';

export interface DeviceInfo {
  device_type?: 'desktop' | 'mobile' | 'tablet';
  os?: string;
  browser?: string;
  app_version?: string;
  device_id?: string;
}

export interface SessionCreateData {
  user_id: string;
  store_id: string;
  session_token: string;
  refresh_token?: string;
  device_info?: DeviceInfo;
  ip_address?: string;
  user_agent?: string;
  expires_at?: string;
}

export class SessionService extends BaseService {
  constructor() {
    super('core', 'user_sessions');
    // Override primary key for this table
    this.setPrimaryKeyFields(['id']);
  }

  // Specific validation for UserSession
  protected _validateData(data: any): void {
    super._validateData(data);
    
    if (!data.user_id || typeof data.user_id !== 'string') {
      throw new Error('User ID is required and must be a string');
    }

    if (!data.store_id || typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (!data.session_token || typeof data.session_token !== 'string') {
      throw new Error('Session token is required and must be a string');
    }

    if (data.ip_address && typeof data.ip_address !== 'string') {
      throw new Error('IP address must be a string');
    }

    if (data.expires_at && !this._isValidDate(data.expires_at)) {
      throw new Error('Expires at must be a valid date');
    }

    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      throw new Error('Is active must be a boolean');
    }
  }

  private _isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  // Session-specific methods
  async createSession(data: SessionCreateData): Promise<UserSession> {
    const sessionData: UserSession = {
      ...data,
      device_info: data.device_info ? JSON.stringify(data.device_info) : undefined,
      login_time: new Date().toISOString(),
      is_active: true,
    };

    if (!sessionData.expires_at) {
      // Default session expires in 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      sessionData.expires_at = expiresAt.toISOString();
    }

    return await this.create(sessionData);
  }

  async findByToken(sessionToken: string): Promise<UserSession | null> {
    return await this.findFirst({ session_token: sessionToken });
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    return await this.findAll({ user_id: userId });
  }

  async findByStoreId(storeId: string): Promise<UserSession[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    return await this.findAll({ 
      user_id: userId, 
      is_active: true 
    });
  }

  async findActiveByStoreId(storeId: string): Promise<UserSession[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_active: true 
    });
  }

  async findActiveByUserAndStore(userId: string, storeId: string): Promise<UserSession[]> {
    return await this.findAll({ 
      user_id: userId, 
      store_id: storeId, 
      is_active: true 
    });
  }

  async findActiveSessions(): Promise<UserSession[]> {
    return await this.findAll({ is_active: true });
  }

  async validateSession(sessionToken: string): Promise<UserSession | null> {
    const session = await this.findByToken(sessionToken);
    
    if (!session) {
      return null;
    }

    if (!session.is_active) {
      return null;
    }

    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      // Session expired, deactivate it
      await this.deactivateSession(session.id!);
      return null;
    }

    return session;
  }

  async refreshSession(sessionToken: string, newExpiresAt?: string): Promise<UserSession | null> {
    const session = await this.findByToken(sessionToken);
    
    if (!session || !session.is_active) {
      return null;
    }

    const expiresAt = newExpiresAt || (() => {
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      return expires.toISOString();
    })();

    return await this.update(session.id!, { expires_at: expiresAt });
  }

  async updateRefreshToken(sessionToken: string, refreshToken: string): Promise<UserSession | null> {
    const session = await this.findByToken(sessionToken);
    
    if (!session) {
      return null;
    }

    return await this.update(session.id!, { refresh_token: refreshToken });
  }

  async deactivateSession(sessionId: number): Promise<UserSession | null> {
    return await this.update(sessionId, { 
      is_active: false,
      logout_time: new Date().toISOString()
    });
  }

  async deactivateSessionByToken(sessionToken: string): Promise<UserSession | null> {
    const session = await this.findByToken(sessionToken);
    
    if (!session) {
      return null;
    }

    return await this.deactivateSession(session.id!);
  }

  async deactivateAllUserSessions(userId: string): Promise<number> {
    const sessions = await this.findActiveByUserId(userId);
    let deactivatedCount = 0;

    await this.executeTransaction(async () => {
      for (const session of sessions) {
        await this.deactivateSession(session.id!);
        deactivatedCount++;
      }
    });

    return deactivatedCount;
  }

  async deactivateAllStoreSessions(storeId: string): Promise<number> {
    const sessions = await this.findActiveByStoreId(storeId);
    let deactivatedCount = 0;

    await this.executeTransaction(async () => {
      for (const session of sessions) {
        await this.deactivateSession(session.id!);
        deactivatedCount++;
      }
    });

    return deactivatedCount;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const currentTime = new Date().toISOString();
    const expiredSessions = await this.findAll({
      is_active: true,
      // Note: This is a simplified approach. In a real implementation,
      // you might need to use raw SQL for date comparisons
    });

    const actualExpiredSessions = expiredSessions.filter(session => 
      session.expires_at && new Date(session.expires_at) < new Date()
    );

    let cleanedCount = 0;

    await this.executeTransaction(async () => {
      for (const session of actualExpiredSessions) {
        await this.deactivateSession(session.id!);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  async deleteOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffDateString = cutoffDate.toISOString();

    const oldSessions = await this.findAll({ is_active: false });
    const sessionsToDelete = oldSessions.filter(session => 
      session.logout_time && new Date(session.logout_time) < cutoffDate
    );

    let deletedCount = 0;

    await this.executeTransaction(async () => {
      for (const session of sessionsToDelete) {
        await this.delete(session.id!);
        deletedCount++;
      }
    });

    return deletedCount;
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<UserSession[]> {
    const allSessions = await this.findAll({});
    
    return allSessions.filter(session => {
      if (!session.login_time) return false;
      const loginTime = new Date(session.login_time);
      return loginTime >= new Date(startDate) && loginTime <= new Date(endDate);
    });
  }

  async getSessionsCount(userId?: string, storeId?: string, isActive?: boolean): Promise<number> {
    const conditions: any = {};
    
    if (userId) conditions.user_id = userId;
    if (storeId) conditions.store_id = storeId;
    if (isActive !== undefined) conditions.is_active = isActive;

    return await this.count(conditions);
  }

  async getActiveSessionsCount(userId?: string, storeId?: string): Promise<number> {
    return await this.getSessionsCount(userId, storeId, true);
  }

  async getUserLoginHistory(userId: string, limit?: number): Promise<UserSession[]> {
    const options: any = {
      orderBy: [{ name: 'login_time', direction: 'DESC' }]
    };
    
    if (limit) {
      options.limit = limit;
    }

    return await this.findAll({ user_id: userId }, options);
  }

  async getStoreSessionActivity(storeId: string, limit?: number): Promise<UserSession[]> {
    const options: any = {
      orderBy: [{ name: 'login_time', direction: 'DESC' }]
    };
    
    if (limit) {
      options.limit = limit;
    }

    return await this.findAll({ store_id: storeId }, options);
  }

  async updateSessionActivity(sessionToken: string): Promise<UserSession | null> {
    const session = await this.findByToken(sessionToken);
    
    if (!session || !session.is_active) {
      return null;
    }

    // In a real implementation, you might want to track last activity time
    // For now, we'll just refresh the session
    return await this.refreshSession(sessionToken);
  }

  async getSessionStatistics(storeId?: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    averageSessionDuration: number;
  }> {
    const conditions = storeId ? { store_id: storeId } : {};
    const allSessions = await this.findAll(conditions);
    
    const totalSessions = allSessions.length;
    const activeSessions = allSessions.filter(s => s.is_active).length;
    const expiredSessions = allSessions.filter(s => 
      s.expires_at && new Date(s.expires_at) < new Date()
    ).length;

    // Calculate average session duration for completed sessions
    const completedSessions = allSessions.filter(s => s.login_time && s.logout_time);
    let totalDuration = 0;
    
    completedSessions.forEach(session => {
      if (session.login_time && session.logout_time) {
        const loginTime = new Date(session.login_time).getTime();
        const logoutTime = new Date(session.logout_time).getTime();
        totalDuration += logoutTime - loginTime;
      }
    });

    const averageSessionDuration = completedSessions.length > 0 
      ? totalDuration / completedSessions.length 
      : 0;

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      averageSessionDuration: Math.round(averageSessionDuration / 1000) // Convert to seconds
    };
  }

  // Override create to handle JSON serialization
  async create(data: UserSession): Promise<UserSession> {
    const sessionData = {
      ...data,
      device_info: data.device_info ? JSON.stringify(data.device_info) : undefined,
      login_time: data.login_time || new Date().toISOString(),
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    return await super.create(sessionData);
  }

  // Override update to handle JSON serialization
  async update(id: string | number, data: Partial<UserSession>): Promise<UserSession> {
    const updateData = {
      ...data,
      device_info: data.device_info ? JSON.stringify(data.device_info) : undefined,
    };

    return await super.update(id, updateData);
  }

  // Override findAll to handle JSON parsing
  async findAll(conditions: Record<string, any> = {}, options: any = {}): Promise<UserSession[]> {
    const sessions = await super.findAll(conditions, options);
    
    return sessions.map(session => ({
      ...session,
      device_info: session.device_info ? JSON.parse(session.device_info) : undefined
    }));
  }

  // Override findFirst to handle JSON parsing
  async findFirst(conditions: Record<string, any> = {}): Promise<UserSession | null> {
    const session = await super.findFirst(conditions);
    
    if (!session) return null;
    
    return {
      ...session,
      device_info: session.device_info ? JSON.parse(session.device_info) : undefined
    };
  }

  // Override findById to handle JSON parsing
  async findById(id: string | number): Promise<UserSession | null> {
    const session = await super.findById(id);
    
    if (!session) return null;
    
    return {
      ...session,
      device_info: session.device_info ? JSON.parse(session.device_info) : undefined
    };
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
// UserSessionService.ts
import { BaseService } from '../../../database';

export interface UserSession {
  id?: number;
  user_id: string;
  store_id: string;
  session_token: string;
  refresh_token?: string;
  device_info?: any;
  ip_address?: string;
  user_agent?: string;
  login_time?: string;
  logout_time?: string;
  expires_at?: string;
  is_active?: boolean;
}

export class UserSessionService extends BaseService {
  constructor() {
    super('core', 'user_sessions');
    // User sessions use auto-increment ID
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
  }

  // UserSession-specific methods
  async findBySessionToken(sessionToken: string): Promise<UserSession | null> {
    const sessions = await this.findAll({ session_token: sessionToken });
    return sessions.length > 0 ? sessions[0] : null;
  }

  async findByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    const sessions = await this.findAll({ refresh_token: refreshToken });
    return sessions.length > 0 ? sessions[0] : null;
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    return await this.findAll({ user_id: userId }, { 
      orderBy: [{ name: 'login_time', direction: 'DESC' }] 
    });
  }

  async findByStoreId(storeId: string): Promise<UserSession[]> {
    return await this.findAll({ store_id: storeId }, { 
      orderBy: [{ name: 'login_time', direction: 'DESC' }] 
    });
  }

  async findActiveSessions(): Promise<UserSession[]> {
    return await this.findAll({ is_active: true });
  }

  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    return await this.findAll({ 
      user_id: userId, 
      is_active: true 
    }, { 
      orderBy: [{ name: 'login_time', direction: 'DESC' }] 
    });
  }

  async findExpiredSessions(): Promise<UserSession[]> {
    const now = new Date().toISOString();
    // This would need a custom query for expires_at < now
    // For now, we'll return all sessions and filter manually
    const allSessions = await this.findAll();
    return allSessions.filter(session => 
      session.expires_at && session.expires_at < now && session.is_active
    );
  }

  // Session management methods
  async createSession(sessionData: Omit<UserSession, 'id'>): Promise<UserSession> {
    const session = {
      ...sessionData,
      login_time: new Date().toISOString(),
      is_active: true,
      // Default expiration: 24 hours from now
      expires_at: sessionData.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    return await this.create(session);
  }

  async logoutSession(sessionToken: string): Promise<boolean> {
    const session = await this.findBySessionToken(sessionToken);
    if (!session) return false;

    const updated = await this.update(session.id!, {
      is_active: false,
      logout_time: new Date().toISOString()
    });

    return !!updated;
  }

  async logoutAllUserSessions(userId: string): Promise<number> {
    const activeSessions = await this.findActiveSessionsByUserId(userId);
    let loggedOutCount = 0;

    for (const session of activeSessions) {
      const success = await this.logoutSession(session.session_token);
      if (success) loggedOutCount++;
    }

    return loggedOutCount;
  }

  async refreshSession(refreshToken: string, newExpiresAt?: string): Promise<UserSession | null> {
    const session = await this.findByRefreshToken(refreshToken);
    if (!session || !session.is_active) return null;

    const expiresAt = newExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    return await this.update(session.id!, {
      expires_at: expiresAt
    });
  }

  async updateSessionToken(oldToken: string, newToken: string): Promise<UserSession | null> {
    const session = await this.findBySessionToken(oldToken);
    if (!session) return null;

    return await this.update(session.id!, {
      session_token: newToken
    });
  }

  async updateRefreshToken(sessionToken: string, refreshToken: string): Promise<UserSession | null> {
    const session = await this.findBySessionToken(sessionToken);
    if (!session) return null;

    return await this.update(session.id!, {
      refresh_token: refreshToken
    });
  }

  async extendSession(sessionToken: string, additionalMinutes: number = 60): Promise<UserSession | null> {
    const session = await this.findBySessionToken(sessionToken);
    if (!session) return null;

    const currentExpiry = new Date(session.expires_at || Date.now());
    const newExpiry = new Date(currentExpiry.getTime() + additionalMinutes * 60 * 1000);

    return await this.update(session.id!, {
      expires_at: newExpiry.toISOString()
    });
  }

  // Validation methods
  async isSessionValid(sessionToken: string): Promise<boolean> {
    const session = await this.findBySessionToken(sessionToken);
    if (!session || !session.is_active) return false;

    if (session.expires_at) {
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      return expiresAt > now;
    }

    return true;
  }

  async isRefreshTokenValid(refreshToken: string): Promise<boolean> {
    const session = await this.findByRefreshToken(refreshToken);
    return !!(session && session.is_active);
  }

  // Cleanup methods
  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await this.findExpiredSessions();
    let cleanedCount = 0;

    for (const session of expiredSessions) {
      const success = await this.logoutSession(session.session_token);
      if (success) cleanedCount++;
    }

    return cleanedCount;
  }

  async deleteOldSessions(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    // This would need a custom query for login_time < cutoffISO
    // For now, we'll get all sessions and filter manually
    const allSessions = await this.findAll();
    const oldSessions = allSessions.filter(session => 
      session.login_time && session.login_time < cutoffISO && !session.is_active
    );

    let deletedCount = 0;
    for (const session of oldSessions) {
      const success = await this.delete(session.id!);
      if (success) deletedCount++;
    }

    return deletedCount;
  }

  // Statistics methods
  async getSessionStats(userId?: string): Promise<{
    total: number;
    active: number;
    expired: number;
    lastLogin?: string;
  }> {
    const conditions = userId ? { user_id: userId } : {};
    const allSessions = await this.findAll(conditions);
    
    const active = allSessions.filter(s => s.is_active).length;
    const expired = allSessions.filter(s => 
      s.expires_at && s.expires_at < new Date().toISOString() && s.is_active
    ).length;

    const lastLogin = allSessions
      .filter(s => s.login_time)
      .sort((a, b) => new Date(b.login_time!).getTime() - new Date(a.login_time!).getTime())
      [0]?.login_time;

    return {
      total: allSessions.length,
      active,
      expired,
      lastLogin
    };
  }
}

// Export singleton instance
export const userSessionService = new UserSessionService();
export default userSessionService;
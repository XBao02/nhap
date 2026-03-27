// utils/debugUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../configs/appConfig';
import { DatabaseManager } from '../database';
import { STORAGE_KEYS } from '../utils/storage';

export class DebugUtils {
  private static logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
  }> = [];

  static log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    if (!APP_CONFIG.DEV.ENABLE_LOGGING) return;

    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs.push(logEntry);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console output
    const logMethod = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : console.log;
    
    logMethod(`[${level.toUpperCase()}] ${message}`, data || '');
  }

  static getLogs() {
    return [...this.logs];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  static clearLogs() {
    this.logs = [];
  }

  // Debug info for support
  static async getSystemInfo() {
    const setupConfig = await AsyncStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
    const userSession = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    const dbConnections = Object.keys(DatabaseManager.getConnections());

    return {
      timestamp: new Date().toISOString(),
      appVersion: APP_CONFIG.DATABASE.VERSION,
      setupConfig: setupConfig ? JSON.parse(setupConfig) : null,
      userSession: userSession ? JSON.parse(userSession) : null,
      databaseConnections: dbConnections,
      storageKeys: await AsyncStorage.getAllKeys(),
      recentLogs: this.logs.slice(-50), // Last 50 logs
    };
  }
}

// utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {SetupConfig, UserSession} from '../types';

export const STORAGE_KEYS = {
  // New optimized keys
  SETUP_CONFIG: 'mypos.setup',
  USER_SESSION: 'mypos.currentUser',

  // Legacy keys (for migration)
  IS_SETTING: 'mypos.is_setting',
  ROLES: 'mypos.roles',
  INDUSTRIES: 'mypos.industries',
  DATABASE: 'mypos.databases',
  USER_ID: 'mypos.user_id',
  STORE_ID: 'mypos.store_id',
  ENTERPRISE_ID: 'mypos.enterprise_id',

  // Additional keys
  APP_THEME: 'mypos.theme',
  APP_LANGUAGE: 'mypos.language',
  LAST_SYNC: 'mypos.lastSync',
  PENDING_CHANGES: 'mypos.pendingChanges',
} as const;

//Storage utility
export class StorageService {
  // Save key
  static async saveKey(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('❌ Storage saveKey failed:', error);
    }
  }

  // Get key
  static async getKey(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('❌ Storage getKey failed:', error);
      return null;
    }
  }

  // Remove key
  static async removeKey(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  }

  static async migrateToNewFormat(): Promise<void> {
    try {
      console.log('🔄 Starting storage migration...');

      // Check if migration is needed
      const setupConfig = await AsyncStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
      if (setupConfig) {
        console.log('✅ New format already exists, skipping migration');
        return;
      }

      // Load old format data
      const [
        isSettingStr,
        rolesStr,
        industriesStr,
        databasesStr,
        userId,
        storeId,
        enterpriseId,
      ] = await AsyncStorage.multiGet([
        STORAGE_KEYS.IS_SETTING,
        STORAGE_KEYS.ROLES,
        STORAGE_KEYS.INDUSTRIES,
        STORAGE_KEYS.DATABASE,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.STORE_ID,
        STORAGE_KEYS.ENTERPRISE_ID,
      ]);

      const isSetting = isSettingStr[1] === 'true';

      if (isSetting) {
        // Convert to new setup config format
        const roles = JSON.parse(rolesStr[1] || '[]');
        const industries = JSON.parse(industriesStr[1] || '[]');
        const databases = JSON.parse(databasesStr[1] || '[]');

        const newSetupConfig: SetupConfig = {
          installed: true,
          field: industries[0] || 'fnb', // Default to F&B
          role: roles[0] || 'owner', // Default to owner
          databaseList: databases,
          version: '1.0.0',
          setupDate: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          STORAGE_KEYS.SETUP_CONFIG,
          JSON.stringify(newSetupConfig),
        );

        // Convert user session if exists
        if (userId[1] && enterpriseId[1]) {
          const newUserSession: UserSession = {
            userId: userId[1],
            storeId: storeId[1] || '',
            enterpriseId: enterpriseId[1],
            roles: roles,
            lastLogin: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 7 days
          };

          await AsyncStorage.setItem(
            STORAGE_KEYS.USER_SESSION,
            JSON.stringify(newUserSession),
          );
        }

        console.log('✅ Storage migration completed successfully');
      }
    } catch (error) {
      console.error('❌ Storage migration failed:', error);
      // Don't throw error, let app continue with current format
    }
  }
}

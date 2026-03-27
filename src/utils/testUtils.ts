// utils/testUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/storage';
import { DatabaseManager } from '../database';
export class TestUtils {
  // Mock setup for testing
  static async setupMockInitialization(scenario: 'fresh' | 'setup_only' | 'with_user' | 'complete') {
    await AsyncStorage.clear();

    switch (scenario) {
      case 'fresh':
        // No data, fresh install
        break;

      case 'setup_only':
        await AsyncStorage.setItem(STORAGE_KEYS.SETUP_CONFIG, JSON.stringify({
          installed: true,
          field: 'fnb',
          role: 'owner',
          databaseList: ['core', 'fnb', 'pos'],
          version: '1.0.0',
          setupDate: new Date().toISOString(),
        }));
        break;

      case 'with_user':
        await this.setupMockInitialization('setup_only');
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify({
          userId: 'test-user-123',
          storeId: 'test-store-456',
          enterpriseId: 'test-enterprise-789',
          roles: ['owner'],
          lastLogin: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        break;

      case 'complete':
        await this.setupMockInitialization('with_user');
        // Mock database connections
        break;
    }
  }

  // Mock error scenarios
  static async simulateError(errorType: 'storage' | 'database' | 'network') {
    switch (errorType) {
      case 'storage':
        // Mock AsyncStorage failure
        jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('Storage error'));
        break;

      case 'database':
        // Mock database failure
        jest.spyOn(DatabaseManager, 'openAllExisting').mockRejectedValue(new Error('Database error'));
        break;

      case 'network':
        // Mock network failure (for future cloud sync)
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        break;
    }
  }

  // Reset mocks
  static resetMocks() {
    jest.restoreAllMocks();
  }

  // Performance testing
  static async measureInitializationTime(): Promise<number> {
    const start = Date.now();
    
    // Run initialization
    const { checkInitialization } = require('../hooks/useAppInitialization');
    await checkInitialization();
    
    const end = Date.now();
    return end - start;
  }
}

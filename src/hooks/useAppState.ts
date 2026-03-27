// hooks/useAppState.ts
import {useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {DatabaseManager} from '../database';

export const useAppState = () => {
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log(
          '[DatabaseManager] App is in background or inactive, closing all database connections...',
        );
        try {
          await DatabaseManager.closeAll();
        } catch (error) {
          console.error(
            '[DatabaseManager] App Failed to close databases:',
            error,
          );
        }
      } else if (nextAppState === 'active') {
        console.log(
          '[DatabaseManager] App is active, reopening database connections...',
        );
        try {
          await DatabaseManager.reopenConnections();
        } catch (error) {
          console.error(
            '[DatabaseManager] App Failed to reopen databases:',
            error,
          );
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isAppState: true,
    userRoles: ['owner'],
    isAuthenticated: true,
  };
};

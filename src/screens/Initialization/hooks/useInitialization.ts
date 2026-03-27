import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLanguage} from '../../../i18n';
import {useNavigateTo} from '../../../hooks/useNaviageTo';
import {STORAGE_KEYS} from '../../../utils/storage';
import {DatabaseManager} from '../../../database';
import {
  InitializationState,
  AppError,
  SetupConfig,
  UserSession,
} from '../../../types';

// ==================== CONSTANTS ====================

const INITIALIZATION_STEPS = {
  CHECK_SETUP: 'check_setup',
  VALIDATE_SESSION: 'validate_session',
  OPEN_DATABASES: 'open_databases',
  NAVIGATE_TO_SCREEN: 'navigate_to_screen',
} as const;

const DEFAULT_STATE: InitializationState = {
  setupConfig: null,
  userSession: null,
  databaseConnections: [],
  isDatabaseReady: false,
  isLoading: false,
  isCheckingSetup: false,
  isOpeningDatabases: false,
  isValidatingSession: false,
  error: null,
};

// ==================== SERVICES ====================

class InitializationService {
  // Load setup configuration from AsyncStorage
  static async loadSetupConfig(): Promise<SetupConfig | null> {
    console.log(
      `[InitializationService][loadSetupConfig] Loading setup configuration from AsyncStorage`,
    );
    try {
      const setupData = await AsyncStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
      console.log(
        `[InitializationService][loadSetupConfig] Setup data retrieved: ${
          setupData ? 'found' : 'null'
        }`,
      );
      if (!setupData) return null;

      const config = JSON.parse(setupData) as SetupConfig;
      console.log(
        `[InitializationService][loadSetupConfig] Parsed config:`,
        config,
      );

      // Validate setup config structure
      if (!config.installed || !config.field || !config.databaseList?.length) {
        console.error(
          `[InitializationService][loadSetupConfig] Invalid setup configuration structure`,
        );
        throw new Error('Invalid setup configuration');
      }

      return config;
    } catch (error) {
      console.error(
        `[InitializationService][loadSetupConfig] Error loading setup config:`,
        (error as Error).stack,
      );
      throw error as AppError;
    }
  }

  // Load user session from AsyncStorage
  static async loadUserSession(): Promise<UserSession | null> {
    console.log(
      `[InitializationService][loadUserSession] Loading user session from AsyncStorage`,
    );
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      console.log(
        `[InitializationService][loadUserSession] Session data retrieved: ${
          sessionData ? 'found' : 'null'
        }`,
      );
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as UserSession;
      console.log(
        `[InitializationService][loadUserSession] Parsed session:`,
        session,
      );

      // Check if session is expired
      if (!session.userId || new Date(session.expiresAt) < new Date()) {
        console.log(
          `[InitializationService][loadUserSession] Session invalid or expired, removing from AsyncStorage`,
        );
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
        return null;
      }

      return session;
    } catch (error) {
      console.error(
        `[InitializationService][loadUserSession] Error loading user session:`,
        (error as Error).stack,
      );
      throw error as AppError;
    }
  }

  // Load database schemaConfigurations from AsyncStorage
  static async loadDatabaseSchemaConfigurations(): Promise<string[] | null> {
    console.log(
      `[InitializationService][loadDatabaseSchemaConfigurations] Loading database schema configurations from AsyncStorage`,
    );
    try {
      const schemaConfigurations = await AsyncStorage.getItem(
        STORAGE_KEYS.DATABASE,
      );
      console.log(
        `[InitializationService][loadDatabaseSchemaConfigurations] Schema configurations retrieved: ${
          schemaConfigurations ? 'found' : 'null'
        }`,
      );
      if (!schemaConfigurations) return null;

      const databases = JSON.parse(schemaConfigurations) || [];
      console.log(
        `[InitializationService][loadDatabaseSchemaConfigurations] Parsed databases:`,
        databases,
      );

      // Validate core database
      if (!Array.isArray(databases) || !databases.includes('core')) {
        console.error(
          `[InitializationService][loadDatabaseSchemaConfigurations] Invalid database schema configurations`,
        );
        throw new Error('Invalid database schema configurations');
      }
      return databases;
    } catch (error) {
      console.error(
        `[InitializationService][loadDatabaseSchemaConfigurations] Error loading schema configurations:`,
        (error as Error).stack,
      );
      throw error as AppError;
    }
  }

  // Initialize databases based on setup config
  static async initializeDatabases(databaseList: string[]): Promise<string[]> {
    console.log(
      `[InitializationService][initializeDatabases] Initializing databases:`,
      databaseList,
    );
    try {
      const openConnections = Object.keys(DatabaseManager.getConnections());
      console.log(
        `[InitializationService][initializeDatabases] Current open connections:`,
        openConnections,
      );

      if (openConnections.length === 0) {
        // ✅ Chỉ mở core
        console.log(
          `[InitializationService][initializeDatabases] Opening ONLY core database`,
        );
        await DatabaseManager.initializeCoreConnection();

        // Verify databases are properly opened
        const newConnections = Object.keys(DatabaseManager.getConnections());
        console.log(
          `[InitializationService][initializeDatabases] New connections opened:`,
          newConnections,
        );
        if (newConnections.length === 0) {
          console.error(
            `[InitializationService][initializeDatabases] Failed to open any database connections`,
          );
          throw new Error('Failed to open any database connections');
        }

        return newConnections;
      }

      return openConnections;
    } catch (error) {
      console.error(
        `[InitializationService][initializeDatabases] Database initialization error:`,
        (error as Error).stack,
      );
      throw error as AppError;
    }
  }

  // Determine navigation target based on app state
  static determineNavigationTarget(
    setupConfig: SetupConfig | null,
    userSession: UserSession | null,
    isDatabaseReady: boolean,
  ): {screen: string; params?: any} {
    console.log(
      `[InitializationService][determineNavigationTarget] Determining navigation target`,
      {
        setupConfig: !!setupConfig,
        userSession: !!userSession,
        isDatabaseReady,
      },
    );

    // No setup config or database not ready -> go to initial setup
    if (!setupConfig || !isDatabaseReady) {
      console.log(
        `[InitializationService][determineNavigationTarget] Navigating to SetupDatabase (no setup or database not ready)`,
      );
      return {screen: 'SetupDatabase'};
    }

    // If session is expired or not present -> go to login
    if (!userSession || ValidationService.isSessionExpired(userSession)) {
      console.log(
        `[InitializationService][determineNavigationTarget] Navigating to Login (no valid session)`,
      );
      return {screen: 'Login'};
    }

    // Valid session -> go to main app
    console.log(
      `[InitializationService][determineNavigationTarget] Navigating to Main with userId and storeId`,
    );
    return {
      screen: 'Main',
      params: {
        userId: userSession.userId,
        storeId: userSession.storeId,
      },
    };
  }
}

// ==================== VALIDATION UTILITIES ====================

class ValidationService {
  static validateSetupConfig(config: any): config is SetupConfig {
    console.log(
      `[ValidationService][validateSetupConfig] Validating setup config`,
    );
    const isValid =
      config &&
      typeof config.installed === 'boolean' &&
      typeof config.field === 'string' &&
      typeof config.role === 'string' &&
      Array.isArray(config.databaseList) &&
      config.databaseList.length > 0;
    console.log(
      `[ValidationService][validateSetupConfig] Validation result: ${isValid}`,
    );
    return isValid;
  }

  static validateUserSession(session: any): session is UserSession {
    console.log(
      `[ValidationService][validateUserSession] Validating user session`,
    );
    const isValid =
      session &&
      typeof session.userId === 'string' &&
      typeof session.enterpriseId === 'string' &&
      Array.isArray(session.roles);
    console.log(
      `[ValidationService][validateUserSession] Validation result: ${isValid}`,
    );
    return isValid;
  }

  static isSessionExpired(session: UserSession | null): boolean {
    console.log(
      `[ValidationService][isSessionExpired] Checking if session is expired`,
    );
    if (!session) {
      console.log(
        `[ValidationService][isSessionExpired] No session provided, considered expired`,
      );
      return true;
    }
    if (!session.expiresAt) {
      console.log(
        `[ValidationService][isSessionExpired] No expiresAt in session, considered expired`,
      );
      return true;
    }
    const isExpired = new Date(session.expiresAt) < new Date();
    console.log(
      `[ValidationService][isSessionExpired] Session expiration check: ${isExpired}`,
    );
    return isExpired;
  }
}

// ==================== MAIN HOOK ====================

export const useInitialization = () => {
  console.log(`[useInitialization][hook] Initializing useInitialization hook`);
  const {t} = useLanguage();
  const {navigateTo} = useNavigateTo();
  console.log(
    `[useInitialization][hook] Hooks initialized: useLanguage, useNavigateTo`,
  );
  const [state, setState] = useState<InitializationState>(DEFAULT_STATE);
  console.log(`[useInitialization][hook] Initial state set:`, DEFAULT_STATE);

  // Update state helper
  const updateState = useCallback((updates: Partial<InitializationState>) => {
    console.log(
      `[useInitialization][updateState] Updating state with:`,
      updates,
    );
    setState(prev => {
      const newState = {...prev, ...updates};
      console.log(`[useInitialization][updateState] New state:`, newState);
      return newState;
    });
  }, []);

  // Error handler
  const handleError = useCallback(
    (error: any, step: string) => {
      console.error(
        `[useInitialization][handleError] Error at step ${step}:`,
        (error as Error).stack,
      );
      let appError: AppError = {
        type: step as 'UNKNOWN',
        message: error?.message || t('error.initialization_failed'),
        details: {step, originalError: error},
      };
      console.log(
        `[useInitialization][handleError] Setting error state:`,
        appError,
      );
      updateState({
        error: appError,
        isLoading: false,
        isCheckingSetup: false,
        isOpeningDatabases: false,
        isValidatingSession: false,
      });
    },
    [t, updateState],
  );

  const loadStorage = useCallback(async () => {
    console.log(`[useInitialization][loadStorage] Starting storage load`);
    updateState({
      isLoading: true,
      error: null,
      isCheckingSetup: true,
    });

    try {
      // Step 1: Load setup configuration
      console.log(
        `[useInitialization][loadStorage] Step 1: Loading setup configuration`,
      );
      const setupConfig = await InitializationService.loadSetupConfig();
      console.log(
        `[useInitialization][loadStorage] Setup config loaded:`,
        setupConfig,
      );
      updateState({
        setupConfig,
        isCheckingSetup: false,
        isValidatingSession: true,
      });

      // Step 2: Load user session (if setup exists)
      console.log(
        `[useInitialization][loadStorage] Step 2: Loading user session`,
      );
      let userSession: UserSession | null = null;
      if (setupConfig) {
        userSession = await InitializationService.loadUserSession();
        console.log(
          `[useInitialization][loadStorage] User session loaded:`,
          userSession,
        );
      }
      updateState({
        userSession,
        isValidatingSession: false,
        isOpeningDatabases: true,
      });

      // Step 3: Initialize databases (if setup exists)
      console.log(
        `[useInitialization][loadStorage] Step 3: Loading database schema configurations`,
      );
      let databaseConnections: string[] = [];
      let isDatabaseReady = false;

      let databaseConfigurations =
        await InitializationService.loadDatabaseSchemaConfigurations();
      console.log(
        `[useInitialization][loadStorage] Database configurations loaded:`,
        databaseConfigurations,
      );

      if (databaseConfigurations?.includes('core')) {
        console.log(
          `[useInitialization][loadStorage] Core database found, setting isDatabaseReady to true`,
        );
        isDatabaseReady = true;
      }

      // Initialize databases
      if (databaseConfigurations) {
        databaseConnections = await InitializationService.initializeDatabases(
          databaseConfigurations,
        );
        console.log(
          `[useInitialization][loadStorage] Database connections initialized:`,
          databaseConnections,
        );
      }

      // Update state with all information
      updateState({
        databaseConnections,
        isDatabaseReady,
        isOpeningDatabases: false,
        isLoading: false,
      });

      // Step 4: Auto-determine navigation
      console.log(
        `[useInitialization][loadStorage] Step 4: Auto-determining navigation`,
      );
      const navigationTarget = InitializationService.determineNavigationTarget(
        setupConfig,
        userSession,
        isDatabaseReady,
      );
      console.log(
        `[useInitialization][loadStorage] Navigation target:`,
        navigationTarget,
      );

      // Navigate to determined screen
      if (navigationTarget.params) {
        console.log(
          `[useInitialization][loadStorage] Navigating with params:`,
          navigationTarget.params,
        );
        navigateTo.navigate(navigationTarget.screen, navigationTarget.params);
      } else {
        console.log(
          `[useInitialization][loadStorage] Navigating to: ${navigationTarget.screen}`,
        );
        navigateTo.navigate(navigationTarget.screen);
      }
    } catch (error) {
      console.error(
        `[useInitialization][loadStorage] Error during storage load:`,
        (error as Error).stack,
      );
      handleError(error, INITIALIZATION_STEPS.CHECK_SETUP);
    }
  }, [updateState, handleError, navigateTo]);

  // Check initialization manually
  const checkInitialization = useCallback(async () => {
    console.log(
      `[useInitialization][checkInitialization] Starting manual initialization check`,
    );
    try {
      updateState({isLoading: true});
      console.log(`[useInitialization][checkInitialization] Current state:`, {
        setupConfig: state.setupConfig,
        userSession: state.userSession,
        isDatabaseReady: state.isDatabaseReady,
      });

      const navigationTarget = InitializationService.determineNavigationTarget(
        state.setupConfig,
        state.userSession,
        state.isDatabaseReady,
      );
      console.log(
        `[useInitialization][checkInitialization] Navigation target:`,
        navigationTarget,
      );

      // Navigate to determined screen
      if (navigationTarget.params) {
        console.log(
          `[useInitialization][checkInitialization] Navigating with params:`,
          navigationTarget.params,
        );
        navigateTo.navigate(navigationTarget.screen, navigationTarget.params);
      } else {
        console.log(
          `[useInitialization][checkInitialization] Navigating to: ${navigationTarget.screen}`,
        );
        navigateTo.navigate(navigationTarget.screen);
      }

      updateState({isLoading: false});
    } catch (error) {
      console.error(
        `[useInitialization][checkInitialization] Error during manual check:`,
        (error as Error).stack,
      );
      handleError(error, INITIALIZATION_STEPS.CHECK_SETUP);
    }
  }, [
    state.setupConfig,
    state.userSession,
    state.isDatabaseReady,
    updateState,
    handleError,
    navigateTo,
  ]);

  // Navigate to appropriate screen
  const navigateToAppropriateScreen = useCallback(() => {
    console.log(
      `[useInitialization][navigateToAppropriateScreen] Starting navigation to appropriate screen`,
    );
    setState(currentState => {
      console.log(
        `[useInitialization][navigateToAppropriateScreen] Current state:`,
        {
          setupConfig: currentState.setupConfig,
          userSession: currentState.userSession,
          isDatabaseReady: currentState.isDatabaseReady,
        },
      );

      const navigationTarget = InitializationService.determineNavigationTarget(
        currentState.setupConfig,
        currentState.userSession,
        currentState.isDatabaseReady,
      );
      console.log(
        `[useInitialization][navigateToAppropriateScreen] Navigation target:`,
        navigationTarget,
      );

      // Navigate
      if (navigationTarget.params) {
        console.log(
          `[useInitialization][navigateToAppropriateScreen] Navigating with params:`,
          navigationTarget.params,
        );
        navigateTo.navigate(navigationTarget.screen, navigationTarget.params);
      } else {
        console.log(
          `[useInitialization][navigateToAppropriateScreen] Navigating to: ${navigationTarget.screen}`,
        );
        navigateTo.navigate(navigationTarget.screen);
      }

      // Return state unchanged
      return currentState;
    });
  }, [navigateTo]);

  // Retry initialization
  const retryInitialization = useCallback(() => {
    console.log(
      `[useInitialization][retryInitialization] Retrying initialization`,
    );
    loadStorage();
  }, [loadStorage]);

  // Reset initialization (for debugging)
  const resetInitialization = useCallback(async () => {
    console.log(
      `[useInitialization][resetInitialization] Resetting initialization`,
    );
    try {
      console.log(
        `[useInitialization][resetInitialization] Removing AsyncStorage keys`,
      );
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SETUP_CONFIG,
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.IS_SETTING,
        STORAGE_KEYS.ROLES,
        STORAGE_KEYS.INDUSTRIES,
        STORAGE_KEYS.DATABASE,
      ]);

      console.log(
        `[useInitialization][resetInitialization] Closing all database connections`,
      );
      DatabaseManager.closeAll();

      console.log(
        `[useInitialization][resetInitialization] Resetting state to default`,
      );
      setState(DEFAULT_STATE);

      console.log(
        `[useInitialization][resetInitialization] Initialization reset completed`,
      );
    } catch (error) {
      console.error(
        `[useInitialization][resetInitialization] Error resetting initialization:`,
        (error as Error).stack,
      );
    }
  }, []);

  // Get initialization progress
  const getInitializationProgress = useCallback(() => {
    console.log(
      `[useInitialization][getInitializationProgress] Calculating initialization progress`,
    );
    const steps = [
      {key: 'setup', done: !!state.setupConfig, loading: state.isCheckingSetup},
      {
        key: 'session',
        done: !!state.userSession,
        loading: state.isValidatingSession,
      },
      {
        key: 'database',
        done: state.isDatabaseReady,
        loading: state.isOpeningDatabases,
      },
    ];
    const completedSteps = steps.filter(step => step.done).length;
    const totalSteps = steps.length;
    const progress = (completedSteps / totalSteps) * 100;
    const currentStep = steps.find(step => step.loading)?.key || 'completed';
    console.log(
      `[useInitialization][getInitializationProgress] Progress: ${Math.round(
        progress,
      )}%, Current step: ${currentStep}`,
    );
    return {
      progress: Math.round(progress),
      currentStep,
      steps,
    };
  }, [state]);

  // Auto load storage on mount
  useEffect(() => {
    console.log(`[useInitialization][useEffect] Auto-loading storage on mount`);
    loadStorage();
  }, [loadStorage]);

  console.log(`[useInitialization][hook] Returning initialization hook data`);
  return {
    // State
    ...state,

    // Actions
    checkInitialization,
    retryInitialization,
    resetInitialization,
    navigateToAppropriateScreen,

    // Computed
    progress: getInitializationProgress(),

    // Helpers
    isReady: state.setupConfig !== null && state.isDatabaseReady,
    hasValidSession: state.userSession !== null,
    needsSetup: state.setupConfig === null,
  };
};

import {AppState, AppStateStatus} from 'react-native';
import RNFS from 'react-native-fs';
import {DatabaseFactory} from './DatabaseFactory';
import SQLiteDAO, {
  ImportOptions,
  ImportResult,
  ColumnMapping,
} from './SQLiteDAO';
import {schemaConfigurations} from './schemas';

export type DatabaseConnections = {
  [key: string]: SQLiteDAO;
};

export interface RoleConfig {
  roleName: string;
  requiredDatabases: string[];
  optionalDatabases?: string[];
  priority?: number;
}

export type RoleRegistry = {
  [roleName: string]: RoleConfig;
};

export interface DatabaseImportConfig {
  databaseKey: string;
  tableName: string;
  data: Record<string, any>[];
  options?: Partial<ImportOptions>;
  columnMappings?: ColumnMapping[];
}

export interface BulkImportResult {
  totalDatabases: number;
  successDatabases: number;
  results: Record<string, ImportResult>;
  errors: Record<string, Error>;
  executionTime: number;
}

export class DatabaseManager {
  private static appStateListener: any = null;
  private static maxConnections = 10;
  private static connections: DatabaseConnections = {};
  private static isInitialized = false;
  private static roleRegistry: RoleRegistry = {};
  private static currentRole: string | null = null;
  private static currentUserRoles: string[] = [];
  // Thêm biến để theo dõi các database đã được sử dụng
  private static activeDatabases: Set<string> = new Set();
  private static isClosingConnections = false; // Thêm flag để tránh multiple close
  private static setupListenerLock = false; // Lock cho setupAppStateListener
  // Fix 1: Thêm event system cho DatabaseManager
  private static eventListeners: Map<string, Array<(dao: SQLiteDAO) => void>> =
    new Map();

  // Đăng ký listener khi database reconnect
  public static onDatabaseReconnect(
    schemaName: string,
    callback: (dao: SQLiteDAO) => void,
  ): void {
    console.log(
      `[DatabaseManager][onDatabaseReconnect] Registering reconnect listener for schema: ${schemaName}`,
    );

    if (!this.eventListeners.has(schemaName)) {
      this.eventListeners.set(schemaName, []);
    }

    this.eventListeners.get(schemaName)!.push(callback);
  }

  // Hủy đăng ký listener
  public static offDatabaseReconnect(
    schemaName: string,
    callback: (dao: SQLiteDAO) => void,
  ): void {
    console.log(
      `[DatabaseManager][offDatabaseReconnect] Removing reconnect listener for schema: ${schemaName}`,
    );

    const listeners = this.eventListeners.get(schemaName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Thông báo khi database reconnect
  private static notifyDatabaseReconnect(
    schemaName: string,
    dao: SQLiteDAO,
  ): void {
    console.log(
      `[DatabaseManager][notifyDatabaseReconnect] Notifying listeners for schema: ${schemaName}`,
    );

    const listeners = this.eventListeners.get(schemaName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(dao);
          console.log(
            `[DatabaseManager][notifyDatabaseReconnect] Listener notified for schema: ${schemaName}`,
          );
        } catch (error) {
          console.error(
            `[DatabaseManager][notifyDatabaseReconnect] Error in listener for schema ${schemaName}:`,
            error,
          );
        }
      });
    }
  }

  public static registerRole(roleConfig: RoleConfig): void {
    console.log(
      `[DatabaseManager][registerRole] Registering role: ${
        roleConfig.roleName
      }, config: ${JSON.stringify(roleConfig)}`,
    );
    this.roleRegistry[roleConfig.roleName] = roleConfig;
    console.log(
      `[DatabaseManager][registerRole] Role '${roleConfig.roleName}' registered successfully`,
    );
  }

  public static registerRoles(roleConfigs: RoleConfig[]): void {
    console.log(
      `[DatabaseManager][registerRoles] Registering ${roleConfigs.length} roles`,
    );
    roleConfigs.forEach(config => this.registerRole(config));
    console.log(
      `[DatabaseManager][registerRoles] All roles registered successfully`,
    );
  }

  public static getRegisteredRoles(): RoleRegistry {
    console.log(
      `[DatabaseManager][getRegisteredRoles] Retrieving registered roles`,
    );
    const roles = {...this.roleRegistry};
    console.log(
      `[DatabaseManager][getRegisteredRoles] Retrieved roles: ${JSON.stringify(
        Object.keys(roles),
      )}`,
    );
    return roles;
  }

  public static getRoleDatabases(roleName: string): string[] {
    console.log(
      `[DatabaseManager][getRoleDatabases] Getting databases for role: ${roleName}`,
    );
    const roleConfig = this.roleRegistry[roleName];
    if (!roleConfig) {
      console.error(
        `[DatabaseManager][getRoleDatabases] Role '${roleName}' not found`,
      );
      throw new Error(`Role '${roleName}' is not registered.`);
    }
    const databases = [
      ...roleConfig.requiredDatabases,
      ...(roleConfig.optionalDatabases || []),
    ];
    console.log(
      `[DatabaseManager][getRoleDatabases] Databases for role ${roleName}: ${databases.join(
        ', ',
      )}`,
    );
    return databases;
  }

  public static getCurrentUserDatabases(): string[] {
    console.log(
      `[DatabaseManager][getCurrentUserDatabases] Getting databases for current user roles: ${this.currentUserRoles.join(
        ', ',
      )}`,
    );
    const allDatabases = new Set<string>();
    allDatabases.add('core');
    for (const roleName of this.currentUserRoles) {
      const roleConfig = this.roleRegistry[roleName];
      if (roleConfig) {
        roleConfig.requiredDatabases.forEach(db => allDatabases.add(db));
        if (roleConfig.optionalDatabases) {
          roleConfig.optionalDatabases.forEach(db => allDatabases.add(db));
        }
      }
    }
    const databases = Array.from(allDatabases);
    console.log(
      `[DatabaseManager][getCurrentUserDatabases] Current user databases: ${databases.join(
        ', ',
      )}`,
    );
    return databases;
  }

  public static async initializeCoreConnection(): Promise<void> {
    console.log(
      `[DatabaseManager][initializeCoreConnection] Initializing core database connection`,
    );
    if (this.connections['core']) {
      console.log(
        `[DatabaseManager][initializeCoreConnection] Core database already connected`,
      );
      return;
    }
    try {
      if (!schemaConfigurations['core']) {
        throw new Error(
          'Core database schema not found in schemaConfigurations.',
        );
      }
      // const dao = await DatabaseFactory.openExisting('core');
      const dao = await DatabaseFactory.createOrOpen({ config: schemaConfigurations['core'] }, false)

      await dao.runSql('PRAGMA integrity_check');
      this.connections['core'] = dao;
      console.log(
        `[DatabaseManager][initializeCoreConnection] Core database connection established successfully`,
      );
    } catch (error) {
      console.error(
        `[DatabaseManager][initializeCoreConnection] Error initializing core database:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async setCurrentUserRoles(
    userRoles: string[],
    primaryRole?: string,
  ): Promise<void> {
    console.log(
      `[DatabaseManager][setCurrentUserRoles] Setting user roles: ${userRoles.join(
        ', ',
      )}, primaryRole: ${primaryRole || 'none'}`,
    );
    for (const roleName of userRoles) {
      if (!this.roleRegistry[roleName]) {
        console.error(
          `[DatabaseManager][setCurrentUserRoles] Role '${roleName}' not registered`,
        );
        throw new Error(
          `Role '${roleName}' is not registered. Please register it first.`,
        );
      }
    }
    const previousRoles = [...this.currentUserRoles];
    this.currentUserRoles = userRoles;
    this.currentRole = primaryRole || userRoles[0] || null;
    console.log(
      `[DatabaseManager][setCurrentUserRoles] User roles set successfully, primary role: ${this.currentRole}`,
    );
    await this.initializeUserRoleConnections();
    await this.cleanupUnusedConnections(previousRoles);
    console.log(
      `[DatabaseManager][setCurrentUserRoles] Role connections initialized and unused connections cleaned up`,
    );
  }

  public static getCurrentUserRoles(): string[] {
    console.log(
      `[DatabaseManager][getCurrentUserRoles] Retrieving current user roles`,
    );
    const roles = [...this.currentUserRoles];
    console.log(
      `[DatabaseManager][getCurrentUserRoles] Current user roles: ${roles.join(
        ', ',
      )}`,
    );
    return roles;
  }

  public static getCurrentRole(): string | null {
    console.log(
      `[DatabaseManager][getCurrentRole] Retrieving current primary role: ${this.currentRole}`,
    );
    return this.currentRole;
  }

  private static async initializeUserRoleConnections(): Promise<void> {
    console.log(
      `[DatabaseManager][initializeUserRoleConnections] Initializing connections for user roles: ${this.currentUserRoles.join(
        ', ',
      )}`,
    );
    const requiredDatabases = this.getCurrentUserDatabases();
    const startTime = Date.now();
    console.log(
      `[DatabaseManager][initializeUserRoleConnections] Required databases: ${requiredDatabases.join(
        ', ',
      )}`,
    );
    const failedInitializations: {key: string; error: Error}[] = [];
    const initPromises = requiredDatabases.map(async dbKey => {
      if (this.connections[dbKey]) {
        console.log(
          `[DatabaseManager][initializeUserRoleConnections] Database '${dbKey}' already connected, skipping`,
        );
        return;
      }
      try {
        console.log(
          `[DatabaseManager][initializeUserRoleConnections] Initializing database '${dbKey}'`,
        );
        if (!schemaConfigurations[dbKey]) {
          throw new Error(
            `Database key '${dbKey}' not found in schemaConfigurations.`,
          );
        }
        // const dao = await DatabaseFactory.openExisting(dbKey);
        const dao = await DatabaseFactory.createOrOpen({ config: schemaConfigurations[dbKey] }, false)

        await dao.runSql('PRAGMA integrity_check');
        this.connections[dbKey] = dao;
        console.log(
          `[DatabaseManager][initializeUserRoleConnections] Database '${dbKey}' initialized successfully`,
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[DatabaseManager][initializeUserRoleConnections] Error initializing database '${dbKey}':`,
          err.stack,
        );
        const isRequired = this.currentUserRoles.some(roleName => {
          const roleConfig = this.roleRegistry[roleName];
          return roleConfig && roleConfig.requiredDatabases.includes(dbKey);
        });
        if (isRequired) {
          failedInitializations.push({key: dbKey, error: err});
        } else {
          console.warn(
            `[DatabaseManager][initializeUserRoleConnections] Optional database '${dbKey}' failed to initialize, continuing`,
          );
        }
      }
    });
    await Promise.all(initPromises);
    if (failedInitializations.length > 0) {
      const errorSummary = failedInitializations
        .map(f => `  - ${f.key}: ${f.error.message}`)
        .join('\n');
      console.error(
        `[DatabaseManager][initializeUserRoleConnections] Failed to initialize required databases:\n${errorSummary}`,
      );
      throw new Error(
        `Failed to initialize required databases for user roles:\n${errorSummary}`,
      );
    }
    console.log(
      `[DatabaseManager][initializeUserRoleConnections] User role connections initialized in ${
        Date.now() - startTime
      }ms`,
    );
  }

  private static async cleanupUnusedConnections(
    previousRoles: string[],
  ): Promise<void> {
    console.log(
      `[DatabaseManager][cleanupUnusedConnections] Cleaning up unused connections, previous roles: ${previousRoles.join(
        ', ',
      )}`,
    );
    const previousDatabases = new Set<string>();
    previousDatabases.add('core');
    for (const roleName of previousRoles) {
      const roleConfig = this.roleRegistry[roleName];
      if (roleConfig) {
        roleConfig.requiredDatabases.forEach(db => previousDatabases.add(db));
        if (roleConfig.optionalDatabases) {
          roleConfig.optionalDatabases.forEach(db => previousDatabases.add(db));
        }
      }
    }
    const currentDatabases = new Set(this.getCurrentUserDatabases());
    const databasesToClose = Array.from(previousDatabases).filter(
      db => !currentDatabases.has(db),
    );
    if (databasesToClose.length > 0) {
      console.log(
        `[DatabaseManager][cleanupUnusedConnections] Closing unused databases: ${databasesToClose.join(
          ', ',
        )}`,
      );
      for (const dbKey of databasesToClose) {
        if (this.connections[dbKey]) {
          try {
            await this.connections[dbKey].close();
            delete this.connections[dbKey];
            console.log(
              `[DatabaseManager][cleanupUnusedConnections] Closed connection for database '${dbKey}'`,
            );
          } catch (error) {
            console.error(
              `[DatabaseManager][cleanupUnusedConnections] Error closing connection for database '${dbKey}':`,
              error as Error,
            );
          }
        }
      }
    }
    console.log(
      `[DatabaseManager][cleanupUnusedConnections] Cleanup completed`,
    );
  }

  public static hasAccessToDatabase(dbKey: string): boolean {
    console.log(
      `[DatabaseManager][hasAccessToDatabase] Checking access to database '${dbKey}' for roles: ${this.currentUserRoles.join(
        ', ',
      )}`,
    );
    const allowedDatabases = this.getCurrentUserDatabases();
    const hasAccess = true; // Temporarily bypass permission check
    console.log(
      `[DatabaseManager][hasAccessToDatabase] Access to '${dbKey}': ${hasAccess}`,
    );
    return hasAccess;
  }

  public static get(key: keyof typeof schemaConfigurations): SQLiteDAO {
    console.log(`[DatabaseManager][get] Retrieving DAO for database '${key}'`);
    if (!this.hasAccessToDatabase(key)) {
      console.error(
        `[DatabaseManager][get] Access denied to database '${key}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${key}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.connections[key];
    if (!dao) {
      console.error(`[DatabaseManager][get] Database '${key}' not connected`);
      throw new Error(
        `Database '${key}' is not connected. Please ensure it's initialized for current user roles.`,
      );
    }
    console.log(`[DatabaseManager][get] DAO retrieved for database '${key}'`);
    return dao;
  }

  private static setupAppStateListener(): void {
    console.log(
      `[DatabaseManager][setupAppStateListener] Setting up AppState listener`,
    );

    // Sử dụng lock để tránh multiple setup
    if (this.setupListenerLock) {
      console.log(
        `[DatabaseManager][setupAppStateListener] Already setting up listener, skipping`,
      );
      return;
    }

    this.setupListenerLock = true;

    try {
      // Chỉ setup listener nếu chưa có

      if (this.appStateListener) {
        this.appStateListener.remove();
        console.log(
          `[DatabaseManager][setupAppStateListener] Removed existing AppState listener`,
        );
      }
      this.appStateListener = AppState.addEventListener(
        'change',
        async (nextAppState: AppStateStatus) => {
          console.log(
            `[DatabaseManager][setupAppStateListener] AppState changed to: ${nextAppState}`,
          );
          if (nextAppState === 'background' || nextAppState === 'inactive') {
            console.log(
              `[DatabaseManager][setupAppStateListener] App in background/inactive, closing connections`,
            );
            await this.closeAllConnections();
          } else if (nextAppState === 'active') {
            console.log(
              `[DatabaseManager][setupAppStateListener] App active, reopening connections`,
            );
            await this.reopenConnections();
          }
        },
      );
      console.log(
        `[DatabaseManager][setupAppStateListener] AppState listener registered`,
      );
    } finally {
      this.setupListenerLock = false;
    }
  }

  private static async closeAllConnections(): Promise<void> {
    console.log(
      `[DatabaseManager][closeAllConnections] Closing all active database connections`,
    );

    // Tránh multiple close cùng lúc
    if (this.isClosingConnections) {
      console.log(
        `[DatabaseManager][closeAllConnections] Already closing connections, skipping`,
      );
      return;
    }

    this.isClosingConnections = true;
    try {
      // Lưu danh sách các database đang active trước khi đóng
      const currentActiveDb = Object.keys(this.connections);
      currentActiveDb.forEach(dbKey => this.activeDatabases.add(dbKey));
      console.log(
        `[DatabaseManager][closeAllConnections] Saved active databases: ${Array.from(
          this.activeDatabases,
        ).join(', ')}`,
      );

      const closePromises = Object.entries(this.connections).map(
        async ([dbKey, dao]) => {
          try {
            await dao.close();
            console.log(
              `[DatabaseManager][closeAllConnections] Closed connection for database '${dbKey}'`,
            );
          } catch (error) {
            console.error(
              `[DatabaseManager][closeAllConnections] Error closing connection for database '${dbKey}':`,
              error as Error,
            );
          }
        },
      );
      await Promise.all(closePromises);
      this.connections = {};
      console.log(
        `[DatabaseManager][closeAllConnections] All connections closed`,
      );
    } finally {
      this.isClosingConnections = false;
    }
  }

  public static async reopenConnections(): Promise<void> {
    console.log(
      `[DatabaseManager][reopenConnections] Reopening connections for current user roles`,
    );
    await this.initializeCoreConnection();
    if (this.currentUserRoles.length > 0) {
      await this.initializeUserRoleConnections();
    }
    // Khởi tạo lại các database đã được sử dụng trước đó
    const activeDbArray = Array.from(this.activeDatabases);
    if (activeDbArray.length > 0) {
      console.log(
        `[DatabaseManager][reopenConnections] Reinitializing previously active databases: ${activeDbArray.join(
          ', ',
        )}`,
      );

      for (const dbKey of activeDbArray) {
        if (!this.connections[dbKey] && schemaConfigurations[dbKey]) {
          try {
            console.log(
              `[DatabaseManager][reopenConnections] Reinitializing database '${dbKey}'`,
            );
            // const dao = await DatabaseFactory.openExisting(dbKey);
            const dao = await DatabaseFactory.createOrOpen({ config: schemaConfigurations[dbKey] }, false)

            await dao.connect();
            this.connections[dbKey] = dao;

            // QUAN TRỌNG: Thông báo cho các service về database mới
            this.notifyDatabaseReconnect(dbKey, dao);

            console.log(
              `[DatabaseManager][reopenConnections] Database '${dbKey}' reinitialized successfully`,
            );
          } catch (error) {
            console.error(
              `[DatabaseManager][reopenConnections] Error reinitializing database '${dbKey}':`,
              error as Error,
            );
            // Không throw error để tránh crash, chỉ log lỗi
          }
        } else if (this.connections[dbKey]) {
          // Database đã tồn tại, vẫn cần thông báo cho services
          console.log(
            `[DatabaseManager][reopenConnections] Database '${dbKey}' already exists, notifying services`,
          );
          this.notifyDatabaseReconnect(dbKey, this.connections[dbKey]);
        }
      }
    }
    console.log(
      `[DatabaseManager][reopenConnections] Connections reopened successfully`,
    );
  }

  // Thêm phương thức để kiểm tra và khởi tạo lại database khi cần
  public static async ensureDatabaseConnection(
    key: string,
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseManager][ensureDatabaseConnection] Ensuring connection for database '${key}'`,
    );

    if (this.connections[key]) {
      // Kiểm tra xem kết nối có còn hoạt động không
      try {
        const isConnected = this.connections[key].isConnected();
        if (isConnected) {
          console.log(
            `[DatabaseManager][ensureDatabaseConnection] Database '${key}' is already connected and active`,
          );
          return this.connections[key];
        } else {
          console.log(
            `[DatabaseManager][ensureDatabaseConnection] Database '${key}' connection is inactive, cleaning up`,
          );
          // Safely remove the inactive connection
          try {
            await this.connections[key].close().catch(() => {
              // Ignore close errors for inactive connections
            });
          } catch (error) {
            console.warn(
              `[DatabaseManager][ensureDatabaseConnection] Error cleaning up inactive connection: ${error}`,
            );
          }
          delete this.connections[key];
        }
      } catch (error) {
        console.warn(
          `[DatabaseManager][ensureDatabaseConnection] Error checking connection for '${key}', will reconnect:`,
          (error as Error).stack,
        );
        delete this.connections[key];
      }
    }

    // Nếu không có kết nối hoặc kết nối không hoạt động, tạo mới
    return await this.getLazyLoading(key as keyof typeof schemaConfigurations);
  }

  public static getConnections(): DatabaseConnections {
    console.log(`[DatabaseManager][getConnections] Retrieving all connections`);
    const connections = {...this.connections};
    console.log(
      `[DatabaseManager][getConnections] Retrieved ${
        Object.keys(connections).length
      } connections`,
    );
    return connections;
  }

  public static async debugDatabaseFiles(
    databaseKeys: string[],
  ): Promise<void> {
    console.log(
      `[DatabaseManager][debugDatabaseFiles] Starting database files debug for keys: ${databaseKeys.join(
        ', ',
      )}`,
    );
    for (const key of databaseKeys) {
      if (!schemaConfigurations[key]) {
        console.error(
          `[DatabaseManager][debugDatabaseFiles] Key '${key}' not found in schemaConfigurations`,
        );
        continue;
      }
      const schema = schemaConfigurations[key];
      const actualDbName = schema.database_name;
      const dbFileName = actualDbName.endsWith('.db')
        ? actualDbName
        : `${actualDbName}.db`;
      const dbPath = `${RNFS.DocumentDirectoryPath}/../databases/${dbFileName}`;
      console.log(
        `[DatabaseManager][debugDatabaseFiles] Checking database '${key}': schema=${actualDbName}, filename=${dbFileName}, path=${dbPath}`,
      );
      try {
        const exists = await RNFS.exists(dbPath);
        console.log(
          `[DatabaseManager][debugDatabaseFiles] File exists for '${key}': ${exists}`,
        );
        if (exists) {
          const stat = await RNFS.stat(dbPath);
          console.log(
            `[DatabaseManager][debugDatabaseFiles] File size for '${key}': ${
              stat.size
            } bytes, modified: ${new Date(stat.mtime).toLocaleString()}`,
          );
        }
      } catch (error) {
        console.error(
          `[DatabaseManager][debugDatabaseFiles] Error checking file for '${key}':`,
          (error as Error).stack,
        );
      }
    }
    console.log(`[DatabaseManager][debugDatabaseFiles] Debug completed`);
  }

  public static async openAllExisting(
    databaseKeys: string[],
  ): Promise<boolean> {
    console.log(
      `[DatabaseManager][openAllExisting] Opening existing databases: ${databaseKeys.join(
        ', ',
      )}`,
    );
    const startTime = Date.now();
    await this.debugDatabaseFiles(databaseKeys);
    const failedOpens: {key: string; error: Error}[] = [];
    for (const key of databaseKeys) {
      console.log(
        `[DatabaseManager][openAllExisting] Opening database '${key}'`,
      );
      try {
        if (!schemaConfigurations[key]) {
          throw new Error(
            `Invalid database key: ${key}. Not found in schemaConfigurations.`,
          );
        }
        // const dao = await DatabaseFactory.openExisting(key);
        const dao = await DatabaseFactory.createOrOpen({ config: schemaConfigurations[key] }, false)

        await dao.runSql('PRAGMA integrity_check');
        this.connections[key] = dao;
        console.log(
          `[DatabaseManager][openAllExisting] Database '${key}' opened successfully`,
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[DatabaseManager][openAllExisting] Error opening database '${key}':`,
          err.stack,
        );
        failedOpens.push({key, error: err});
      }
    }
    if (failedOpens.length > 0) {
      const errorSummary = failedOpens
        .map(f => `  - ${f.key}: ${f.error.message}`)
        .join('\n');
      console.error(
        `[DatabaseManager][openAllExisting] Failed to open databases:\n${errorSummary}`,
      );
      throw new Error(
        `DatabaseManager: Failed to open one or more databases:\n${errorSummary}`,
      );
    }
    this.isInitialized = true;
    if (!this.appStateListener) {
      this.setupAppStateListener();
    }
    console.log(
      `[DatabaseManager][openAllExisting] All databases opened successfully in ${
        Date.now() - startTime
      }ms`,
    );
    return true;
  }

  public static async initLazySchema(databaseKeys: string[]): Promise<boolean> {
    console.log(
      `[DatabaseManager][initLazySchema] Starting lazy initialization for databases: ${databaseKeys.join(
        ', ',
      )}`,
    );
    const startTime = Date.now();
    const invalidKeys = databaseKeys.filter(key => !schemaConfigurations[key]);
    if (invalidKeys.length > 0) {
      console.error(
        `[DatabaseManager][initLazySchema] Invalid database keys: ${invalidKeys.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Invalid database keys: ${invalidKeys.join(
          ', ',
        )}. Not found in schemaConfigurations.`,
      );
    }
    const newConnectionsCount = databaseKeys.filter(
      key => !this.connections[key],
    ).length;
    const currentConnectionsCount = Object.keys(this.connections).length;
    if (currentConnectionsCount + newConnectionsCount > this.maxConnections) {
      console.error(
        `[DatabaseManager][initLazySchema] Exceeded max connections: ${
          currentConnectionsCount + newConnectionsCount
        }/${this.maxConnections}`,
      );
      throw new Error(
        `Cannot initialize ${newConnectionsCount} new connections. Would exceed maximum of ${this.maxConnections} connections. Current: ${currentConnectionsCount}`,
      );
    }
    const failedInitializations: {key: string; error: Error}[] = [];
    const initPromises = databaseKeys.map(async key => {
      if (this.connections[key]) {
        console.log(
          `[DatabaseManager][initLazySchema] Database '${key}' already initialized, skipping`,
        );
        return;
      }
      console.log(
        `[DatabaseManager][initLazySchema] Initializing database '${key}'`,
      );
      try {
        const schema = schemaConfigurations[key];
        /* const dao = await DatabaseFactory.createFromConfig(schema, {
          debug: __DEV__,
        }); */
        const dao = await DatabaseFactory.createOrOpen(
          {config: schemaConfigurations[key]},
          false,
        );
        await dao.runSql('PRAGMA integrity_check');
        this.connections[key] = dao;
        console.log(
          `[DatabaseManager][initLazySchema] Database '${key}' initialized successfully`,
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[DatabaseManager][initLazySchema] Error initializing database '${key}':`,
          err.stack,
        );
        failedInitializations.push({key, error: err});
      }
    });
    await Promise.all(initPromises);
    if (failedInitializations.length > 0) {
      const errorSummary = failedInitializations
        .map(f => `  - ${f.key}: ${f.error.message}`)
        .join('\n');
      console.error(
        `[DatabaseManager][initLazySchema] Failed to initialize databases:\n${errorSummary}`,
      );
      throw new Error(
        `DatabaseManager: Failed to initialize one or more databases:\n${errorSummary}`,
      );
    }
    if (!this.appStateListener) {
      this.setupAppStateListener();
    }
    if (Object.keys(this.connections).length > 0) {
      this.isInitialized = true;
    }
    console.log(
      `[DatabaseManager][initLazySchema] Lazy initialization completed in ${
        Date.now() - startTime
      }ms`,
    );
    return true;
  }

  public static async initializeAll(): Promise<void> {
    console.log(
      `[DatabaseManager][initializeAll] Starting initialization of all databases`,
    );
    if (this.isInitialized) {
      console.log(
        `[DatabaseManager][initializeAll] All databases already initialized`,
      );
      return;
    }
    const failedInitializations: {key: string; error: Error}[] = [];
    const initPromises = Object.entries(schemaConfigurations).map(
      async ([key, schema]) => {
        console.log(
          `[DatabaseManager][initializeAll] Initializing database '${key}'`,
        );
        try {
          /* const dao = await DatabaseFactory.createFromConfig(schema, {
            debug: __DEV__,
          }); */
          const dao = await DatabaseFactory.createOrOpen(
            {config: schemaConfigurations[key]},
            false,
          );

          this.connections[key] = dao;
          console.log(
            `[DatabaseManager][initializeAll] Database '${key}' initialized successfully`,
          );
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error(
            `[DatabaseManager][initializeAll] Error initializing database '${key}':`,
            err.stack,
          );
          failedInitializations.push({key, error: err});
        }
      },
    );
    await Promise.all(initPromises);
    if (failedInitializations.length > 0) {
      this.isInitialized = false;
      const errorSummary = failedInitializations
        .map(f => `  - ${f.key}: ${f.error.message}`)
        .join('\n');
      console.error(
        `[DatabaseManager][initializeAll] Failed to initialize databases:\n${errorSummary}`,
      );
      throw new Error(
        `DatabaseManager: Một hoặc nhiều database đã thất bại khi khởi tạo:\n${errorSummary}`,
      );
    }
    this.isInitialized = true;
    if (!this.appStateListener) {
      this.setupAppStateListener();
    }
    console.log(
      `[DatabaseManager][initializeAll] All databases initialized successfully`,
    );
  }

  public static async getLazyLoading(
    key: keyof typeof schemaConfigurations,
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseManager][getLazyLoading] Retrieving lazy-loaded DAO for database '${key}'`,
    );

    // Thêm database vào danh sách active
    this.activeDatabases.add(key);

    if (!this.hasAccessToDatabase(key)) {
      console.error(
        `[DatabaseManager][getLazyLoading] Access denied to database '${key}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${key}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }

    if (!this.connections[key]) {
      if (!schemaConfigurations[key]) {
        console.error(
          `[DatabaseManager][getLazyLoading] Invalid database key: ${key}`,
        );
        throw new Error(
          `Invalid database key: ${key}. Not found in schemaConfigurations.`,
        );
      }

      if (Object.keys(this.connections).length >= this.maxConnections) {
        console.error(
          `[DatabaseManager][getLazyLoading] Maximum number of database connections reached: ${this.maxConnections}`,
        );
        throw new Error('Maximum number of database connections reached');
      }

      console.log(
        `[DatabaseManager][getLazyLoading] Initializing database '${key}'`,
      );
      // const dao = await DatabaseFactory.openExisting(key);
      const dao = await DatabaseFactory.createOrOpen(
            {config: schemaConfigurations[key]},
            false,
          );
      await dao.connect();
      this.connections[key] = dao;
      console.log(
        `[DatabaseManager][getLazyLoading] Database '${key}' initialized successfully`,
      );
    }

    // Chỉ setup listener một lần khi chưa có
    if (!this.appStateListener) {
      this.setupAppStateListener();
    }

    this.isInitialized = true;
    console.log(
      `[DatabaseManager][getLazyLoading] DAO retrieved for database '${key}'`,
    );
    return this.connections[key];
  }

  public static async executeCrossSchemaTransaction(
    schemas: string[],
    callback: (daos: Record<string, SQLiteDAO>) => Promise<void>,
  ): Promise<void> {
    console.log(
      `[DatabaseManager][executeCrossSchemaTransaction] Starting transaction for schemas: ${schemas.join(
        ', ',
      )}`,
    );
    for (const key of schemas) {
      if (!this.hasAccessToDatabase(key)) {
        console.error(
          `[DatabaseManager][executeCrossSchemaTransaction] Access denied to database '${key}' for roles: ${this.currentUserRoles.join(
            ', ',
          )}`,
        );
        throw new Error(
          `Access denied: Database '${key}' is not accessible by current user roles: ${this.currentUserRoles.join(
            ', ',
          )}`,
        );
      }
    }
    const daos = schemas.reduce((acc, key) => {
      acc[key] = this.get(key);
      return acc;
    }, {} as Record<string, SQLiteDAO>);
    try {
      console.log(
        `[DatabaseManager][executeCrossSchemaTransaction] Beginning transaction for ${schemas.length} schemas`,
      );
      await Promise.all(Object.values(daos).map(dao => dao.beginTransaction()));
      await callback(daos);
      await Promise.all(
        Object.values(daos).map(dao => dao.commitTransaction()),
      );
      console.log(
        `[DatabaseManager][executeCrossSchemaTransaction] Transaction committed successfully`,
      );
    } catch (error) {
      console.error(
        `[DatabaseManager][executeCrossSchemaTransaction] Error in transaction:`,
        (error as Error).stack,
      );
      await Promise.all(
        Object.values(daos).map(dao => dao.rollbackTransaction()),
      );
      console.log(
        `[DatabaseManager][executeCrossSchemaTransaction] Transaction rolled back`,
      );
      throw error;
    }
  }

  public static async importDataToTable(
    databaseKey: string,
    tableName: string,
    data: Record<string, any>[],
    options: Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    console.log(
      `[DatabaseManager][importDataToTable] Starting import to ${databaseKey}.${tableName}, rows: ${
        data.length
      }, options: ${JSON.stringify(options)}`,
    );
    if (!this.hasAccessToDatabase(databaseKey)) {
      console.error(
        `[DatabaseManager][importDataToTable] Access denied to database '${databaseKey}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${databaseKey}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.get(databaseKey);
    try {
      const result = await dao.importData({
        tableName,
        data,
        ...options,
        onProgress: (processed, total) => {
          console.log(
            `[DatabaseManager][importDataToTable] Progress for ${databaseKey}.${tableName}: ${processed}/${total} (${Math.round(
              (processed / total) * 100,
            )}%)`,
          );
          if (options.onProgress) {
            options.onProgress(processed, total);
          }
        },
      });
      console.log(
        `[DatabaseManager][importDataToTable] Import completed for ${databaseKey}.${tableName}: ${result.successRows}/${result.totalRows} successful in ${result.executionTime}ms`,
      );
      return result;
    } catch (error) {
      console.error(
        `[DatabaseManager][importDataToTable] Error importing to ${databaseKey}.${tableName}:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async importDataWithMapping(
    databaseKey: string,
    tableName: string,
    data: Record<string, any>[],
    columnMappings: ColumnMapping[],
    options: Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    console.log(
      `[DatabaseManager][importDataWithMapping] Starting mapped import to ${databaseKey}.${tableName}, rows: ${
        data.length
      }, mappings: ${JSON.stringify(columnMappings)}`,
    );
    if (!this.hasAccessToDatabase(databaseKey)) {
      console.error(
        `[DatabaseManager][importDataWithMapping] Access denied to database '${databaseKey}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${databaseKey}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.get(databaseKey);
    try {
      const result = await dao.importDataWithMapping(
        tableName,
        data,
        columnMappings,
        options,
      );
      console.log(
        `[DatabaseManager][importDataWithMapping] Mapped import completed for ${databaseKey}.${tableName}: ${result.successRows}/${result.totalRows} successful`,
      );
      return result;
    } catch (error) {
      console.error(
        `[DatabaseManager][importDataWithMapping] Error in mapped import to ${databaseKey}.${tableName}:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async bulkImport(
    importConfigs: DatabaseImportConfig[],
  ): Promise<BulkImportResult> {
    console.log(
      `[DatabaseManager][bulkImport] Starting bulk import for ${importConfigs.length} configurations`,
    );
    const startTime = Date.now();
    const result: BulkImportResult = {
      totalDatabases: importConfigs.length,
      successDatabases: 0,
      results: {},
      errors: {},
      executionTime: 0,
    };
    for (const config of importConfigs) {
      const configKey = `${config.databaseKey}.${config.tableName}`;
      console.log(
        `[DatabaseManager][bulkImport] Processing import for ${configKey}, rows: ${config.data.length}`,
      );
      try {
        if (!this.hasAccessToDatabase(config.databaseKey)) {
          console.error(
            `[DatabaseManager][bulkImport] Access denied to database '${
              config.databaseKey
            }' for roles: ${this.currentUserRoles.join(', ')}`,
          );
          throw new Error(
            `Access denied: Database '${
              config.databaseKey
            }' is not accessible by current user roles: ${this.currentUserRoles.join(
              ', ',
            )}`,
          );
        }
        const dao = this.get(config.databaseKey);
        let importResult: ImportResult;
        if (config.columnMappings) {
          importResult = await dao.importDataWithMapping(
            config.tableName,
            config.data,
            config.columnMappings,
            config.options,
          );
        } else {
          importResult = await dao.importData({
            tableName: config.tableName,
            data: config.data,
            ...config.options,
          });
        }
        result.results[configKey] = importResult;
        result.successDatabases++;
        console.log(
          `[DatabaseManager][bulkImport] Import successful for ${configKey}: ${importResult.successRows}/${importResult.totalRows} rows`,
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        result.errors[configKey] = err;
        console.error(
          `[DatabaseManager][bulkImport] Error importing to ${configKey}:`,
          err.stack,
        );
      }
    }
    result.executionTime = Date.now() - startTime;
    console.log(
      `[DatabaseManager][bulkImport] Bulk import completed: ${result.successDatabases}/${result.totalDatabases} successful in ${result.executionTime}ms`,
    );
    return result;
  }

  public static async importFromCSV(
    databaseKey: string,
    tableName: string,
    csvData: string,
    options: {
      delimiter?: string;
      hasHeader?: boolean;
      columnMappings?: ColumnMapping[];
    } & Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    console.log(
      `[DatabaseManager][importFromCSV] Starting CSV import to ${databaseKey}.${tableName}`,
    );
    if (!this.hasAccessToDatabase(databaseKey)) {
      console.error(
        `[DatabaseManager][importFromCSV] Access denied to database '${databaseKey}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${databaseKey}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.get(databaseKey);
    try {
      const result = await dao.importFromCSV(tableName, csvData, options);
      console.log(
        `[DatabaseManager][importFromCSV] CSV import completed for ${databaseKey}.${tableName}: ${result.successRows}/${result.totalRows} successful`,
      );
      return result;
    } catch (error) {
      console.error(
        `[DatabaseManager][importFromCSV] Error importing CSV to ${databaseKey}.${tableName}:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async validateImportData(
    databaseKey: string,
    tableName: string,
    data: Record<string, any>[],
  ): Promise<Array<{rowIndex: number; errors: string[]}>> {
    console.log(
      `[DatabaseManager][validateImportData] Validating import data for ${databaseKey}.${tableName}, rows: ${data.length}`,
    );
    if (!this.hasAccessToDatabase(databaseKey)) {
      console.error(
        `[DatabaseManager][validateImportData] Access denied to database '${databaseKey}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${databaseKey}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.get(databaseKey);
    const validationErrors: Array<{rowIndex: number; errors: string[]}> = [];
    try {
      const tableInfo = await dao.getTableInfo(tableName);
      if (tableInfo.length === 0) {
        console.error(
          `[DatabaseManager][validateImportData] Table '${tableName}' does not exist in database '${databaseKey}'`,
        );
        throw new Error(
          `Table '${tableName}' does not exist in database '${databaseKey}'`,
        );
      }
      const columnMap = new Map(
        tableInfo.map(col => [col.name.toLowerCase(), col]),
      );
      for (let i = 0; i < data.length; i++) {
        const rowData = data[i];
        const rowErrors: string[] = [];
        for (const [columnName, columnInfo] of columnMap.entries()) {
          const isRequired = columnInfo.notnull === 1 && !columnInfo.dflt_value;
          const isPrimaryKey = columnInfo.pk === 1;
          if (
            isPrimaryKey &&
            columnInfo.type.toLowerCase().includes('integer')
          ) {
            continue;
          }
          const value = this.findValueForColumn(rowData, columnName);
          if (isRequired && (value === null || value === undefined)) {
            rowErrors.push(
              `Required column '${columnName}' is missing or null`,
            );
          }
          if (value !== null && value !== undefined) {
            try {
              this.validateValueType(value, columnInfo.type, columnName);
            } catch (error) {
              rowErrors.push(
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }
        if (rowErrors.length > 0) {
          validationErrors.push({rowIndex: i, errors: rowErrors});
        }
      }
      console.log(
        `[DatabaseManager][validateImportData] Validation completed for ${databaseKey}.${tableName}, errors: ${validationErrors.length}`,
      );
      return validationErrors;
    } catch (error) {
      console.error(
        `[DatabaseManager][validateImportData] Error validating data for ${databaseKey}.${tableName}:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private static findValueForColumn(
    rowData: Record<string, any>,
    columnName: string,
  ): any {
    console.log(
      `[DatabaseManager][findValueForColumn] Finding value for column '${columnName}' in row: ${JSON.stringify(
        rowData,
      )}`,
    );
    if (rowData.hasOwnProperty(columnName)) {
      console.log(
        `[DatabaseManager][findValueForColumn] Found exact match for '${columnName}'`,
      );
      return rowData[columnName];
    }
    const lowerColumnName = columnName.toLowerCase();
    for (const [key, value] of Object.entries(rowData)) {
      if (key.toLowerCase() === lowerColumnName) {
        console.log(
          `[DatabaseManager][findValueForColumn] Found case-insensitive match for '${columnName}'`,
        );
        return value;
      }
    }
    console.log(
      `[DatabaseManager][findValueForColumn] No value found for '${columnName}'`,
    );
    return undefined;
  }

  private static validateValueType(
    value: any,
    columnType: string,
    columnName: string,
  ): void {
    console.log(
      `[DatabaseManager][validateValueType] Validating value '${value}' for column '${columnName}', type: ${columnType}`,
    );
    const type = columnType.toLowerCase();
    try {
      if (type.includes('integer') || type.includes('int')) {
        if (typeof value === 'boolean') return;
        const num = parseInt(String(value));
        if (isNaN(num)) {
          throw new Error(
            `Column '${columnName}': Cannot convert '${value}' to INTEGER`,
          );
        }
        return;
      }
      if (
        type.includes('real') ||
        type.includes('float') ||
        type.includes('decimal')
      ) {
        const num = parseFloat(String(value));
        if (isNaN(num)) {
          throw new Error(
            `Column '${columnName}': Cannot convert '${value}' to REAL/DECIMAL`,
          );
        }
        return;
      }
      if (type.includes('json')) {
        if (typeof value === 'object') return;
        if (typeof value === 'string') {
          JSON.parse(value);
          return;
        }
        throw new Error(`Column '${columnName}': Invalid JSON format`);
      }
      if (type.includes('timestamp') || type.includes('datetime')) {
        if (value instanceof Date) return;
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Column '${columnName}': Invalid date format`);
          }
        }
        return;
      }
      console.log(
        `[DatabaseManager][validateValueType] Value validated successfully for '${columnName}'`,
      );
    } catch (error) {
      console.error(
        `[DatabaseManager][validateValueType] Error validating value for '${columnName}':`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async getImportStatistics(databaseKey: string): Promise<{
    totalTables: number;
    tablesWithData: string[];
    tableSizes: Record<string, number>;
  }> {
    console.log(
      `[DatabaseManager][getImportStatistics] Retrieving import statistics for database '${databaseKey}'`,
    );
    if (!this.hasAccessToDatabase(databaseKey)) {
      console.error(
        `[DatabaseManager][getImportStatistics] Access denied to database '${databaseKey}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${databaseKey}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.get(databaseKey);
    try {
      const tables = await dao.getRsts(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      );
      const tablesWithData: string[] = [];
      const tableSizes: Record<string, number> = {};
      for (const table of tables) {
        const tableName = table.name;
        console.log(
          `[DatabaseManager][getImportStatistics] Checking size of table '${tableName}'`,
        );
        const sizeResult = await dao.getRst(
          `SELECT COUNT(*) as count FROM ${tableName}`,
        );
        const size = sizeResult.count || 0;
        tableSizes[tableName] = size;
        if (size > 0) {
          tablesWithData.push(tableName);
        }
      }
      const stats = {totalTables: tables.length, tablesWithData, tableSizes};
      console.log(
        `[DatabaseManager][getImportStatistics] Statistics retrieved: ${JSON.stringify(
          stats,
        )}`,
      );
      return stats;
    } catch (error) {
      console.error(
        `[DatabaseManager][getImportStatistics] Error retrieving statistics for database '${databaseKey}':`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async truncateTable(
    databaseKey: string,
    tableName: string,
  ): Promise<number> {
    console.log(
      `[DatabaseManager][truncateTable] Truncating table ${databaseKey}.${tableName}`,
    );
    if (!this.hasAccessToDatabase(databaseKey)) {
      console.error(
        `[DatabaseManager][truncateTable] Access denied to database '${databaseKey}' for roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
      throw new Error(
        `Access denied: Database '${databaseKey}' is not accessible by current user roles: ${this.currentUserRoles.join(
          ', ',
        )}`,
      );
    }
    const dao = this.get(databaseKey);
    try {
      const countResult = await dao.getRst(
        `SELECT COUNT(*) as count FROM ${tableName}`,
      );
      const rowCount = countResult.count || 0;
      if (rowCount > 0) {
        await dao.runSql(`DELETE FROM ${tableName}`);
        await dao.runSql(
          `DELETE FROM sqlite_sequence WHERE name='${tableName}'`,
        );
        console.log(
          `[DatabaseManager][truncateTable] Truncated ${rowCount} rows from ${databaseKey}.${tableName}`,
        );
      } else {
        console.log(
          `[DatabaseManager][truncateTable] No rows to truncate in ${databaseKey}.${tableName}`,
        );
      }
      return rowCount;
    } catch (error) {
      console.error(
        `[DatabaseManager][truncateTable] Error truncating table ${databaseKey}.${tableName}:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public static async closeAll(): Promise<void> {
    console.log(
      `[DatabaseManager][closeAll] Closing all database connections and resetting state`,
    );

    await this.closeAllConnections();

    this.currentUserRoles = [];
    this.currentRole = null;
    this.isInitialized = false;
    this.activeDatabases.clear(); // Clear active databases set

    // Clear event listeners
    this.eventListeners.clear();

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
      console.log(`[DatabaseManager][closeAll] AppState listener removed`);
    }

    // Reset locks
    this.isClosingConnections = false;
    this.setupListenerLock = false;

    console.log(
      `[DatabaseManager][closeAll] All connections closed and state reset`,
    );
  }

  public static async logout(): Promise<void> {
    console.log(
      `[DatabaseManager][logout] Initiating user logout, closing role-specific connections`,
    );
    const connectionsToClose = Object.keys(this.connections).filter(
      key => key !== 'core',
    );
    for (const dbKey of connectionsToClose) {
      try {
        await this.connections[dbKey].close();
        delete this.connections[dbKey];
        console.log(
          `[DatabaseManager][logout] Closed connection for database '${dbKey}'`,
        );
      } catch (error) {
        console.error(
          `[DatabaseManager][logout] Error closing connection for database '${dbKey}':`,
          (error as Error).stack,
        );
      }
    }
    this.currentUserRoles = [];
    this.currentRole = null;
    console.log(
      `[DatabaseManager][logout] User logout completed, only core connection remains`,
    );
  }
}

export default DatabaseManager;

import { Platform } from 'react-native';
import SQLiteDAO, { DatabaseSchemaWithTypeMapping } from './SQLiteDAO';
import RNFS from 'react-native-fs';

// Interface for database factory options
interface DbFactoryOptions {
  config?: DatabaseSchemaWithTypeMapping; // Option 1: Provide a config object directly
  configPath?: string; // Option 2: Provide a path to the config file (relative to bundle)
  configAsset?: any; // Option 3: Provide a required JSON asset
  dbDirectory?: string; // Optional: Directory to store the .db file
  debug?: boolean; // Optional: Enable debug logging
}

// Interface for database existence check result
interface DatabaseExistenceInfo {
  exists: boolean;
  path: string;
  size?: number;
  lastModified?: Date;
}

/**
 * A factory class to create and initialize a SQLiteDAO instance from a JSON schema.
 * It encapsulates the logic of reading configuration, validating it, and setting up the database.
 */
export class DatabaseFactory {

  /**
   * Phương thức thông minh để tạo hoặc mở cơ sở dữ liệu
   * Sẽ kiểm tra file đã tồn tại và hợp lệ trước khi quyết định tạo mới hay mở existing
   * @param options Tùy chọn cấu hình cơ sở dữ liệu
   * @param forceRecreate Có buộc tạo lại cơ sở dữ liệu hay không (mặc định: false)
   * @returns Promise trả về SQLiteDAO đã được khởi tạo
   */
  public static async createOrOpen(
    options: DbFactoryOptions,
    forceRecreate: boolean = false,
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseFactory][createOrOpen] Creating or opening database with options: ${options?.config?.description}, forceRecreate: ${forceRecreate}`,
    );

    // Nếu forceRecreate = true, gọi trực tiếp phương thức create
    if (forceRecreate) {
      console.log(
        `[DatabaseFactory][createOrOpen] Force recreate is enabled, calling create method`,
      );
      return await this.create(options);
    }

    let schema: DatabaseSchemaWithTypeMapping;

    // Step 1: Load schema
    if (options.config) {
      console.log(
        `[DatabaseFactory][createOrOpen] Using provided config object`,
      );
      schema = options.config;
    } else if (options.configAsset) {
      console.log(
        `[DatabaseFactory][createOrOpen] Using provided config asset`,
      );
      schema = options.configAsset;
    } else if (options.configPath) {
      console.log(
        `[DatabaseFactory][createOrOpen] Loading schema from config path: ${options.configPath}`,
      );
      try {
        schema = await this.loadSchemaFromBundle(options.configPath);
      } catch (bundleError) {
        console.log(
          `[DatabaseFactory][createOrOpen] Failed to load from bundle, trying documents directory`,
        );
        try {
          schema = await this.loadSchemaFromDocuments(options.configPath);
        } catch (documentsError) {
          console.error(
            `[DatabaseFactory][createOrOpen] Failed to load schema from both locations:`,
            (documentsError as Error).stack,
          );
          throw documentsError;
        }
      }
    } else {
      console.error(
        `[DatabaseFactory][createOrOpen] No config, configAsset, or configPath provided`,
      );
      throw new Error(
        "Either 'config', 'configAsset', or 'configPath' must be provided to the factory.",
      );
    }

    console.log(`[DatabaseFactory][createOrOpen] Validating schema`);
    this.validateSchema(schema);

    // Step 2: Determine database path and ensure directory exists

    const dbFileName = schema.database_name.endsWith('.db')
      ? schema.database_name
      : `${schema.database_name}.db`;

    // Step 3: Open existing DB
    console.log(
      `[DatabaseFactory][createOrOpen] new SQLiteDAO: ${dbFileName} and dao.connect();`,
    );
    const dao = new SQLiteDAO(dbFileName, options.debug ?? true);

    try {
      await dao.connect();
      console.log(
        `[DatabaseFactory][createOrOpen] Connection established for existing database '${dbFileName}'`,
      );

      // Step 4: Create Schema, table, index,fk, .... if
      // Do tham số không yêu cầu tạo lại ở hàm gọi new SQLiteDAO nên vào hàm này
      // nó sẽ kiểm tra sự tồn tại của db trước đó có chưa? tức là có bảng dữ liệu có version?... thì nó sẽ không tạo lại bảng
      console.log(
        `[DatabaseFactory][createOrOpen] Step 4: Initializing schema for '${dbFileName}'`,
      );
      await dao.initializeFromSchema(schema);
      console.log(
        `[DatabaseFactory][createOrOpen] Database schema initialized successfully for '${dbFileName}'`,
      );

      // Validate schema version compatibility
      try {
        await this.validateSchemaVersion(dao, schema);
        console.log(
          `[DatabaseFactory][createOrOpen] Schema validation successful for existing database '${dbFileName}'`,
        );
      } catch (schemaError: any) {
        console.error(
          `[DatabaseFactory][createOrOpen] Schema validation failed:`,
          schemaError.message,
        );
        await dao.close();
        throw new Error(
          `Schema mismatch in existing database. Use forceRecreate=true to recreate with updated schema. Error: ${schemaError.message}`,
        );
      }

      console.log(
        `[DatabaseFactory][createOrOpen] Successfully opened existing database: ${dbFileName}`,
      );
      return dao;
    } catch (error) {
      console.error(
        `[DatabaseFactory][createOrOpen] Error during database opening for '${dbFileName}':`,
        (error as Error).stack,
      );
      if (dao.isConnected()) {
        console.log(`[DatabaseFactory][createOrOpen] Closing DAO due to error`);
        await dao.close();
      }
      throw error;
    }
  }

  /**
   * Thêm kiểm tra phiên bản schema trong DatabaseFactory để đảm bảo schema trong mã khớp với cơ sở dữ liệu hiện tại:
   * Lợi ích: Ngăn chặn lỗi do schema không đồng bộ.
   * @param dao
   * @param schema
   */
  private static async validateSchemaVersion(
    dao: SQLiteDAO,
    schema: DatabaseSchemaWithTypeMapping,
  ): Promise<void> {
    console.log(
      `[DatabaseFactory][validateSchemaVersion] Validating schema version for database: ${schema.database_name}`,
    );
    try {
      const dbInfo = await dao.getDatabaseInfo();
      console.log(
        `[DatabaseFactory][validateSchemaVersion] Database version: ${dbInfo.version}, schema version: ${schema.version}`,
      );
      if (dbInfo.version !== schema.version) {
        console.error(
          `[DatabaseFactory][validateSchemaVersion] Schema version mismatch: database (${dbInfo.version}) vs config (${schema.version})`,
        );
        throw new Error(
          `Schema version mismatch: database (${dbInfo.version}) vs config (${schema.version})`,
        );
      }
      console.log(
        `[DatabaseFactory][validateSchemaVersion] Schema version validated successfully`,
      );
    } catch (error) {
      console.error(
        `[DatabaseFactory][validateSchemaVersion] Error validating schema version for ${schema.database_name}:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Opens an existing database without initializing its schema.
   * Thêm kiểm tra tính toàn vẹn file cơ sở dữ liệu trong DatabaseFactory.openExisting() để phát hiện file bị hỏng:
   * Lợi ích: Phát hiện sớm các file cơ sở dữ liệu bị hỏng, tránh lỗi runtime.
   * @param dbName The name of the database (e.g., 'core.db' or 'core').
   * @param options Additional options for database connection.
   * @returns A promise that resolves to a connected SQLiteDAO instance.
   */
  public static async openExisting(
    dbName: string,
    options: Omit<
      DbFactoryOptions,
      'config' | 'configAsset' | 'configPath'
    > = {},
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseFactory][openExisting] Opening existing database: ${dbName}, options: ${JSON.stringify(
        options,
      )}`,
    );

    // Step 1: Determine the database file path
    const dbFileName = dbName.endsWith('.db') ? dbName : `${dbName}.db`;

    // Step 3: Create and connect DAO instance
    const dao = new SQLiteDAO(dbFileName, options.debug ?? __DEV__);
    try {
      console.log(
        `[DatabaseFactory][openExisting] Connecting to database '${dbFileName}'`,
      );
      await dao.connect();
      console.log(
        `[DatabaseFactory][openExisting] Running integrity check for '${dbFileName}'`,
      );
      await dao.runSql('PRAGMA integrity_check');
      console.log(
        `[DatabaseFactory][openExisting] Connection to database '${dbFileName}' established successfully`,
      );
      return dao;
    } catch (error) {
      console.error(
        `[DatabaseFactory][openExisting] Error opening database '${dbFileName}':`,
        (error as Error).stack,
      );
      await dao.close();
      throw error;
    }
  }

  /**
   * Validates the provided schema object to ensure it has the minimum required properties.
   * @param schema The schema object to validate.
   * @returns True if the schema is valid, otherwise throws an error.
   */
  private static validateSchema(
    schema: any,
  ): schema is DatabaseSchemaWithTypeMapping {
    console.log(
      `[DatabaseFactory][validateSchema] Validating schema: ${JSON.stringify(
        schema,
      ).slice(0, 50)}...`,
    );
    if (!schema) {
      console.error(
        `[DatabaseFactory][validateSchema] Schema is null or undefined`,
      );
      throw new Error('Schema configuration is null or undefined.');
    }
    if (
      typeof schema.database_name !== 'string' ||
      schema.database_name.trim() === ''
    ) {
      console.error(
        `[DatabaseFactory][validateSchema] Invalid or missing 'database_name' in schema`,
      );
      throw new Error(
        "Invalid or missing 'database_name' in schema. This is required to name the database file.",
      );
    }
    if (
      typeof schema.schemas !== 'object' ||
      schema.schemas === null ||
      Object.keys(schema.schemas).length === 0
    ) {
      console.error(
        `[DatabaseFactory][validateSchema] Invalid or missing 'schemas' object in schema`,
      );
      throw new Error(
        "Invalid or missing 'schemas' object in schema. At least one table definition is required.",
      );
    }
    console.log(
      `[DatabaseFactory][validateSchema] Schema validated successfully`,
    );
    return true;
  }

  /**
   * Loads JSON schema from a file in the app bundle.
   * Đọc JSON từ thư mục Bundle tức là lưu trong mã nguồn
   * @param configPath Relative path to the JSON file in the bundle
   * @returns Promise that resolves to the parsed JSON schema
   */
  private static async loadSchemaFromBundle(
    configPath: string,
  ): Promise<DatabaseSchemaWithTypeMapping> {
    console.log(
      `[DatabaseFactory][loadSchemaFromBundle] Loading schema from bundle: ${configPath}`,
    );
    try {
      const bundlePath =
        Platform.OS === 'ios'
          ? `${RNFS.MainBundlePath}/${configPath}`
          : `${RNFS.MainBundlePath}/${configPath}`;
      console.log(
        `[DatabaseFactory][loadSchemaFromBundle] Bundle path: ${bundlePath}`,
      );
      const schemaContent = await RNFS.readFile(bundlePath, 'utf8');
      const schema = JSON.parse(schemaContent);
      console.log(
        `[DatabaseFactory][loadSchemaFromBundle] Schema loaded successfully from bundle: ${configPath}`,
      );
      return schema;
    } catch (err) {
      console.error(
        `[DatabaseFactory][loadSchemaFromBundle] Error loading or parsing schema from bundle: ${configPath}:`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  /**
   * Loads JSON schema from the documents directory.
   * @param configPath Path to the JSON file in documents directory
   * @returns Promise that resolves to the parsed JSON schema
   */
  private static async loadSchemaFromDocuments(
    configPath: string,
  ): Promise<DatabaseSchemaWithTypeMapping> {
    console.log(
      `[DatabaseFactory][loadSchemaFromDocuments] Loading schema from documents: ${configPath}`,
    );
    try {
      const fullPath = `${RNFS.DocumentDirectoryPath}/${configPath}`;
      console.log(
        `[DatabaseFactory][loadSchemaFromDocuments] Full path: ${fullPath}`,
      );
      const schemaContent = await RNFS.readFile(fullPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      console.log(
        `[DatabaseFactory][loadSchemaFromDocuments] Schema loaded successfully from documents: ${configPath}`,
      );
      return schema;
    } catch (err) {
      console.error(
        `[DatabaseFactory][loadSchemaFromDocuments] Error loading or parsing schema from documents: ${configPath}:`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  /**
   * Creates, connects, and initializes a database from a configuration file or object.
   * This is the main method to get a ready-to-use DAO instance.
   * @param options Configuration options specifying either a direct config object or a file path.
   * @returns A promise that resolves to a fully initialized and connected SQLiteDAO instance.
   */
  public static async create(options: DbFactoryOptions): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseFactory][create] Creating database with options: ${JSON.stringify(
        options,
      )}`,
    );
    let schema: DatabaseSchemaWithTypeMapping;

    // Step 1: Load and validate the schema configuration
    if (options.config) {
      console.log(`[DatabaseFactory][create] Using provided config object`);
      schema = options.config;
      console.log(
        `[DatabaseFactory][create] Schema loaded successfully from provided object`,
      );
    } else if (options.configAsset) {
      console.log(`[DatabaseFactory][create] Using provided config asset`);
      schema = options.configAsset;
      console.log(
        `[DatabaseFactory][create] Schema loaded successfully from provided asset`,
      );
    } else if (options.configPath) {
      console.log(
        `[DatabaseFactory][create] Loading schema from config path: ${options.configPath}`,
      );
      try {
        schema = await this.loadSchemaFromBundle(options.configPath);
      } catch (bundleError) {
        console.log(
          `[DatabaseFactory][create] Failed to load from bundle, trying documents directory`,
        );
        try {
          schema = await this.loadSchemaFromDocuments(options.configPath);
        } catch (documentsError) {
          console.error(
            `[DatabaseFactory][create] Failed to load schema from both bundle and documents directory:`,
            (documentsError as Error).stack,
          );
          throw documentsError;
        }
      }
    } else {
      console.error(
        `[DatabaseFactory][create] No config, configAsset, or configPath provided`,
      );
      throw new Error(
        "Either 'config' (a schema object), 'configAsset' (a required JSON), or 'configPath' (a file path) must be provided to the factory.",
      );
    }

    console.log(`[DatabaseFactory][create] Validating schema`);
    this.validateSchema(schema);

    // Step 2: Determine the final database file path
    const dbFileName = schema.database_name.endsWith('.db')
      ? schema.database_name
      : `${schema.database_name}.db`;

    console.log(`[DatabaseFactory][createOrOpen] Checking if database '${dbFileName}' exists`);

    // Step 3: Initialize DAO, connect, and build the schema
    const dao = new SQLiteDAO(dbFileName, options.debug ?? true,
      {
        createIfNotExists: true, // Mặc định false - không tạo mới nếu đã tồn tại
        // forceRecreate: false // Mặc định false - ép tạo lại xóa file cũ tạo lại file mới nếu =true
      }
    );

    try {
      // Establish the connection to the database file Mở file
      console.log(
        `[DatabaseFactory][create] Connecting to database '${dbFileName}'`,
      );
      await dao.connect();
      console.log(
        `[DatabaseFactory][create] Connection established for database '${dbFileName}'`,
      );

      // Initialize the database schema (creates tables, indexes, etc.)
      // Tạo bảng nếu có cần thiết lập tham số option ở new SQLiteDAO 
      //  {
      //   createIfNotExists: true, // Mặc định false - không tạo mới nếu đã tồn tại
      //   // forceRecreate: false // Mặc định false - ép tạo lại xóa file cũ tạo lại file mới nếu =true
      // }
      console.log(
        `[DatabaseFactory][create] Initializing schema for '${dbFileName}'`,
      );
      // Do tham số CÓ yêu cầu tạo lại ở hàm gọi new SQLiteDAO nên vào hàm này
      // nó sẽ bỏ qua việc có tồn tại hay không có mà sẽ tự động tạo mới csdl
      // còn tính năng migration thì sẽ thiết kế sau
      await dao.initializeFromSchema(schema);
      console.log(
        `[DatabaseFactory][create] Database schema initialized successfully for '${dbFileName}'`,
      );

      // Step 4: Return the fully configured and ready-to-use DAO instance
      return dao;
    } catch (error) {
      console.error(
        `[DatabaseFactory][create] Error during database initialization for '${dbFileName}':`,
        (error as Error).stack,
      );
      // Attempt to close the connection if it was opened before the error
      if (dao.isConnected()) {
        console.log(`[DatabaseFactory][create] Closing DAO due to error`);
        await dao.close();
      }
      throw error; // Rethrow to allow for higher-level error handling
    }
  }

  /**
   * Convenience method to create a database from a JSON asset that was imported/required.
   * @param configAsset The imported/required JSON configuration
   * @param options Additional options for database creation
   * @returns A promise that resolves to a fully initialized and connected SQLiteDAO instance.
   */
  public static async createFromAsset(
    configAsset: DatabaseSchemaWithTypeMapping,
    options: Omit<
      DbFactoryOptions,
      'config' | 'configAsset' | 'configPath'
    > = {},
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseFactory][createFromAsset] Creating database from asset: ${JSON.stringify(
        configAsset,
      ).slice(0, 50)}...`,
    );
    try {
      const dao = await this.create({
        ...options,
        configAsset,
      });
      console.log(
        `[DatabaseFactory][createFromAsset] Database created successfully from asset`,
      );
      return dao;
    } catch (error) {
      console.error(
        `[DatabaseFactory][createFromAsset] Error creating database from asset:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Convenience method to create a database from a configuration object.
   * @param config The database schema configuration object
   * @param options Additional options for database creation
   * @returns A promise that resolves to a fully initialized and connected SQLiteDAO instance.
   */
  public static async createFromConfig(
    config: DatabaseSchemaWithTypeMapping,
    options: Omit<
      DbFactoryOptions,
      'config' | 'configAsset' | 'configPath'
    > = {},
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseFactory][createFromConfig] Creating database from config: ${JSON.stringify(
        config,
      ).slice(0, 50)}...`,
    );
    try {
      const dao = await this.create({
        ...options,
        config,
      });
      console.log(
        `[DatabaseFactory][createFromConfig] Database created successfully from config`,
      );
      return dao;
    } catch (error) {
      console.error(
        `[DatabaseFactory][createFromConfig] Error creating database from config:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Convenience method to create a database from a JSON file path.
   * @param configPath Path to the JSON configuration file
   * @param options Additional options for database creation
   * @returns A promise that resolves to a fully initialized and connected SQLiteDAO instance.
   */
  public static async createFromPath(
    configPath: string,
    options: Omit<
      DbFactoryOptions,
      'config' | 'configAsset' | 'configPath'
    > = {},
  ): Promise<SQLiteDAO> {
    console.log(
      `[DatabaseFactory][createFromPath] Creating database from path: ${configPath}`,
    );
    try {
      const dao = await this.create({
        ...options,
        configPath,
      });
      console.log(
        `[DatabaseFactory][createFromPath] Database created successfully from path`,
      );
      return dao;
    } catch (error) {
      console.error(
        `[DatabaseFactory][createFromPath] Error creating database from path:`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}

export default DatabaseFactory;

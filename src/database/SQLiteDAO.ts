import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
SQLite.enablePromise(true);

// Type mapping configuration
export interface TypeMappingConfig {
  type_mapping: {
    [targetType: string]: {
      [sourceType: string]: string;
    };
  };
}

// Interfaces
export interface ColumnDefinition {
  name: string;
  type: string;
  option_key?: string;
  description?: string;
  nullable?: boolean;
  default?: any;
  primary_key?: boolean;
  auto_increment?: boolean;
  unique?: boolean;
  // Thêm 'constraints' để tương thích với core.json
  constraints?: string;
  length?: number;
}

export interface Column {
  name: string;
  value?: any;
}

export interface WhereClause {
  name: string;
  value: any;
  operator?: string;
}

export interface OrderByClause {
  name: string;
  direction?: 'ASC' | 'DESC';
}

export interface LimitOffset {
  limit?: number;
  offset?: number;
}

export interface QueryTable {
  name: string;
  cols: Column[];
  wheres?: WhereClause[];
  orderbys?: OrderByClause[];
  limitOffset?: LimitOffset;
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: string;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  description?: string;
}

export type ForeignKeyAction =
  | 'CASCADE'
  | 'RESTRICT'
  | 'SET NULL'
  | 'NO ACTION'
  | undefined;

export interface ForeignKeyDefinition {
  name: string;
  column: string;
  references: {
    table: string;
    column: string;
  };
  on_delete?: string | ForeignKeyAction;
  on_update?: string | ForeignKeyAction;
  description?: string;
}

export interface TableDefinition {
  name: string;
  cols: ColumnDefinition[];
  description?: string;
  indexes?: IndexDefinition[];
  foreign_keys?: ForeignKeyDefinition[];
}

// Enhanced schema interface to support type mapping from files like core.json
export interface DatabaseSchemaWithTypeMapping {
  version: string;
  database_name: string;
  description?: string;
  type_mapping?: TypeMappingConfig['type_mapping'];
  schemas: Record<
    string,
    {
      description?: string;
      cols: ColumnDefinition[];
      indexes?: IndexDefinition[];
      foreign_keys?: ForeignKeyDefinition[];
    }
  >;
}

// Transaction types
export interface TransactionOperation {
  type: 'insert' | 'update' | 'delete' | 'select';
  table: QueryTable;
}

// Interface cho cấu hình import
export interface ImportOptions {
  tableName: string;
  data: Record<string, any>[];
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (
    error: Error,
    rowIndex: number,
    rowData: Record<string, any>,
  ) => void;
  skipErrors?: boolean;
  validateData?: boolean;
  updateOnConflict?: boolean; // Có update khi conflict hay không
  conflictColumns?: string[]; // Columns để check conflict
  includeAutoIncrementPK?: boolean; // Import đầy đủ cột bao gồm auto increment PK (mặc định: false)
}

// Interface cho kết quả import
export interface ImportResult {
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{
    rowIndex: number;
    error: string;
    rowData: Record<string, any>;
  }>;
  executionTime: number;
}

// Interface cho mapping column
export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  transform?: (value: any) => any;
}

export class SQLiteDAO {
  private db: SQLiteDatabase | null = null;
  private isOpen: boolean = false;
  private isDebug: boolean = true;
  private dbName: string;
  private inTransaction: boolean = false;
  private typeMappingConfig: TypeMappingConfig['type_mapping'] | null = null;
  private createIfNotExists: boolean = false;
  private forceRecreate: boolean = false;

  constructor(dbFilePath: string, debug: boolean = true, options?: {
    createIfNotExists?: boolean; // Mặc định false - không tạo mới nếu đã tồn tại
    forceRecreate?: boolean; // Mặc định false - ép tạo lại
  }) {
    this.dbName = dbFilePath;
    this.isDebug = debug;
    this.createIfNotExists = options?.createIfNotExists ?? false;
    this.forceRecreate = options?.forceRecreate ?? false;
    console.log(`[SQLiteDAO][constructor] Initializing SQLiteDAO for database: ${dbFilePath}, debug: ${debug}`);

  }

  /**
   * Establishes a connection to the database. Must be called after instantiation.
   */
  public async connect(): Promise<void> {
    console.log(`[SQLiteDAO][connect] Attempting to connect to database: ${this.dbName}`);
    if (this.isOpen) {
      console.log(`[SQLiteDAO][connect] Database '${this.dbName}' is already connected`);
      return;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        location: 'default',
      });

      this.isOpen = true;
      console.log(`[SQLiteDAO][connect] Connected to database '${this.dbName}' at ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error(`[SQLiteDAO][connect] Error connecting to database '${this.dbName}':`, (err as Error).stack);
      this.isOpen = false;
      throw err;
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`[SQLiteDAO][log] ${message}`, ...args);
    }
  }

  private logError(message: string, ...args: any[]): void {
    console.error(`[SQLiteDAO][logError] ${message}`, ...args);
  }

  // ===========================================
  // TYPE MAPPING UTILITIES
  // ===========================================

  setTypeMappingConfig(config: TypeMappingConfig['type_mapping']): void {
    console.log(`[SQLiteDAO][setTypeMappingConfig] Setting type mapping config: ${JSON.stringify(config).slice(0, 100)}...`);
    this.typeMappingConfig = config;
    this.log(`Type mapping configuration loaded`);
  }

  private convertToSQLiteType(genericType: string): string {
    console.log(`[SQLiteDAO][convertToSQLiteType] Converting type: ${genericType}`);
    if (!this.typeMappingConfig || !this.typeMappingConfig.sqlite) {
      const defaultType = this.getDefaultSQLiteType(genericType);
      console.log(`[SQLiteDAO][convertToSQLiteType] Using default SQLite type: ${defaultType} for ${genericType}`);
      return defaultType;
    }
    const sqliteMapping = this.typeMappingConfig.sqlite;
    const sqliteType = sqliteMapping[genericType.toLowerCase()];
    if (!sqliteType) {
      console.log(`[SQLiteDAO][convertToSQLiteType] Unknown type '${genericType}', using TEXT as default`);
      return 'TEXT';
    }
    console.log(`[SQLiteDAO][convertToSQLiteType] Converted ${genericType} to ${sqliteType}`);
    return sqliteType;
  }

  private getDefaultSQLiteType(genericType: string): string {
    console.log(`[SQLiteDAO][getDefaultSQLiteType] Getting default SQLite type for: ${genericType}`);
    const defaultMapping: Record<string, string> = {
      string: 'TEXT',
      varchar: 'TEXT',
      char: 'TEXT',
      email: 'TEXT',
      url: 'TEXT',
      uuid: 'TEXT',
      integer: 'INTEGER',
      bigint: 'INTEGER',
      smallint: 'INTEGER',
      tinyint: 'INTEGER',
      decimal: 'REAL',
      numeric: 'REAL',
      float: 'REAL',
      double: 'REAL',
      boolean: 'INTEGER',
      timestamp: 'TEXT',
      datetime: 'TEXT',
      date: 'TEXT',
      time: 'TEXT',
      json: 'TEXT',
      array: 'TEXT',
      blob: 'BLOB',
      binary: 'BLOB',
    };
    const result = defaultMapping[genericType.toLowerCase()] || 'TEXT';
    console.log(`[SQLiteDAO][getDefaultSQLiteType] Default SQLite type for ${genericType}: ${result}`);
    return result;
  }

  private processColumnDefinition(col: ColumnDefinition): ColumnDefinition {
    console.log(`[SQLiteDAO][processColumnDefinition] Processing column: ${col.name}, type: ${col.type}`);
    const processedCol: ColumnDefinition = { ...col };
    processedCol.type = this.convertToSQLiteType(col.type);
    const options: string[] = [];
    if (col.constraints) {
      console.log(`[SQLiteDAO][processColumnDefinition] Processing constraints for ${col.name}: ${col.constraints}`);
      const constraints = col.constraints.toUpperCase().split(' ');
      if (constraints.includes('PRIMARY')) {
        options.push('PRIMARY KEY');
        processedCol.primary_key = true;
      }
      if (
        constraints.includes('AUTO_INCREMENT') ||
        constraints.includes('AUTOINCREMENT')
      ) {
        if (processedCol.primary_key) options.push('AUTOINCREMENT');
        processedCol.auto_increment = true;
      }
      if (constraints.includes('NOT') && constraints.includes('NULL')) {
        options.push('NOT NULL');
        processedCol.nullable = false;
      }
      if (constraints.includes('UNIQUE')) {
        if (!processedCol.primary_key) options.push('UNIQUE');
        processedCol.unique = true;
      }
      const defaultIndex = constraints.indexOf('DEFAULT');
      if (defaultIndex !== -1 && constraints.length > defaultIndex + 1) {
        const defaultValue = constraints[defaultIndex + 1];
        options.push(`DEFAULT ${defaultValue}`);
        processedCol.default = defaultValue;
      }
    }
    processedCol.option_key = options.join(' ').trim();
    console.log(`[SQLiteDAO][processColumnDefinition] Processed column ${col.name}:`, processedCol);
    return processedCol;
  }

  // ===========================================
  // SCHEMA INITIALIZATION FROM JSON
  // ===========================================

  async initializeFromSchema(
    schema: DatabaseSchemaWithTypeMapping,
  ): Promise<void> {
    console.log(`[SQLiteDAO][initializeFromSchema] Initializing schema for database: ${schema.database_name}, `);
    if (!this.isConnected()) {
      console.error(`[SQLiteDAO][initializeFromSchema] Database is not connected`);
      throw new Error('Database is not connected. Call connect() first.');
    }

    let hasExistingSchema = false;
    try {
      const result = await this.db!.executeSql(
        "SELECT version FROM _schema_info ORDER BY applied_at DESC LIMIT 1"
      );
      hasExistingSchema = result.length > 0 && result[0].rows.length > 0;
      console.log(`[SQLiteDAO][initializeFromSchema] Existing schema found: ${hasExistingSchema}`);
    } catch (error) {
      console.log(`[SQLiteDAO][initializeFromSchema] No existing schema found (expected for new database)`);
      hasExistingSchema = false;
    }

    if (hasExistingSchema && !this.createIfNotExists && !this.forceRecreate) {
      console.log(`[SQLiteDAO][initializeFromSchema] Database already has schema, skipping initialization`);
      // Vẫn set type mapping nếu có
      if (schema.type_mapping) {
        console.log(`[SQLiteDAO][initializeFromSchema] Setting type mapping from existing schema`);
        this.setTypeMappingConfig(schema.type_mapping);
      }
      return;
    }

    if (hasExistingSchema && this.forceRecreate) {
      console.log(`[SQLiteDAO][initializeFromSchema] Force recreating schema - dropping existing tables`);
      await this.dropAllTables();
    }

    this.log(`Initializing database from schema: ${schema.database_name}`);
    if (schema.type_mapping) {
      console.log(`[SQLiteDAO][initializeFromSchema] Setting type mapping from schema`);
      this.setTypeMappingConfig(schema.type_mapping);
    }

    try {
      // Thử enable foreign keys với fallback
      console.log(`[SQLiteDAO][initializeFromSchema] Attempting to enable foreign keys`);
      try {
        await this.db!.executeSql('PRAGMA foreign_keys = ON');
        console.log(`[SQLiteDAO][initializeFromSchema] Foreign keys enabled successfully`);
      } catch (pragmaError) {
        console.warn(`[SQLiteDAO][initializeFromSchema] Could not enable foreign keys, continuing:`, pragmaError);
      }

      console.log(`[SQLiteDAO][initializeFromSchema] Beginning transaction`);
      await this.beginTransaction();

      for (const [tableName, tableConfig] of Object.entries(schema.schemas)) {
        const tableDefinition: TableDefinition = {
          name: tableName,
          cols: tableConfig.cols.map(col => this.processColumnDefinition(col)),
          description: tableConfig.description,
          indexes: tableConfig.indexes,
          foreign_keys: tableConfig.foreign_keys,
        };
        this.log(`Creating table: ${tableName} with config:`, tableDefinition);
        await this.createTableWithForeignKeys(tableDefinition);
        this.log(`Created table: ${tableName}`);
      }

      for (const [tableName, tableConfig] of Object.entries(schema.schemas)) {
        if (tableConfig.indexes && tableConfig.indexes.length > 0) {
          console.log(`[SQLiteDAO][initializeFromSchema] Creating indexes for table: ${tableName}`);
          await this.createIndexesForTable(tableName, tableConfig.indexes);
        }
      }

      // ✅ Ghi version vào bảng metadata
      console.log(`[SQLiteDAO][initializeFromSchema] Set schema version ${schema.version}`);
      await this.setSchemaVersion(schema.version);

      console.log(`[SQLiteDAO][initializeFromSchema] Committing transaction`);
      await this.commitTransaction();
      this.log('Database schema initialized successfully from JSON config.');
    } catch (error) {
      console.error(`[SQLiteDAO][initializeFromSchema] Error initializing schema for '${schema.database_name}':`, (error as Error).stack);
      await this.rollbackTransaction();
      this.logError('Failed to initialize database schema:', error);
      throw error;
    }
  }

  async createTableWithForeignKeys(table: TableDefinition): Promise<string> {
    console.log(`[SQLiteDAO][createTableWithForeignKeys] Creating table: ${table.name}`);
    const columnDefs = table.cols.map(col =>
      `${col.name} ${col.type} ${col.option_key || ''}`.trim(),
    );
    const foreignKeyDefs: string[] = [];
    if (table.foreign_keys) {
      console.log(`[SQLiteDAO][createTableWithForeignKeys] Adding foreign keys for table: ${table.name}`);
      for (const fk of table.foreign_keys) {
        let fkSql = `FOREIGN KEY (${fk.column}) REFERENCES ${fk.references.table}(${fk.references.column})`;
        if (fk.on_delete) fkSql += ` ON DELETE ${fk.on_delete}`;
        if (fk.on_update) fkSql += ` ON UPDATE ${fk.on_update}`;
        foreignKeyDefs.push(fkSql);
      }
    }
    const allDefs = [...columnDefs, ...foreignKeyDefs];
    let sql = `CREATE TABLE IF NOT EXISTS ${table.name} (${allDefs.join(', ')})`;
    console.log(`[SQLiteDAO][createTableWithForeignKeys] Executing SQL for table ${table.name}: ${sql}`);
    const result = await this.runSql(sql);
    this.log(`Created table ${table.name} with foreign keys`);
    return result;
  }

  // ===========================================
  // THÊM CÁC PHƯƠNG THỨC KIỂM TRA PHIÊN BẢN
  // ===========================================
  private async dropAllTables(): Promise<void> {
    console.log(`[SQLiteDAO][dropAllTables] Dropping all existing tables`);
    try {
      const tables = await this.getRsts(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      await this.beginTransaction();

      for (const table of tables) {
        console.log(`[SQLiteDAO][dropAllTables] Dropping table: ${table.name}`);
        await this.runSql(`DROP TABLE IF EXISTS ${table.name}`);
      }

      await this.commitTransaction();
      console.log(`[SQLiteDAO][dropAllTables] All tables dropped successfully`);
    } catch (error) {
      await this.rollbackTransaction();
      console.error(`[SQLiteDAO][dropAllTables] Error dropping tables:`, error);
      throw error;
    }
  }

  // Method để kiểm tra schema version (tùy chọn)
  async getSchemaVersion(): Promise<string> {
    try {
      const result = await this.getRst('SELECT version FROM _schema_info ORDER BY applied_at DESC LIMIT 1');
      return result.version || '0';
    } catch {
      return '0';
    }
  }

  async setSchemaVersion(version: string): Promise<void> {
    await this.runSql(`CREATE TABLE IF NOT EXISTS _schema_info (
      version TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await this.runSql(`INSERT INTO _schema_info (version) VALUES (?)`, [version]);
  }

  // ===========================================
  // CONNECTION & TRANSACTION
  // ===========================================

  isConnected(): boolean {
    console.log(`[SQLiteDAO][isConnected] Checking connection status for database: ${this.dbName}, isOpen: ${this.isOpen}, db: ${!!this.db}`);
    return this.isOpen && !!this.db;
  }

  async beginTransaction(): Promise<void> {
    console.log(`[SQLiteDAO][beginTransaction] Starting transaction for database: ${this.dbName}`);
    if (this.inTransaction) {
      console.error(`[SQLiteDAO][beginTransaction] Transaction already in progress`);
      throw new Error('Transaction already in progress');
    }
    await this.runSql('BEGIN TRANSACTION');
    this.inTransaction = true;
    console.log(`[SQLiteDAO][beginTransaction] Transaction started`);
  }

  async commitTransaction(): Promise<void> {
    console.log(`[SQLiteDAO][commitTransaction] Committing transaction for database: ${this.dbName}`);
    if (!this.inTransaction) {
      console.error(`[SQLiteDAO][commitTransaction] No transaction in progress`);
      throw new Error('No transaction in progress');
    }
    await this.runSql('COMMIT');
    this.inTransaction = false;
    console.log(`[SQLiteDAO][commitTransaction] Transaction committed`);
  }

  async rollbackTransaction(): Promise<void> {
    console.log(`[SQLiteDAO][rollbackTransaction] Rolling back transaction for database: ${this.dbName}`);
    if (!this.inTransaction) {
      console.error(`[SQLiteDAO][rollbackTransaction] No transaction in progress`);
      throw new Error('No transaction in progress');
    }
    await this.runSql('ROLLBACK');
    this.inTransaction = false;
    console.log(`[SQLiteDAO][rollbackTransaction] Transaction rolled back`);
  }

  // ===========================================
  // TABLE & INDEX MANAGEMENT
  // ===========================================

  async getDatabaseInfo(): Promise<any> {
    console.log(`[SQLiteDAO][getDatabaseInfo] Retrieving database info for: ${this.dbName}`);
    const tables = await this.getRsts(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    const version = await this.getSchemaVersion(); // 🔄 đổi sang dùng bảng metadata
    const result = {
      name: this.dbName,
      tables: tables.map(t => t.name),
      isConnected: this.isConnected(),
      version
    };
    console.log(`[SQLiteDAO][getDatabaseInfo] Database info:`, result);
    return result;
  }

  async getTableInfo(tableName: string): Promise<any[]> {
    console.log(`[SQLiteDAO][getTableInfo] Retrieving table info for: ${tableName}`);
    const result = await this.getRsts(`PRAGMA table_info(${tableName})`);
    console.log(`[SQLiteDAO][getTableInfo] Table info for ${tableName}:`, result);
    return result;
  }

  async dropTable(tableName: string): Promise<string> {
    console.log(`[SQLiteDAO][dropTable] Dropping table: ${tableName}`);
    const sql = `DROP TABLE IF EXISTS ${tableName}`;
    const result = await this.runSql(sql);
    console.log(`[SQLiteDAO][dropTable] Table ${tableName} dropped successfully`);
    return result;
  }

  private async createIndexesForTable(
    tableName: string,
    indexes: IndexDefinition[],
  ): Promise<void> {
    console.log(`[SQLiteDAO][createIndexesForTable] Creating indexes for table: ${tableName}`);
    for (const index of indexes) {
      console.log(`[SQLiteDAO][createIndexesForTable] Creating index: ${index.name}`);
      await this.createIndexFromDefinition(tableName, index);
    }
    console.log(`[SQLiteDAO][createIndexesForTable] All indexes created for table: ${tableName}`);
  }

  async createIndexFromDefinition(
    tableName: string,
    indexDef: IndexDefinition,
  ): Promise<string> {
    console.log(`[SQLiteDAO][createIndexFromDefinition] Creating index ${indexDef.name} on table: ${tableName}`);
    const columns = indexDef.columns.join(', ');
    const isUnique = indexDef.unique || false;
    const sql = `CREATE ${isUnique ? 'UNIQUE' : ''} INDEX IF NOT EXISTS ${indexDef.name} ON ${tableName} (${columns})`;
    console.log(`[SQLiteDAO][createIndexFromDefinition] Executing SQL: ${sql}`);
    const result = await this.runSql(sql);
    console.log(`[SQLiteDAO][createIndexFromDefinition] Index ${indexDef.name} created successfully`);
    return result;
  }

  // ===========================================
  // CRUD OPERATIONS
  // ===========================================

  async insert(insertTable: QueryTable): Promise<string> {
    console.log(`[SQLiteDAO][insert] Inserting into table: ${insertTable.name}`);
    const validCols = insertTable.cols.filter(
      col => col.value !== undefined && col.value !== null,
    );
    if (validCols.length === 0) {
      console.error(`[SQLiteDAO][insert] No valid columns to insert into ${insertTable.name}`);
      throw new Error('No valid columns to insert');
    }
    const columnNames = validCols.map(col => col.name).join(', ');
    const placeholders = validCols.map(() => '?').join(', ');
    const params = validCols.map(col =>
      typeof col.value === 'object' ? JSON.stringify(col.value) : col.value,
    );
    const sql = `INSERT INTO ${insertTable.name} (${columnNames}) VALUES (${placeholders})`;
    console.log(`[SQLiteDAO][insert] Executing SQL: ${sql}, params:`, params);
    const result = await this.runSql(sql, params);
    console.log(`[SQLiteDAO][insert] Insert completed for table: ${insertTable.name}`);
    return result;
  }

  async update(updateTable: QueryTable): Promise<string> {
    console.log(`[SQLiteDAO][update] Updating table: ${updateTable.name}`);
    const setCols = updateTable.cols.filter(
      col =>
        col.value !== undefined &&
        !updateTable.wheres?.some(w => w.name === col.name),
    );
    if (setCols.length === 0) {
      console.error(`[SQLiteDAO][update] No columns to update in ${updateTable.name}`);
      throw new Error('No columns to update');
    }
    const setClause = setCols.map(col => `${col.name} = ?`).join(', ');
    const params = setCols.map(col =>
      typeof col.value === 'object' ? JSON.stringify(col.value) : col.value,
    );
    let sql = `UPDATE ${updateTable.name} SET ${setClause}`;
    const whereClause = this.buildWhereClause(updateTable.wheres);
    if (!whereClause.sql) {
      console.error(`[SQLiteDAO][update] WHERE clause required for update in ${updateTable.name}`);
      throw new Error('WHERE clause is required for UPDATE operation');
    }
    sql += whereClause.sql;
    params.push(...whereClause.params);
    console.log(`[SQLiteDAO][update] Executing SQL: ${sql}, params:`, params);
    const result = await this.runSql(sql, params);
    console.log(`[SQLiteDAO][update] Update completed for table: ${updateTable.name}`);
    return result;
  }

  async delete(deleteTable: QueryTable): Promise<string> {
    console.log(`[SQLiteDAO][delete] Deleting from table: ${deleteTable.name}`);
    let sql = `DELETE FROM ${deleteTable.name}`;
    const whereClause = this.buildWhereClause(deleteTable.wheres);
    if (!whereClause.sql) {
      console.error(`[SQLiteDAO][delete] WHERE clause required for delete in ${deleteTable.name}`);
      throw new Error('WHERE clause is required for DELETE operation');
    }
    sql += whereClause.sql;
    console.log(`[SQLiteDAO][delete] Executing SQL: ${sql}, params:`, whereClause.params);
    const result = await this.runSql(sql, whereClause.params);
    console.log(`[SQLiteDAO][delete] Delete completed for table: ${deleteTable.name}`);
    return result;
  }

  async select(selectTable: QueryTable): Promise<Record<string, any>> {
    console.log(`[SQLiteDAO][select] Selecting from table: ${selectTable.name}`);
    const { sql, params } = this.buildSelectQuery(selectTable, ' LIMIT 1');
    console.log(`[SQLiteDAO][select] Executing SQL: ${sql}, params:`, params);
    const result = await this.getRst(sql, params);
    console.log(`[SQLiteDAO][select] Select completed for table: ${selectTable.name}, result:`, result);
    return result;
  }

  async selectAll(selectTable: QueryTable): Promise<Record<string, any>[]> {
    console.log(`[SQLiteDAO][selectAll] Selecting all from table: ${selectTable.name}`);
    const { sql, params } = this.buildSelectQuery(selectTable);
    console.log(`[SQLiteDAO][selectAll] Executing SQL: ${sql}, params:`, params);
    const result = await this.getRsts(sql, params);
    console.log(`[SQLiteDAO][selectAll] Select all completed for table: ${selectTable.name}, results count: ${result.length}`);
    return result;
  }

  convertJsonToQueryTable(
    tableName: string,
    json: Record<string, any>,
    idFields: string[] = ['id'],
  ): QueryTable {
    console.log(`[SQLiteDAO][convertJsonToQueryTable] Converting JSON to QueryTable for table: ${tableName}`);
    const queryTable: QueryTable = { name: tableName, cols: [], wheres: [] };
    for (const [key, value] of Object.entries(json)) {
      queryTable.cols.push({ name: key, value });
      if (idFields.includes(key) && value !== undefined) {
        queryTable.wheres?.push({ name: key, value });
      }
    }
    console.log(`[SQLiteDAO][convertJsonToQueryTable] Converted QueryTable:`, queryTable);
    return queryTable;
  }

  // ===========================================
  // IMPORT UTILITY
  // ===========================================
  /**
   * Import dữ liệu từ mảng vào bảng với schema validation
   */
  public async importData(options: ImportOptions): Promise<ImportResult> {
    console.log(`[SQLiteDAO][importData] Starting import for table: ${options.tableName}, total rows: ${options.data.length}`);
    const startTime = Date.now();
    const result: ImportResult = {
      totalRows: options.data.length,
      successRows: 0,
      errorRows: 0,
      errors: [],
      executionTime: 0,
    };

    if (!this.isConnected()) {
      console.error(`[SQLiteDAO][importData] Database is not connected`);
      throw new Error('Database is not connected. Call connect() first.');
    }

    if (!options.data || options.data.length === 0) {
      console.log(`[SQLiteDAO][importData] No data to import`);
      result.executionTime = Date.now() - startTime;
      return result;
    }

    // Lấy thông tin schema của bảng
    console.log(`[SQLiteDAO][importData] Retrieving table info for: ${options.tableName}`);
    const tableInfo = await this.getTableInfo(options.tableName);
    if (tableInfo.length === 0) {
      console.error(`[SQLiteDAO][importData] Table '${options.tableName}' does not exist`);
      throw new Error(`Table '${options.tableName}' does not exist.`);
    }

    // Tạo map thông tin column
    console.log(`[SQLiteDAO][importData] Creating column map for table: ${options.tableName}`);
    const columnMap = new Map(
      tableInfo.map(col => [col.name.toLowerCase(), col]),
    );

    const batchSize = options.batchSize || 1000;
    let processedCount = 0;

    // Xác định có bỏ qua auto increment PK hay không
    const skipAutoIncrementPK = !options.includeAutoIncrementPK;
    console.log(`[SQLiteDAO][importData] Skip auto increment PK: ${skipAutoIncrementPK}`);

    try {
      console.log(`[SQLiteDAO][importData] Beginning transaction`);
      await this.beginTransaction();

      // Xử lý theo batch
      for (let i = 0; i < options.data.length; i += batchSize) {
        const batch = options.data.slice(i, i + batchSize);
        console.log(`[SQLiteDAO][importData] Processing batch ${i / batchSize + 1}, size: ${batch.length}`);

        for (let j = 0; j < batch.length; j++) {
          const rowIndex = i + j;
          const rowData = batch[j];

          try {
            // Validate và transform data
            console.log(`[SQLiteDAO][importData] Processing row ${rowIndex}`);
            const processedData = options.validateData
              ? this.validateAndTransformRow(
                rowData,
                columnMap,
                options.tableName,
                skipAutoIncrementPK,
              )
              : this.transformRowData(rowData, columnMap, skipAutoIncrementPK);
            console.log(`[SQLiteDAO][importData] Processed row ${rowIndex} data:`, processedData);

            // Thực hiện insert hoặc upsert
            if (options.updateOnConflict && options.conflictColumns) {
              console.log(`[SQLiteDAO][importData] Performing upsert for row ${rowIndex}`);
              await this.insertOrUpdate(
                options.tableName,
                processedData,
                options.conflictColumns,
              );
            } else {
              console.log(`[SQLiteDAO][importData] Performing insert for row ${rowIndex}`);
              await this.insertRow(options.tableName, processedData);
            }

            result.successRows++;
          } catch (error) {
            result.errorRows++;
            const errorInfo = {
              rowIndex,
              error: error instanceof Error ? error.message : String(error),
              rowData,
            };
            result.errors.push(errorInfo);
            console.error(`[SQLiteDAO][importData] Error processing row ${rowIndex}:`, (error as Error).stack);

            // Gọi callback error nếu có
            if (options.onError) {
              console.log(`[SQLiteDAO][importData] Calling onError callback for row ${rowIndex}`);
              options.onError(
                error instanceof Error ? error : new Error(String(error)),
                rowIndex,
                rowData,
              );
            }

            // Nếu không skip errors thì throw
            if (!options.skipErrors) {
              console.error(`[SQLiteDAO][importData] Throwing error due to skipErrors=false`);
              throw error;
            }
          }

          processedCount++;

          // Gọi progress callback
          if (options.onProgress && processedCount % 100 === 0) {
            console.log(`[SQLiteDAO][importData] Calling onProgress callback, processed: ${processedCount}/${options.data.length}`);
            options.onProgress(processedCount, options.data.length);
          }
        }
      }

      console.log(`[SQLiteDAO][importData] Committing transaction`);
      await this.commitTransaction();
      this.log(`Import completed: ${result.successRows}/${result.totalRows} rows successful`);
    } catch (error) {
      console.error(`[SQLiteDAO][importData] Error during import:`, (error as Error).stack);
      await this.rollbackTransaction();
      this.logError('Import failed:', error);
      throw error;
    }

    // Final progress callback
    if (options.onProgress) {
      console.log(`[SQLiteDAO][importData] Calling final onProgress callback, processed: ${processedCount}/${options.data.length}`);
      options.onProgress(processedCount, options.data.length);
    }

    result.executionTime = Date.now() - startTime;
    console.log(`[SQLiteDAO][importData] Import completed, execution time: ${result.executionTime}ms`);
    return result;
  }

  /**
   * Import với column mapping tùy chỉnh
   */
  public async importDataWithMapping(
    tableName: string,
    data: Record<string, any>[],
    columnMappings: ColumnMapping[],
    options: Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    console.log(`[SQLiteDAO][importDataWithMapping] Starting import with mapping for table: ${tableName}, total rows: ${data.length}`);
    // Transform data theo mapping
    const transformedData = data.map(row => {
      const newRow: Record<string, any> = {};
      console.log(`[SQLiteDAO][importDataWithMapping] Transforming row:`, row);

      columnMappings.forEach(mapping => {
        if (row.hasOwnProperty(mapping.sourceColumn)) {
          let value = row[mapping.sourceColumn];

          // Apply transform function nếu có
          if (mapping.transform) {
            console.log(`[SQLiteDAO][importDataWithMapping] Applying transform to column ${mapping.sourceColumn} -> ${mapping.targetColumn}`);
            value = mapping.transform(value);
          }

          newRow[mapping.targetColumn] = value;
        }
      });

      console.log(`[SQLiteDAO][importDataWithMapping] Transformed row:`, newRow);
      return newRow;
    });

    const result = await this.importData({
      tableName,
      data: transformedData,
      ...options,
    });
    console.log(`[SQLiteDAO][importDataWithMapping] Import completed for table: ${tableName}`);
    return result;
  }

  /**
   * Validate và transform dữ liệu theo schema
   */
  private validateAndTransformRow(
    rowData: Record<string, any>,
    columnMap: Map<string, any>,
    tableName: string,
    skipAutoIncrementPK: boolean = true,
  ): Record<string, any> {
    console.log(`[SQLiteDAO][validateAndTransformRow] Validating and transforming row for table: ${tableName}, skipAutoIncrementPK: ${skipAutoIncrementPK}`);
    const processedRow: Record<string, any> = {};

    // Kiểm tra các column bắt buộc
    for (const [columnName, columnInfo] of columnMap.entries()) {
      const isRequired = columnInfo.notnull === 1 && !columnInfo.dflt_value;
      const isPrimaryKey = columnInfo.pk === 1;
      const isAutoIncrementPK =
        isPrimaryKey && columnInfo.type.toLowerCase().includes('integer');

      // Bỏ qua primary key auto increment nếu skipAutoIncrementPK = true
      if (skipAutoIncrementPK && isAutoIncrementPK) {
        console.log(`[SQLiteDAO][validateAndTransformRow] Skipping auto increment PK: ${columnName}`);
        continue;
      }

      const value = this.findValueForColumn(rowData, columnName);
      console.log(`[SQLiteDAO][validateAndTransformRow] Processing column ${columnName}, value:`, value);

      if (isRequired && (value === null || value === undefined)) {
        console.error(`[SQLiteDAO][validateAndTransformRow] Required column '${columnName}' is missing or null in table '${tableName}'`);
        throw new Error(
          `Required column '${columnName}' is missing or null in table '${tableName}'`,
        );
      }

      if (value !== null && value !== undefined) {
        processedRow[columnName] = this.convertValueToColumnType(
          value,
          columnInfo.type,
        );
        console.log(`[SQLiteDAO][validateAndTransformRow] Converted value for ${columnName}:`, processedRow[columnName]);
      }
    }

    console.log(`[SQLiteDAO][validateAndTransformRow] Processed row:`, processedRow);
    return processedRow;
  }

  /**
   * Transform dữ liệu cơ bản
   */
  private transformRowData(
    rowData: Record<string, any>,
    columnMap: Map<string, any>,
    skipAutoIncrementPK: boolean = true,
  ): Record<string, any> {
    console.log(`[SQLiteDAO][transformRowData] Transforming row data for skipAutoIncrementPK: ${skipAutoIncrementPK}`);
    const processedRow: Record<string, any> = {};

    for (const [key, value] of Object.entries(rowData)) {
      const columnName = key.toLowerCase();
      const columnInfo = columnMap.get(columnName);

      // Kiểm tra columnInfo tồn tại trước khi sử dụng
      if (!columnInfo) {
        console.log(`[SQLiteDAO][transformRowData] Warning: Column '${key}' not found in table schema, skipping...`);
        this.log(`Warning: Column '${key}' not found in table schema, skipping...`);
        continue;
      }

      // Chỉ kiểm tra PK khi columnInfo đã được xác nhận tồn tại
      const isPrimaryKey = columnInfo.pk === 1;
      const isAutoIncrementPK =
        isPrimaryKey && columnInfo.type.toLowerCase().includes('integer');

      // Bỏ qua primary key auto increment nếu skipAutoIncrementPK = true
      if (skipAutoIncrementPK && isAutoIncrementPK) {
        console.log(`[SQLiteDAO][transformRowData] Skipping auto increment PK: ${key}`);
        continue;
      }

      // Transform dữ liệu nếu có giá trị
      if (value !== null && value !== undefined) {
        processedRow[key] = this.convertValueToColumnType(
          value,
          columnInfo.type,
        );
        console.log(`[SQLiteDAO][transformRowData] Transformed value for ${key}:`, processedRow[key]);
      }
    }

    console.log(`[SQLiteDAO][transformRowData] Processed row:`, processedRow);
    return processedRow;
  }

  /**
   * Tìm giá trị cho column (case-insensitive)
   */
  private findValueForColumn(
    rowData: Record<string, any>,
    columnName: string,
  ): any {
    console.log(`[SQLiteDAO][findValueForColumn] Finding value for column: ${columnName}`);
    // Tìm exact match trước
    if (rowData.hasOwnProperty(columnName)) {
      console.log(`[SQLiteDAO][findValueForColumn] Found exact match for ${columnName}:`, rowData[columnName]);
      return rowData[columnName];
    }

    // Tìm case-insensitive
    const lowerColumnName = columnName.toLowerCase();
    for (const [key, value] of Object.entries(rowData)) {
      if (key.toLowerCase() === lowerColumnName) {
        console.log(`[SQLiteDAO][findValueForColumn] Found case-insensitive match for ${columnName}:`, value);
        return value;
      }
    }

    console.log(`[SQLiteDAO][findValueForColumn] No value found for ${columnName}`);
    return undefined;
  }

  /**
   * Convert giá trị theo kiểu dữ liệu column
   */
  private convertValueToColumnType(value: any, columnType: string): any {
    console.log(`[SQLiteDAO][convertValueToColumnType] Converting value '${value}' to type: ${columnType}`);
    if (value === null || value === undefined) {
      console.log(`[SQLiteDAO][convertValueToColumnType] Value is null or undefined, returning null`);
      return null;
    }

    const type = columnType.toLowerCase();

    try {
      // INTEGER types
      if (type.includes('integer') || type.includes('int')) {
        if (typeof value === 'boolean') {
          console.log(`[SQLiteDAO][convertValueToColumnType] Converting boolean ${value} to INTEGER`);
          return value ? 1 : 0;
        }
        const num = parseInt(String(value));
        const result = isNaN(num) ? null : num;
        console.log(`[SQLiteDAO][convertValueToColumnType] Converted to INTEGER: ${result}`);
        return result;
      }

      // REAL/FLOAT types
      if (
        type.includes('real') ||
        type.includes('float') ||
        type.includes('decimal')
      ) {
        const num = parseFloat(String(value));
        const result = isNaN(num) ? null : num;
        console.log(`[SQLiteDAO][convertValueToColumnType] Converted to REAL/FLOAT: ${result}`);
        return result;
      }

      // BOOLEAN (SQLite stores as INTEGER)
      if (type.includes('boolean')) {
        if (typeof value === 'boolean') {
          console.log(`[SQLiteDAO][convertValueToColumnType] Converting boolean ${value} to INTEGER`);
          return value ? 1 : 0;
        }
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          const result = lower === 'true' || lower === '1' || lower === 'yes' ? 1 : 0;
          console.log(`[SQLiteDAO][convertValueToColumnType] Converted string ${value} to BOOLEAN: ${result}`);
          return result;
        }
        const result = value ? 1 : 0;
        console.log(`[SQLiteDAO][convertValueToColumnType] Converted to BOOLEAN: ${result}`);
        return result;
      }

      // JSON types
      if (type.includes('json')) {
        if (typeof value === 'object') {
          const result = JSON.stringify(value);
          console.log(`[SQLiteDAO][convertValueToColumnType] Converted object to JSON: ${result}`);
          return result;
        }
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            console.log(`[SQLiteDAO][convertValueToColumnType] Valid JSON string: ${value}`);
            return value;
          } catch {
            console.error(`[SQLiteDAO][convertValueToColumnType] Invalid JSON format for column type '${columnType}'`);
            throw new Error(`Invalid JSON format for column with type '${columnType}'`);
          }
        }
        const result = JSON.stringify(value);
        console.log(`[SQLiteDAO][convertValueToColumnType] Converted to JSON: ${result}`);
        return result;
      }

      // TIMESTAMP/DATETIME types
      if (type.includes('timestamp') || type.includes('datetime')) {
        if (value instanceof Date) {
          const result = value.toISOString();
          console.log(`[SQLiteDAO][convertValueToColumnType] Converted Date to ISO string: ${result}`);
          return result;
        }
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          const result = isNaN(date.getTime()) ? value : date.toISOString();
          console.log(`[SQLiteDAO][convertValueToColumnType] Converted to DATETIME: ${result}`);
          return result;
        }
        const result = String(value);
        console.log(`[SQLiteDAO][convertValueToColumnType] Converted to DATETIME string: ${result}`);
        return result;
      }

      // TEXT/VARCHAR/STRING types (default)
      const result = String(value);
      console.log(`[SQLiteDAO][convertValueToColumnType] Converted to TEXT: ${result}`);
      return result;
    } catch (error) {
      console.error(`[SQLiteDAO][convertValueToColumnType] Error converting value '${value}' to type '${columnType}':`, (error as Error).stack);
      this.logError(`Error converting value '${value}' to type '${columnType}':`, error);
      throw new Error(`Cannot convert value '${value}' to column type '${columnType}'`);
    }
  }

  /**
   * Insert một row
   */
  private async insertRow(
    tableName: string,
    data: Record<string, any>,
  ): Promise<void> {
    console.log(`[SQLiteDAO][insertRow] Inserting row into table: ${tableName}`);
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    console.log(`[SQLiteDAO][insertRow] Executing SQL: ${sql}, values:`, values);
    await this.runSql(sql, values);
    console.log(`[SQLiteDAO][insertRow] Row inserted successfully into ${tableName}`);
  }

  /**
   * Upsert một row (INSERT ... ON CONFLICT)
   */
  private async upsertRow(
    tableName: string,
    data: Record<string, any>,
    conflictColumns: string[],
  ): Promise<void> {
    console.log(`[SQLiteDAO][upsertRow] Upserting row into table: ${tableName}, conflict columns:`, conflictColumns);
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    // Tạo UPDATE SET clause
    const updateColumns = columns.filter(col => !conflictColumns.includes(col));
    const updateClause = updateColumns
      .map(col => `${col} = excluded.${col}`)
      .join(', ');

    let sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    if (updateColumns.length > 0) {
      sql += ` ON CONFLICT(${conflictColumns.join(', ')}) DO UPDATE SET ${updateClause}`;
    } else {
      sql += ` ON CONFLICT(${conflictColumns.join(', ')}) DO NOTHING`;
    }

    console.log(`[SQLiteDAO][upsertRow] Executing SQL: ${sql}, values:`, values);
    await this.runSql(sql, values);
    console.log(`[SQLiteDAO][upsertRow] Upsert completed for table: ${tableName}`);
  }

  /**
   * Thực hiện INSERT, nếu trùng thì UPDATE
   */
  private async insertOrUpdate(
    tableName: string,
    data: Record<string, any>,
    conflictColumns: string[],
  ): Promise<void> {
    console.log(`[SQLiteDAO][insertOrUpdate] Performing insert or update for table: ${tableName}, conflict columns:`, conflictColumns);
    try {
      console.log(`[SQLiteDAO][insertOrUpdate] Attempting insert`);
      await this.insertRow(tableName, data);
      console.log(`[SQLiteDAO][insertOrUpdate] Insert successful`);
    } catch (error) {
      // Nếu INSERT bị lỗi do conflict, thực hiện UPDATE
      if (this.isConflictError(error)) {
        console.log(`[SQLiteDAO][insertOrUpdate] Conflict detected, performing update`);
        await this.updateRowByColumns(tableName, data, conflictColumns);
        console.log(`[SQLiteDAO][insertOrUpdate] Update successful`);
      } else {
        console.error(`[SQLiteDAO][insertOrUpdate] Error during insert or update:`, (error as Error).stack);
        throw error;
      }
    }
  }

  /**
   * UPDATE một row dựa trên các cột conflict
   */
  private async updateRowByColumns(
    tableName: string,
    data: Record<string, any>,
    conflictColumns: string[],
  ): Promise<void> {
    console.log(`[SQLiteDAO][updateRowByColumns] Updating row in table: ${tableName}, conflict columns:`, conflictColumns);
    const allColumns = Object.keys(data);

    // Tách ra columns để update và columns để làm WHERE condition
    const updateColumns = allColumns.filter(
      col => !conflictColumns.includes(col),
    );
    const whereColumns = conflictColumns;

    if (updateColumns.length === 0) {
      console.log(`[SQLiteDAO][updateRowByColumns] No columns to update, skipping`);
      return;
    }

    // Tạo SET clause
    const setClause = updateColumns.map(col => `${col} = ?`).join(', ');

    // Tạo WHERE clause
    const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');

    // Tạo array values cho SET và WHERE
    const updateValues = updateColumns.map(col => data[col]);
    const whereValues = whereColumns.map(col => data[col]);
    const allValues = [...updateValues, ...whereValues];

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    console.log(`[SQLiteDAO][updateRowByColumns] Executing SQL: ${sql}, values:`, allValues);
    await this.runSql(sql, allValues);
    console.log(`[SQLiteDAO][updateRowByColumns] Update completed for table: ${tableName}`);
  }

  /**
   * Kiểm tra xem error có phải là conflict error không
   */
  private isConflictError(error: any): boolean {
    console.log(`[SQLiteDAO][isConflictError] Checking if error is conflict:`, error);
    if (
      error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      (error.message && error.message.includes('UNIQUE constraint failed'))
    ) {
      console.log(`[SQLiteDAO][isConflictError] Conflict error detected`);
      return true;
    }
    console.log(`[SQLiteDAO][isConflictError] Not a conflict error`);
    return false;
  }

  /**
   * Import dữ liệu từ CSV string
   */
  public async importFromCSV(
    tableName: string,
    csvData: string,
    options: {
      delimiter?: string;
      hasHeader?: boolean;
      columnMappings?: ColumnMapping[];
    } & Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    console.log(`[SQLiteDAO][importFromCSV] Starting CSV import for table: ${tableName}`);
    const delimiter = options.delimiter || ',';
    const hasHeader = options.hasHeader !== false; // default true

    // Parse CSV
    console.log(`[SQLiteDAO][importFromCSV] Parsing CSV data`);
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      console.error(`[SQLiteDAO][importFromCSV] CSV data is empty`);
      throw new Error('CSV data is empty');
    }

    let headers: string[] = [];
    let dataStartIndex = 0;

    if (hasHeader) {
      headers = lines[0]
        .split(delimiter)
        .map(h => h.trim().replace(/^["']|["']$/g, ''));
      dataStartIndex = 1;
      console.log(`[SQLiteDAO][importFromCSV] Parsed headers:`, headers);
    } else {
      // Tạo headers mặc định
      const firstRowCols = lines[0].split(delimiter).length;
      headers = Array.from({ length: firstRowCols }, (_, i) => `column_${i + 1}`);
      console.log(`[SQLiteDAO][importFromCSV] Generated default headers:`, headers);
    }

    // Convert CSV rows thành objects
    const data: Record<string, any>[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = lines[i]
        .split(delimiter)
        .map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, any> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      data.push(row);
    }
    console.log(`[SQLiteDAO][importFromCSV] Parsed ${data.length} rows from CSV`);

    // Import với hoặc không có column mapping
    if (options.columnMappings) {
      console.log(`[SQLiteDAO][importFromCSV] Importing with column mappings`);
      const result = await this.importDataWithMapping(
        tableName,
        data,
        options.columnMappings,
        options,
      );
      console.log(`[SQLiteDAO][importFromCSV] CSV import completed with mapping`);
      return result;
    } else {
      console.log(`[SQLiteDAO][importFromCSV] Importing without column mappings`);
      const result = await this.importData({
        tableName,
        data,
        ...options,
      });
      console.log(`[SQLiteDAO][importFromCSV] CSV import completed`);
      return result;
    }
  }

  // ===========================================
  // UTILITY & CORE METHODS
  // ===========================================

  private buildSelectQuery(
    selectTable: QueryTable,
    suffix: string = '',
  ): { sql: string; params: any[] } {
    console.log(`[SQLiteDAO][buildSelectQuery] Building select query for table: ${selectTable.name}`);
    const columns =
      selectTable.cols.length > 0
        ? selectTable.cols.map(col => col.name).join(', ')
        : '*';
    let sql = `SELECT ${columns} FROM ${selectTable.name}`;
    const whereClause = this.buildWhereClause(selectTable.wheres);
    sql += whereClause.sql;
    if (selectTable.orderbys?.length) {
      const orderBy = selectTable.orderbys
        .map(o => `${o.name} ${o.direction || 'ASC'}`)
        .join(', ');
      sql += ` ORDER BY ${orderBy}`;
    }
    if (selectTable.limitOffset) {
      if (selectTable.limitOffset.limit)
        sql += ` LIMIT ${selectTable.limitOffset.limit}`;
      if (selectTable.limitOffset.offset)
        sql += ` OFFSET ${selectTable.limitOffset.offset}`;
    }
    sql += suffix;
    console.log(`[SQLiteDAO][buildSelectQuery] Built query: ${sql}, params:`, whereClause.params);
    return { sql, params: whereClause.params };
  }

  private buildWhereClause(
    wheres?: WhereClause[],
    clause: string = 'WHERE',
  ): { sql: string; params: any[] } {
    console.log(`[SQLiteDAO][buildWhereClause] Building WHERE clause`);
    if (!wheres || wheres.length === 0) {
      console.log(`[SQLiteDAO][buildWhereClause] No WHERE conditions provided`);
      return { sql: '', params: [] };
    }
    const conditions: string[] = [];
    const params: any[] = [];
    for (const where of wheres) {
      conditions.push(`${where.name} = ?`);
      params.push(where.value);
    }
    const result = { sql: ` ${clause} ${conditions.join(' AND ')}`, params };
    console.log(`[SQLiteDAO][buildWhereClause] Built WHERE clause:`, result);
    return result;
  }

  async ensureConnected(): Promise<void> {
    this.log('[SQLiteDAO][ensureConnected]', 'Checking database connection');
    if (!this.isConnected()) {
      this.log('[SQLiteDAO][ensureConnected]', 'Database not connected, attempting to connect');
      try {
        await this.connect();
        this.log('[SQLiteDAO][ensureConnected]', 'Database connection established');
      } catch (err) {
        this.logError('[SQLiteDAO][ensureConnected]', 'Failed to connect to database:', (err as Error).stack);
        throw new Error(`Failed to connect to database: ${err}`);
      }
    }

  }

  async runSql(sql: string, params: any[] = []): Promise<string> {
    console.log(`[SQLiteDAO][runSql] Executing SQL: ${sql}, params:`, params);
    if (!this.db || !this.isOpen) {
      console.error(`[SQLiteDAO][runSql] Database is not initialized`);
      throw new Error('Database is not initialized');
    }

    try {
      this.log(`Executing SQL: ${sql}`, params);
      await this.db.executeSql(sql, params);
      console.log(`[SQLiteDAO][runSql] SQL executed successfully: ${sql}`);
      return `Executed: ${sql}`;
    } catch (error) {
      console.error(`[SQLiteDAO][runSql] SQL execution error: ${sql}:`, (error as Error).stack);
      this.logError(`SQL execution error: ${sql}`, error);
      throw error;
    }
  }

  async getRst(sql: string, params: any[] = []): Promise<Record<string, any>> {
    console.log(`[SQLiteDAO][getRst] Executing single-row query: ${sql}, params:`, params);
    if (!this.db || !this.isOpen) {
      console.error(`[SQLiteDAO][getRst] Database is not initialized`);
      throw new Error('Database is not initialized');
    }

    try {
      const results = await this.db.executeSql(sql, params);
      if (results.length > 0 && results[0].rows.length > 0) {
        const result = results[0].rows.item(0);
        console.log(`[SQLiteDAO][getRst] Query result:`, result);
        return result;
      }
      console.log(`[SQLiteDAO][getRst] No results found for query: ${sql}`);
      return {};
    } catch (error) {
      console.error(`[SQLiteDAO][getRst] SQL query error: ${sql}:`, (error as Error).stack);
      this.logError(`SQL query error: ${sql}`, error);
      throw error;
    }
  }

  async getRsts(
    sql: string,
    params: any[] = [],
  ): Promise<Record<string, any>[]> {
    console.log(`[SQLiteDAO][getRsts] Executing multi-row query: ${sql}, params:`, params);
    if (!this.db || !this.isOpen) {
      console.error(`[SQLiteDAO][getRsts] Database is not initialized`);
      throw new Error('Database is not initialized');
    }

    try {
      const results = await this.db.executeSql(sql, params);
      const rows: Record<string, any>[] = [];
      if (results.length > 0) {
        const result = results[0];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
      }
      console.log(`[SQLiteDAO][getRsts] Query returned ${rows.length} rows`);
      return rows;
    } catch (error) {
      console.error(`[SQLiteDAO][getRsts] SQL query error: ${sql}:`, (error as Error).stack);
      this.logError(`SQL query error: ${sql}`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    console.log(`[SQLiteDAO][close] Closing database: ${this.dbName}`);
    if (this.db && this.isOpen) {
      try {
        await this.db.close();
        this.log(`Database closed`);
        this.isOpen = false;
        this.db = null;
        console.log(`[SQLiteDAO][close] Database closed successfully`);
      } catch (err) {
        console.error(`[SQLiteDAO][close] Error closing database:`, (err as Error));
        this.logError('Error closing database:', err);
        throw err;
      }
    } else {
      console.log(`[SQLiteDAO][close] Database is already closed or not initialized`);
    }
  }
}

export default SQLiteDAO;
import {DatabaseManager, SQLiteDAO} from '../../database';
export class CrossSchemaService {
  private daos: Record<string, SQLiteDAO>;

  constructor(schemaNames: string[]) {
    this.daos = {};
    schemaNames.forEach(name => {
      this.daos[name] = DatabaseManager.get(name);
    });
  }

  async executeCrossSchemaQuery(
    query: string,
    params: any[] = [],
  ): Promise<any[]> {
    // Chọn DAO chính (ví dụ: schema 'core')
    const primaryDao = this.daos['core'];
    return primaryDao.getRsts(query, params);
  }

  //   Ví dụ một câu lệnh query join 2 bảng với nhau
  async joinUsersAndAnalytics(userId: string): Promise<any> {
    const query = `
      SELECT u.*, a.*
      FROM core.users u
      JOIN analytics.user_activities a ON u.id = a.user_id
      WHERE u.id = ?
    `;
    return this.executeCrossSchemaQuery(query, [userId]);
  }
}

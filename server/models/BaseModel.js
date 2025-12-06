/**
 * Base Model Class
 * Provides common database operations for all models
 */
import pool from '../config/database.js';

export class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Execute a query
   */
  async query(text, params) {
    try {
      const result = await this.pool.query(text, params);
      // Log row count for INSERT/UPDATE/DELETE
      if (result.command === 'INSERT' || result.command === 'UPDATE' || result.command === 'DELETE') {
        console.log(`💾 ${result.command} executed in ${this.tableName}: ${result.rowCount} row(s) affected`);
      }
      return result;
    } catch (error) {
      console.error(`❌ Database query error in ${this.tableName}:`, error.message);
      console.error('   Error code:', error.code);
      console.error('   Query:', text.substring(0, 200));
      console.error('   Params:', params);
      if (error.detail) {
        console.error('   Detail:', error.detail);
      }
      if (error.hint) {
        console.error('   Hint:', error.hint);
      }
      throw error;
    }
  }

  /**
   * Find all records
   */
  async findAll(conditions = {}, options = {}) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    let paramCount = 1;

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = $${paramCount++}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(options.offset);
    }

    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Find one record by ID
   */
  async findById(id, idColumn = 'id') {
    const query = `SELECT * FROM ${this.tableName} WHERE ${idColumn} = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find one record by conditions
   */
  async findOne(conditions) {
    const records = await this.findAll(conditions, { limit: 1 });
    return records[0] || null;
  }

  /**
   * Create a new record
   */
  async create(data, returning = '*') {
    const keys = Object.keys(data);
    // Convert Date objects to ISO strings for PostgreSQL
    const values = Object.values(data).map(value => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returning}
    `;

    try {
      console.log(`📝 Creating record in ${this.tableName}:`, { keys, valuesCount: values.length });
      const result = await this.query(query, values);
      console.log(`✅ Record created in ${this.tableName}:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Failed to create record in ${this.tableName}:`, error.message);
      console.error('   Query:', query);
      console.error('   Values:', values);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(id, data, idColumn = 'id', returning = '*') {
    const keys = Object.keys(data);
    // Convert Date objects to ISO strings for PostgreSQL
    const values = Object.values(data).map(value => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${idColumn} = $1
      RETURNING ${returning}
    `;

    try {
      console.log(`📝 Updating record in ${this.tableName} (${idColumn}=${id}):`, { keys, valuesCount: values.length });
      const result = await this.query(query, [id, ...values]);
      if (result.rows[0]) {
        console.log(`✅ Record updated in ${this.tableName}:`, result.rows[0]);
      } else {
        console.warn(`⚠️  No record found to update in ${this.tableName} (${idColumn}=${id})`);
      }
      return result.rows[0] || null;
    } catch (error) {
      console.error(`❌ Failed to update record in ${this.tableName}:`, error.message);
      console.error('   Query:', query);
      console.error('   ID:', id);
      console.error('   Values:', values);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(id, idColumn = 'id') {
    const query = `DELETE FROM ${this.tableName} WHERE ${idColumn} = $1 RETURNING *`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Count records
   */
  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];
    let paramCount = 1;

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = $${paramCount++}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const result = await this.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Execute raw query
   */
  async rawQuery(query, params) {
    return await this.query(query, params);
  }
}


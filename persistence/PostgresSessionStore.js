import { SessionStore } from './SessionStore.js';
import pg from 'pg';

export class PostgresSessionStore extends SessionStore {
  constructor(connectionString = null) {
    super();
    this.pool = new pg.Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.tableInitialized = false;
    console.log('PostgresSessionStore initialized');
  }
  
  async ensureTable() {
    if (this.tableInitialized) return;
    
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          domain VARCHAR(100),
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_sessions_domain ON sessions(domain);
        CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
      `);
      
      this.tableInitialized = true;
      console.log('Sessions table ready');
    } catch (error) {
      console.error('Error creating sessions table:', error);
      throw error;
    }
  }
  
  async save(sessionId, data) {
    console.log(`[PostgresSessionStore] save() called for session: ${sessionId}`);
    await this.ensureTable();
    
    const sessionData = {
      ...data,
      savedAt: new Date().toISOString()
    };
    
    try {
      await this.pool.query(`
        INSERT INTO sessions (id, data, domain, last_activity)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          data = $2,
          domain = $3,
          last_activity = $4
      `, [
        sessionId,
        JSON.stringify(sessionData),
        data.domain || null,
        new Date()
      ]);
      
      console.log(`[PostgresSessionStore] SUCCESS: Session saved ${sessionId} (${data.history.length} messages)`);
    } catch (error) {
      console.error(`[PostgresSessionStore] ERROR saving ${sessionId}:`, error.message);
      throw error;
    }
  }
  
  async load(sessionId) {
    await this.ensureTable();
    
    try {
      const result = await this.pool.query(
        'SELECT data FROM sessions WHERE id = $1',
        [sessionId]
      );
      
      if (result.rows.length === 0) {
        console.log(`Session not found: ${sessionId}`);
        return null;
      }
      
      const data = result.rows[0].data;
      console.log(`Session loaded: ${sessionId} (${data.history.length} messages)`);
      return data;
    } catch (error) {
      console.error(`Error loading session ${sessionId}:`, error);
      throw error;
    }
  }
  
  async exists(sessionId) {
    await this.ensureTable();
    
    try {
      const result = await this.pool.query(
        'SELECT 1 FROM sessions WHERE id = $1',
        [sessionId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error checking session existence ${sessionId}:`, error);
      return false;
    }
  }
  
  async delete(sessionId) {
    await this.ensureTable();
    
    try {
      await this.pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
      console.log(`Session deleted: ${sessionId}`);
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }
  
  async cleanupOldSessions() {
    await this.ensureTable();
    
    const maxAgeHours = parseInt(process.env.SESSION_RETENTION_HOURS || '72');
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    try {
      const result = await this.pool.query(
        'DELETE FROM sessions WHERE last_activity < $1',
        [cutoffDate]
      );
      
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} expired sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }
  
  async getAllSessions() {
    await this.ensureTable();
    
    try {
      const result = await this.pool.query(
        'SELECT id, data, domain, last_activity, created_at FROM sessions ORDER BY last_activity DESC'
      );
      
      return result.rows.map(row => ({
        id: row.id,
        ...row.data,
        domain: row.domain,
        lastActivity: row.last_activity,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }
  
  // Analytics methods for client reporting
  async getSessionCount(domain = null) {
    await this.ensureTable();
    
    try {
      let query = 'SELECT COUNT(*) FROM sessions';
      const params = [];
      
      if (domain) {
        query += ' WHERE domain = $1';
        params.push(domain);
      }
      
      const result = await this.pool.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  }
  
  async getSessionStats(domain = null, daysBack = 30) {
    await this.ensureTable();
    
    try {
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      
      let query = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(DISTINCT domain) as unique_domains,
          MIN(created_at) as first_session,
          MAX(last_activity) as last_activity
        FROM sessions
        WHERE created_at >= $1
      `;
      const params = [cutoffDate];
      
      if (domain) {
        query += ' AND domain = $2';
        params.push(domain);
      }
      
      const result = await this.pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  }
  
  async close() {
    console.log('Closing PostgreSQL connection pool...');
    await this.pool.end();
  }
}
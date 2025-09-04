import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionStore } from './SessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileSessionStore extends SessionStore {
  constructor(basePath = null) {
    super();
    this.basePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || 
                    basePath || 
                    path.join(__dirname, '..', 'sessions');
    this.directoryEnsured = false;
    console.log(`FileSessionStore using path: ${this.basePath}`);
  }
  
  async ensureDirectory() {
    if (this.directoryEnsured) return;
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
      console.log(`Created sessions directory: ${this.basePath}`);
    }
    this.directoryEnsured = true;
  }
  
  async save(sessionId, data) {
    console.log(`[FileSessionStore] save() called for session: ${sessionId}`);
    await this.ensureDirectory();
    const filepath = path.join(this.basePath, `${sessionId}.json`);
    console.log(`[FileSessionStore] Writing to: ${filepath}`);
    const sessionData = {
      ...data,
      savedAt: new Date().toISOString()
    };
    try {
      await fs.writeFile(filepath, JSON.stringify(sessionData, null, 2));
      console.log(`[FileSessionStore] SUCCESS: Session saved ${sessionId} (${data.history.length} messages)`);
    } catch (error) {
      console.error(`[FileSessionStore] ERROR saving ${sessionId}:`, error.message);
      throw error;
    }
  }
  
  async load(sessionId) {
    await this.ensureDirectory();
    try {
      const filepath = path.join(this.basePath, `${sessionId}.json`);
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);
      console.log(`Session loaded: ${sessionId} (${data.history.length} messages)`);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Session not found: ${sessionId}`);
        return null;
      }
      throw error;
    }
  }
  
  async exists(sessionId) {
    try {
      const filepath = path.join(this.basePath, `${sessionId}.json`);
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
  
  async delete(sessionId) {
    try {
      const filepath = path.join(this.basePath, `${sessionId}.json`);
      await fs.unlink(filepath);
      console.log(`Session deleted: ${sessionId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  
  async cleanupOldSessions() {
    await this.ensureDirectory();
    const maxAgeHours = parseInt(process.env.SESSION_RETENTION_HOURS || '72');
    const files = await fs.readdir(this.basePath);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    let cleaned = 0;
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filepath = path.join(this.basePath, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const session = JSON.parse(content);
        
        // Use lastActivity for age check
        const age = now - (session.lastActivity || 0);
        if (age > maxAge) {
          await fs.unlink(filepath);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning session ${file}:`, error.message);
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }
  
  async getAllSessions() {
    await this.ensureDirectory();
    const files = await fs.readdir(this.basePath);
    const sessions = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const sessionId = path.basename(file, '.json');
      const session = await this.load(sessionId);
      if (session) {
        sessions.push({ id: sessionId, ...session });
      }
    }
    
    return sessions;
  }
}

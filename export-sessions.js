#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const sessionsDir = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH)
  : path.join(process.cwd(), 'sessions');

console.log(`Reading sessions from: ${sessionsDir}`);

try {
  const files = fs.readdirSync(sessionsDir);
  const sessions = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(sessionsDir, file), 'utf8');
      sessions.push(JSON.parse(content));
    }
  }
  
  console.log(JSON.stringify({
    count: sessions.length,
    timestamp: new Date().toISOString(),
    sessions: sessions
  }, null, 2));
  
} catch (error) {
  console.error('Error reading sessions:', error.message);
  process.exit(1);
}

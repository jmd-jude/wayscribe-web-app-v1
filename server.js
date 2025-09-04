import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs/promises';
import { FileSessionStore } from './persistence/FileSessionStore.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import bundled domain context and config
import { DOMAIN_CONTEXT, DOMAIN_CONFIG } from './domain-context.js';

const app = express();

// Debug: Check if API key is loaded
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- API Key present:', !!process.env.ANTHROPIC_API_KEY);
console.log('- API Key length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('- API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));
console.log('- Admin Key present:', !!process.env.ADMIN_API_KEY);
console.log('- All env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', '));

// Check if the key is undefined or empty
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('CRITICAL: ANTHROPIC_API_KEY is not set!');
  console.error('Please check Railway environment variables');
}

const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: .pdf, .txt, .md'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Key'],
  credentials: true
}));

// Allow iframe embedding - remove X-Frame-Options
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
});

// Debug route - test if server responds at all
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ test: 'working' });
});

// Session storage (file-based)
const sessionStore = new FileSessionStore();

// Admin export endpoint - MUST BE BEFORE static files
app.get('/api/admin/export', async (req, res) => {
  console.log('Admin export endpoint hit - headers:', req.headers);
  if (!process.env.ADMIN_API_KEY) {
    return res.status(501).json({ error: 'Admin export not configured' });
  }
  if (req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const sessions = await sessionStore.getAllSessions();
  res.json({ count: sessions.length, domain: DOMAIN_CONFIG.manifest.domain, sessions });
});

// ALL OTHER API ROUTES MUST BE HERE BEFORE STATIC FILES

// Serve static files - BUT NOT FOR API ROUTES
if (process.env.NODE_ENV === 'production') {
  // Serve React build ONLY for non-API routes
  const distPath = path.join(__dirname, 'dist');
  app.use((req, res, next) => {
    // Skip static files for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Serve static files for everything else
    express.static(distPath, {
      index: false,  // Don't serve index.html as default
      fallthrough: true  // Pass through to next handler if file not found
    })(req, res, next);
  });
  
  // Explicitly serve index.html only for root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Serve vanilla files in development
  app.use(express.static(__dirname));
}

// Cleanup old sessions hourly
setInterval(async () => {
  try {
    await sessionStore.cleanupOldSessions();
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}, 60 * 60 * 1000); // Every hour

// Initialize session with cached context
app.post('/api/session/init', async (req, res) => {
  try {
    const sessionId = randomUUID();
    console.log(`Initializing session: ${sessionId}`);
    
    // Create initial consultation with cached context
    // Retry logic for rate limits
    let retries = 0;
    let response;
    
    while (retries < 3) {
      try {
        response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: [{
            type: 'text',
            text: DOMAIN_CONTEXT,
            cache_control: { type: 'ephemeral' }
          }],
          messages: [{ 
            role: 'user', 
            content: 'Begin consultation' 
          }]
        }, {
          headers: {
            'anthropic-beta': 'prompt-caching-2024-07-31'
          }
        });
        
        // If successful, break out of retry loop
        break;
        
      } catch (error) {
        if (error.status === 429 && retries < 2) {
          // Rate limit error - wait and retry
          const retryAfter = parseInt(error.headers?.['retry-after'] || '60');
          console.log(`Rate limit hit. Waiting ${retryAfter} seconds before retry ${retries + 1}...`);
          
          // Send a response to the client to wait
          if (retries === 0) {
            res.status(503).json({ 
              error: 'Rate limit reached. Please wait a moment and try again.',
              retryAfter 
            });
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          retries++;
        } else {
          // Other error or max retries reached
          throw error;
        }
      }
    }
    
    // Save session to disk
    await sessionStore.save(sessionId, {
      history: [
        { role: 'user', content: 'Begin consultation' },
        { role: 'assistant', content: response.content[0].text }
      ],
      lastActivity: Date.now(),
      cacheCreatedAt: Date.now(),
      domain: DOMAIN_CONFIG.manifest.domain
    });
    
    console.log(`Session ${sessionId} initialized and persisted. Cache usage:`, {
      cached_tokens: response.usage.cache_read_input_tokens || 0,
      new_tokens: response.usage.input_tokens || 0
    });
    
    res.json({ 
      sessionId,
      welcome: response.content[0].text,
      config: DOMAIN_CONFIG
    });
    
  } catch (error) {
    console.error('Error initializing session:', error);
    res.status(500).json({ 
      error: 'Failed to initialize consultation',
      details: error.message 
    });
  }
});

// Continue conversation using cached context
app.post('/api/consult/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    // Load session from disk
    const session = await sessionStore.load(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log(`Consultation request for session ${sessionId}`);
    
    // Update conversation history
    session.history.push({ role: 'user', content: message });
    
    // Use cached context for efficient API calls
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: [{
        type: 'text', 
        text: DOMAIN_CONTEXT,
        cache_control: { type: 'ephemeral' }
      }],
      messages: session.history
    }, {
      headers: {
        'anthropic-beta': 'prompt-caching-2024-07-31'
      }
    });
    
    // Add response to history
    const assistantMessage = response.content[0].text;
    session.history.push({ 
      role: 'assistant', 
      content: assistantMessage 
    });
    session.lastActivity = Date.now();
    
    // Save updated session to disk
    await sessionStore.save(sessionId, session);
    
    // Log token usage
    const usage = {
      cached_tokens: response.usage.cache_read_input_tokens || 0,
      new_tokens: response.usage.input_tokens || 0,
      total_tokens: (response.usage.cache_read_input_tokens || 0) + (response.usage.input_tokens || 0),
      output_tokens: response.usage.output_tokens || 0
    };
    
    console.log(`Session ${sessionId} - Token usage:`, usage);
    
    res.json({ 
      response: assistantMessage,
      usage
    });
    
  } catch (error) {
    console.error('Error in consultation:', error);
    res.status(500).json({ 
      error: 'Failed to process consultation',
      details: error.message 
    });
  }
});

// File upload endpoint
app.post('/api/upload/:sessionId', upload.single('file'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionStore.load(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`File upload for session ${sessionId}: ${req.file.originalname}`);
    
    // Read file content
    let fileContent;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (ext === '.txt' || ext === '.md') {
      // Text files can be read directly
      fileContent = await fs.readFile(req.file.path, 'utf-8');
    } else if (ext === '.pdf') {
      // Parse PDF files
      try {
        // Change to the server directory to avoid pdf-parse path issues
        const originalCwd = process.cwd();
        process.chdir(__dirname);
        
        const pdfParse = (await import('pdf-parse')).default;
        const pdfBuffer = await fs.readFile(req.file.path);
        const pdfData = await pdfParse(pdfBuffer);
        fileContent = pdfData.text;
        
        // Restore original directory
        process.chdir(originalCwd);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        fileContent = `[PDF parsing failed for ${req.file.originalname}. The file was uploaded but could not be read.]`;
      }
    } else {
      // For DOC/DOCX, would need additional libraries
      fileContent = `[File uploaded: ${req.file.originalname} - ${req.file.size} bytes]`;
    }
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    // Create message with file content
    const message = `I've uploaded a file: ${req.file.originalname}\n\nFile content:\n${fileContent}`;
    
    // Add to conversation history
    session.history.push({ role: 'user', content: message });
    
    // Get Claude's response
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: [{
        type: 'text', 
        text: DOMAIN_CONTEXT,
        cache_control: { type: 'ephemeral' }
      }],
      messages: session.history
    }, {
      headers: {
        'anthropic-beta': 'prompt-caching-2024-07-31'
      }
    });
    
    // Add response to history
    const assistantMessage = response.content[0].text;
    session.history.push({ 
      role: 'assistant', 
      content: assistantMessage 
    });
    session.lastActivity = Date.now();
    
    // Save updated session with file upload
    await sessionStore.save(sessionId, session);
    
    // Log token usage
    const usage = {
      cached_tokens: response.usage.cache_read_input_tokens || 0,
      new_tokens: response.usage.input_tokens || 0,
      output_tokens: response.usage.output_tokens || 0
    };
    
    console.log(`Session ${sessionId} - File upload token usage:`, usage);
    
    res.json({ 
      response: assistantMessage,
      usage,
      filename: req.file.originalname,
      fileSize: req.file.size
    });
    
  } catch (error) {
    console.error('Error in file upload:', error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      error: 'Failed to process file upload',
      details: error.message 
    });
  }
});

// Check if session exists
app.get('/api/session/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionStore.load(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        exists: false,
        message: 'Session not found or expired' 
      });
    }
    
    res.json({
      exists: true,
      messageCount: session.history.length,
      lastActivity: new Date(session.lastActivity).toISOString(),
      domain: session.domain || DOMAIN_CONFIG.manifest.domain
    });
  } catch (error) {
    console.error('Error checking session status:', error);
    res.status(500).json({ error: 'Failed to check session status' });
  }
});

// Restore session for frontend
app.get('/api/session/:sessionId/restore', async (req, res) => {
  console.log(`Restore request for session: ${req.params.sessionId}`);
  try {
    const { sessionId } = req.params;
    const session = await sessionStore.load(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found',
        suggestion: 'Start a new consultation' 
      });
    }
    
    // Return full conversation history with roles
    const messages = session.history;
    
    res.json({
      sessionId,
      messages,  // Assistant messages only for UI
      config: DOMAIN_CONFIG,
      lastActivity: session.lastActivity
    });
    
    console.log(`Session ${sessionId} restored with ${messages.length} assistant messages`);
  } catch (error) {
    console.error('Error restoring session:', error);
    res.status(500).json({ error: 'Failed to restore session' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Session info endpoint (for debugging)
app.get('/api/session/:sessionId/info', async (req, res) => {
  const session = await sessionStore.load(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: req.params.sessionId,
    messageCount: session.history.length,
    lastActivity: new Date(session.lastActivity).toISOString(),
    cacheAge: Math.round((Date.now() - session.cacheCreatedAt) / 1000) + ' seconds'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Catch-all route for React - MUST be after all API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 ${DOMAIN_CONFIG.manifest.display_name} ready on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Context size: ${Math.round(Buffer.byteLength(DOMAIN_CONTEXT, 'utf8') / 1024)}KB`);
});

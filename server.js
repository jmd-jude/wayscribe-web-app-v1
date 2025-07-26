import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import bundled domain context
import { DOMAIN_CONTEXT } from './domain-context.js';

const app = express();

// Debug: Check if API key is loaded
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- API Key present:', !!process.env.ANTHROPIC_API_KEY);
console.log('- API Key length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('- API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));
console.log('- All env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', '));

// Check if the key is undefined or empty
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('CRITICAL: ANTHROPIC_API_KEY is not set!');
  console.error('Please check Railway environment variables');
}

const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Allow iframe embedding - remove X-Frame-Options
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
});

// Serve static files
app.use(express.static(__dirname));

// Session storage (in-memory)
const sessions = new Map();

// Cleanup old sessions (5 min timeout)
setInterval(() => {
  const timeout = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > timeout) {
      sessions.delete(id);
      console.log(`Session ${id} expired and removed`);
    }
  }
}, 60000); // Check every minute

// Initialize session with cached context
app.post('/api/session/init', async (req, res) => {
  try {
    const sessionId = randomUUID();
    console.log(`Initializing session: ${sessionId}`);
    
    // Create initial consultation with cached context
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
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
    
    // Store session
    sessions.set(sessionId, {
      history: [
        { role: 'user', content: 'Begin consultation' },
        { role: 'assistant', content: response.content[0].text }
      ],
      lastActivity: Date.now(),
      cacheCreatedAt: Date.now()
    });
    
    console.log(`Session ${sessionId} initialized. Cache usage:`, {
      cached_tokens: response.usage.cache_read_input_tokens || 0,
      new_tokens: response.usage.input_tokens || 0
    });
    
    res.json({ 
      sessionId,
      welcome: response.content[0].text
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
    
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log(`Consultation request for session ${sessionId}`);
    
    // Update conversation history
    session.history.push({ role: 'user', content: message });
    
    // Use cached context for efficient API calls
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    sessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

// Session info endpoint (for debugging)
app.get('/api/session/:sessionId/info', (req, res) => {
  const session = sessions.get(req.params.sessionId);
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

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 IBD Nutrition Navigator consultation ready on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Context size: ${Math.round(Buffer.byteLength(DOMAIN_CONTEXT, 'utf8') / 1024)}KB`);
});

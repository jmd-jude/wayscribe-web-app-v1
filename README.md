# Wayscribe Platform

Transform domain expertise into AI-powered consultation services. Wayscribe enables subject matter experts to scale their methodologies through personalized, interactive consultations powered by Claude.

## Features

### Core Capabilities
- **Domain-Agnostic Architecture** - Deploy any expertise domain without code changes
- **Consultation-First Design** - Natural conversational flow, not Q&A chatbot
- **Artifact Generation** - Automatically creates deliverables (reports, plans, analyses) during consultations
- **Session Persistence** - Consultations survive page refreshes with shareable URLs
- **Prompt Caching** - Cost reduction through Claude's caching API
- **Multi-Domain Support** - Single codebase serves multiple expertise domains

### Current Domains
- **IBD Nutrition Navigator** - Evidence-based nutrition therapy for inflammatory bowel disease
- **Smarter PreMed** - Medical school application guidance
- **Medicare/Medicaid Navigator** - Massachusetts counseling for healthcare coverage
- **PR Crisis Management** - Crisis communication framework
- **Signal Transformation** - Product strategy methodology
- **Covered Call Advisory** - Conservative options trading strategy guidance

## Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key
- Railway account (for deployment)

### Local Development
```bash
# Clone repository
git clone https://github.com/dgmulei/wayscribe-web-app-v1
cd wayscribe-web-app-v1

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Build domain context (default: ibd-nutrition)
npm run build

# Or specify a domain
DOMAIN=smarter-premed npm run build

# Start server
npm start

# Visit http://localhost:3000
```

### Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables in Railway dashboard
ANTHROPIC_API_KEY=sk-ant-...
DOMAIN=ibd-nutrition
NODE_ENV=production
SESSION_RETENTION_HOURS=72

# Deploy
railway up
```

## How It Works

### Domain Architecture
Each domain consists of:
- **9 Configuration Files** - Define consultation behavior, deliverables, and personalization
- **System Instructions** - Expert's consultation approach and voice
- **Knowledge Files** - Core expertise, methodologies, frameworks
- **Templates** - Structured deliverables that emerge during consultations

### Consultation Flow
1. **Context Building** - `build-context.js` bundles all domain files into a single system prompt
2. **Session Initialization** - Creates cached context with Claude API for cost efficiency
3. **Conversational Interaction** - Natural dialogue following expert's methodology
4. **Artifact Emergence** - Deliverables generated naturally when understanding crystallizes
5. **Session Persistence** - Conversations saved with shareable URLs

## Usage Guide

### Adding a New Domain

1. **Create Domain Folder**
```
domain-files/
└── your-domain/
    ├── manifest-config.json          # Domain identity
    ├── welcome-config.json           # Entry experience
    ├── knowledge-config.json         # Knowledge references
    ├── orchestration-config.json    # Consultation style
    ├── synthesis-config.json        # Business objectives
    ├── onboarding-config.json       # Activation patterns
    ├── artifacts-config.json        # Deliverable definitions
    ├── state-config.json            # Progress tracking
    ├── build-config.json            # Voice and behavior
    ├── getting-started.md           # Domain overview
    ├── your-domain-system-instructions.md
    ├── knowledge-file-1.md
    ├── knowledge-file-2.md
    └── [template files].md
```

2. **Configure Domain**
- Set consultation personality in `orchestration-config.json` (intensity, directiveness, pacing)
- Define deliverables in `artifacts-config.json`
- Specify business objectives in `synthesis-config.json`
- Add expert methodology in knowledge files

3. **Build and Test**
```bash
DOMAIN=your-domain npm run build
npm start
```

### Session Management

Sessions persist for 72 hours by default. Access patterns:
- **New Session**: Visit root URL
- **Resume Session**: Use URL with session ID (e.g., `/?session=abc-123`)
- **Share Session**: Copy URL from session info bar

### File Uploads

Supported formats: `.txt`, `.md`, `.pdf` (5MB limit)

Users can upload documents during consultation for analysis. Content is extracted and incorporated into the conversation context.

## Architecture

### Stack
- **Backend**: Express.js + Claude API (Anthropic SDK)
- **Frontend**: React + Tailwind CSS
- **Build**: Vite
- **Deployment**: Railway
- **Session Storage**: File-based (FileSessionStore) with PostgreSQL-ready abstraction

### Key Components

#### `build-context.js`
Dynamically bundles domain files into a single system prompt. Accepts domain via environment variable or CLI argument.

#### `server.js`
Express server handling:
- Session initialization with prompt caching
- Consultation API endpoints
- File upload processing
- Session persistence and restoration

#### `src/App.jsx`
React frontend providing:
- Conversational interface
- Artifact detection and display
- Session restoration
- File upload UI

#### `domain-context.js`
Generated bundle containing complete domain expertise and configuration, loaded into Claude's context window with caching for efficiency.

### API Endpoints
- `POST /api/session/init` - Initialize new consultation
- `POST /api/consult/:sessionId` - Continue conversation
- `POST /api/upload/:sessionId` - Upload files
- `GET /api/session/:sessionId/restore` - Restore session
- `GET /api/session/:sessionId/status` - Check session existence
- `GET /health` - Health check

### Cost Optimization
- **Prompt Caching**: Through Anthropic's caching API
- **Ephemeral Cache**: 5-minute TTL per session
- **Token Monitoring**: Usage tracked and logged per consultation

### Security Considerations
- CORS configured for embedding
- API key required for Claude access
- Sessions expire after 72 hours
- No user data persisted beyond session lifetime

## License

This project is licensed under the MIT License - see the LICENSE file for details.
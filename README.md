# IBD Nutrition Navigator

A consultation service for IBD patients using Claude API with prompt caching for efficient, personalized nutrition guidance.

## Features

- 🏥 Evidence-based IBD nutrition consultation
- 💬 Natural conversation flow with Claude 3.5 Sonnet
- 📄 Automatic document generation (nutrition plans, meal schedules)
- 💰 Cost-efficient through prompt caching
- 🔒 Session-based conversations
- 📱 Responsive design, works on all devices
- 🖼️ Iframe-embeddable for partner websites

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Anthropic API key

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your API key:
```bash
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

3. Build the domain context:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

5. Open http://localhost:3000 in your browser

## Deployment on Railway

### Quick Deploy

1. Fork this repository
2. Connect Railway to your GitHub account
3. Create new project from your forked repo
4. Add environment variables:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `PORT` - Leave empty (Railway provides)
   - `NODE_ENV` - Set to `production`

5. Deploy!

### Railway Configuration

The app includes a `railway.json` file with optimized settings:
- Auto-builds domain context before starting
- Health checks enabled
- Restart on failure

### Custom Domain

1. In Railway settings, go to Networking
2. Add your custom domain
3. Update DNS records as instructed

## Embedding on Partner Websites

Partners can embed the consultation interface using an iframe:

```html
<iframe 
  src="https://your-app-name.up.railway.app" 
  width="100%" 
  height="600px"
  style="border: none; border-radius: 8px;">
</iframe>
```

The server is configured to allow iframe embedding from any domain.

## Architecture

### Server (`server.js`)
- Express server with CORS enabled
- Claude API integration with prompt caching
- Session management (5-minute timeout)
- Health check endpoint

### Frontend (`index.html`)
- Vanilla JavaScript for simplicity
- Marked.js for markdown rendering
- Document extraction for nutrition plans
- Responsive design

### Context Building (`build-context.js`)
- Bundles domain knowledge at build time
- Combines platform philosophy + domain expertise
- Creates ~650KB context for Claude

## API Endpoints

- `POST /api/session/init` - Start new consultation
- `POST /api/consult/:sessionId` - Continue conversation
- `GET /health` - Health check
- `GET /api/session/:sessionId/info` - Session debugging

## Cost Optimization

Using Claude 3.5 Sonnet with prompt caching:
- First message: ~$2 (caches 650KB context)
- Subsequent messages: ~$0.003 (uses cached context)
- Total per consultation: $2-4 for multi-turn conversation

## Development Notes

### Token Usage Monitoring

Check browser console for token usage:
```javascript
Token usage: {
  cached_tokens: 164789,
  new_tokens: 127,
  total_tokens: 164916,
  output_tokens: 584
}
```

### Session Management

Sessions expire after 5 minutes of inactivity. Active conversations maintain cache indefinitely.

### Error Handling

- User-friendly error messages
- Automatic retry recommendations
- Session recovery guidance

## Future Enhancements

After SME validation, consider:
- React frontend upgrade
- User authentication
- Payment integration
- Analytics dashboard
- Multiple domain support
- PDF export functionality

## Support

For issues or questions:
- Check console for detailed error messages
- Verify API key is correct
- Ensure Railway environment variables are set
- Monitor token usage for cost tracking

## License

Proprietary - Wayscribe Platform

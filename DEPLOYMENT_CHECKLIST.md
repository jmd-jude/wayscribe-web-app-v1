# Deployment Checklist for IBD Navigator

## Pre-Deployment (Local Testing)

- [ ] Run `npm install` to install dependencies
- [ ] Create `.env` file with your Anthropic API key
- [ ] Run `npm run build` to generate domain context
- [ ] Run `npm start` to start local server
- [ ] Open http://localhost:3000 and test consultation
- [ ] Run `node test-api.js` to verify all endpoints

## Railway Deployment

### 1. Prepare Repository
- [ ] Create GitHub repository
- [ ] Push code (`.env` will be ignored)
- [ ] Verify `railway.json` is included

### 2. Railway Setup
- [ ] Create Railway account at https://railway.app
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Add environment variables:
  - `ANTHROPIC_API_KEY` = your-api-key
  - `NODE_ENV` = production
  - (PORT is auto-provided by Railway)

### 3. Deploy
- [ ] Click "Deploy" in Railway
- [ ] Watch build logs for errors
- [ ] Wait for health check to pass
- [ ] Click generated URL to test

### 4. Post-Deployment Testing
- [ ] Test welcome message loads
- [ ] Send test message about Crohn's
- [ ] Verify document generation works
- [ ] Check console for token usage

### 5. Share with SME
- [ ] Copy Railway URL
- [ ] Create iframe embed code:
  ```html
  <iframe src="YOUR_RAILWAY_URL" 
          width="100%" 
          height="600px"
          style="border: none;">
  </iframe>
  ```
- [ ] Send to Raman Sehgal for testing

## Monitoring

### During Testing
- Monitor Railway logs for errors
- Check token usage in browser console
- Note any UI/UX feedback

### Cost Tracking
- First message: ~$2 (caching 650KB)
- Follow-ups: ~$0.003 each
- Budget ~$2-4 per consultation

## Troubleshooting

### Common Issues

1. **"Failed to initialize consultation"**
   - Check API key in Railway env vars
   - Verify Railway URL uses HTTPS

2. **Slow responses**
   - Normal for first message (caching)
   - Subsequent should be <3 seconds

3. **Session expired errors**
   - Sessions timeout after 5 min idle
   - Refresh page to start new session

4. **Iframe not loading**
   - Check CORS headers in server.js
   - Verify no X-Frame-Options header

## Success Metrics

- [ ] SME completes full consultation
- [ ] Natural flow from welcome to deliverables
- [ ] Positive feedback on consultation quality
- [ ] <3 second response time (after cache)
- [ ] No critical errors in 10 sessions

## Next Steps (After Validation)

1. Implement React frontend
2. Add user authentication
3. Set up payment processing
4. Deploy other domains
5. Add analytics tracking

---

**Remember**: This is an MVP for validation. Focus on consultation quality, not perfect infrastructure.

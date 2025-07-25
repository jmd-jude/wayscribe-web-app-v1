# Quick Start Guide - IBD Navigator

## 🚀 Get Running in 2 Minutes

Open Terminal in the `ibd-navigator-railway` folder and run:

```bash
# 1. Install dependencies
npm install

# 2. Build domain context
npm run build

# 3. Start the server
npm start
```

Then open: http://localhost:3000

## 🧪 Test the Consultation

Try this opening message:
> "I was diagnosed with Crohn's disease 3 months ago. What should I be eating?"

## 📊 Monitor Performance

Open browser DevTools Console to see:
- Token usage per message
- Cache efficiency
- Response times

## 🔧 Troubleshooting

If you see errors:

1. **Missing .env file**: The .env file with your API key is already created
2. **Port already in use**: Change PORT in .env to 3001
3. **Build fails**: Make sure you're in the correct directory

## 🚢 Deploy to Railway

1. Push to GitHub (create new repo)
2. Connect Railway to your repo
3. Add your API key in Railway environment variables
4. Deploy!

## 📝 What to Expect

- **First message**: Takes 3-5 seconds (building cache)
- **Follow-ups**: Under 1 second
- **Documents**: Auto-generated nutrition plans appear as cards
- **Session timeout**: 5 minutes of inactivity

---

**Need help?** Check the browser console for detailed error messages.

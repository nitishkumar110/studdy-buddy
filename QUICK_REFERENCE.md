# 🚀 Studdy-Buddy - Quick Reference

## Application URLs

### Local Development
```
http://localhost:3000
```

### Production (Render)
```
https://studdy-buddy-pizq.onrender.com
✅ LIVE AND RUNNING!
```

### GitHub Repository
```
https://github.com/nitishkumar110/studdy-buddy
```

---

## Quick Deploy to Render

1. Go to: https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect repository: `nitishkumar110/studdy-buddy`
4. Click "Apply"
5. Wait 5-10 minutes
6. Done! 🎉

---

## Test Accounts (Local Development)

```
Email: alex@edu.com
Password: password123

Email: maria@edu.com
Password: password123

Email: sam@edu.com
Password: password123
```

---

## Features Overview

✅ User Authentication (Register/Login)
✅ Friend System (Send/Accept Requests)
✅ Social Feed (Posts, Images, Likes)
✅ Real-time Chat (1-on-1 Messaging)
✅ Group Chat (Create & Join Groups)
✅ AI Mentors (CS, Mech, Civil, Electrical)
✅ Profile Management (Edit, Upload Images/Resume)
✅ Video Calling (WebRTC)
✅ Notifications
✅ Responsive Design

---

## Important Files

- `server.js` - Main server file
- `database-sqlite.js` - SQLite database (local)
- `database.js` - Database adapter (auto-switches to PostgreSQL on Render)
- `render.yaml` - Render deployment config
- `DEPLOYMENT.md` - Full deployment guide
- `.env.example` - Environment variables template

---

## Common Commands

### Start Server
```bash
npm start
```

### Git Commands
```bash
git add .
git commit -m "Your message"
git push origin main
```

### Check Server Status
```bash
# Server runs on port 3000
# Check if running: http://localhost:3000
```

---

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify all dependencies installed: `npm install`
- Check `.env` file exists

### Database issues
- Delete `studdybuddy.db` and restart server
- Database will be recreated automatically

### Git push fails
- Check GitHub credentials
- Verify remote URL: `git remote -v`

---

## Next Steps After Deployment

1. ✅ Test all features on production URL
2. ✅ Create test accounts
3. ✅ Verify WebSocket connections work
4. ✅ Test from mobile devices
5. ⚠️ Update this file with actual Render URL
6. ⚠️ Consider adding password hashing (bcrypt)
7. ⚠️ Set up external file storage for uploads

---

## Support

- Check `DEPLOYMENT.md` for detailed guide
- Review `walkthrough.md` for all changes made
- Visit Render Dashboard for logs and metrics
- Check GitHub Issues for known problems

---

**Last Updated:** 2026-01-01
**Status:** ✅ Ready for Deployment

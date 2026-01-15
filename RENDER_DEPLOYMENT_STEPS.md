# 🚀 Render Deployment Steps - Studdy-Buddy

## ✅ Pre-Deployment Checklist

Your code is ready! All files are committed and pushed to GitHub:
- ✅ Repository: https://github.com/nitishkumar110/studdy-buddy.git
- ✅ render.yaml configured
- ✅ All dependencies in package.json
- ✅ Environment variables configured
- ✅ Database adapter ready (SQLite/PostgreSQL)

## 📋 Step-by-Step Deployment Instructions

### Step 1: Create Render Account
1. Go to **https://render.com**
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Sign up with your GitHub account (recommended) or email

### Step 2: Deploy Using Blueprint (Easiest Method)

1. **Navigate to Dashboard**
   - After signing in, you'll see the Render Dashboard

2. **Create New Blueprint**
   - Click the **"New +"** button (top right)
   - Select **"Blueprint"** from the dropdown

3. **Connect GitHub Repository**
   - If not connected, click **"Connect GitHub"**
   - Authorize Render to access your repositories
   - Select repository: **`nitishkumar110/studdy-buddy`**

4. **Review Configuration**
   - Render will automatically detect `render.yaml`
   - You'll see:
     - **Web Service**: studdy-buddy
     - **PostgreSQL Database**: studdy-buddy-db
   - Review the settings (they should be correct)

5. **Deploy**
   - Click **"Apply"** button
   - Render will start building your application

### Step 3: Monitor Deployment

1. **Watch the Build Logs**
   - You'll see real-time build progress
   - Build typically takes 5-10 minutes
   - Look for: "Build successful" message

2. **Check for Errors**
   - If build fails, check the logs
   - Common issues:
     - Missing dependencies (shouldn't happen - all in package.json)
     - Port configuration (already set to use PORT env var)
     - Database connection (auto-configured)

### Step 4: Access Your Application

1. **Get Your URL**
   - Once deployed, Render will provide a URL like:
     - `https://studdy-buddy-xxxx.onrender.com`
   - This is your live application URL!

2. **Test Your Application**
   - Open the URL in your browser
   - Register a new account
   - Test features:
     - ✅ Login/Register
     - ✅ Create posts with images/PDFs
     - ✅ Send personal messages
     - ✅ Join groups and send group messages
     - ✅ Upload profile images
     - ✅ Real-time chat

## 🔧 Manual Deployment (Alternative Method)

If Blueprint doesn't work, use manual setup:

### 1. Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `studdy-buddy-db`
   - **Database**: `studdybuddy`
   - **User**: `studdybuddy`
   - **Plan**: Free
3. Click **"Create Database"**
4. Copy the **"Internal Database URL"** (you'll need it)

### 2. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `nitishkumar110/studdy-buddy`
3. Configure:
   - **Name**: `studdy-buddy`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Add Environment Variables
In the Web Service settings, go to **"Environment"** tab and add:
```
NODE_ENV=production
DATABASE_URL=<paste Internal Database URL from step 1>
JWT_SECRET=<generate a random string, e.g., use: openssl rand -hex 32>
```

### 4. Deploy
- Click **"Create Web Service"**
- Wait for deployment to complete

## 📝 Post-Deployment

### Update Your Application URL
If you have any hardcoded URLs in your code, update them to use:
```javascript
const API_URL = window.location.origin;
```

### Test All Features
- [ ] User registration
- [ ] User login
- [ ] Create posts with images
- [ ] Create posts with PDFs/documents
- [ ] Send personal messages
- [ ] Send group messages
- [ ] Upload profile images
- [ ] Real-time notifications
- [ ] Video calls (WebRTC)

## 🔍 Troubleshooting

### Build Fails
- Check build logs for specific errors
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (Render uses latest LTS)

### Application Won't Start
- Check logs in Render dashboard
- Verify PORT environment variable is set
- Check database connection string

### Database Connection Issues
- Verify DATABASE_URL is correctly set
- Ensure database is in same region as web service
- Check database is not paused (free tier auto-pauses)

### WebSocket/Socket.IO Issues
- Render free tier supports WebSockets
- Check CORS settings (already configured)
- Verify Socket.IO version compatibility

### File Uploads Not Working
- On Render free tier, files are stored in ephemeral filesystem
- Files will be lost on service restart
- For production, consider cloud storage (S3, Cloudinary)

## 📊 Monitoring

### View Logs
- Dashboard → Your Service → **"Logs"** tab
- Real-time application logs
- Build logs available during deployment

### Metrics
- Dashboard → Your Service → **"Metrics"** tab
- CPU usage
- Memory usage
- Request count

## 🔐 Security Notes

1. **JWT_SECRET**: Auto-generated by Render (secure)
2. **Database**: Automatically secured
3. **HTTPS**: Automatically enabled by Render
4. **CORS**: Currently set to "*" - consider restricting in production

## 💰 Free Tier Limitations

- ✅ 750 hours/month runtime
- ✅ WebSocket support
- ✅ Automatic HTTPS
- ⚠️ Services spin down after 15 min inactivity
- ⚠️ First request after spin-down: 30-60 seconds
- ⚠️ Database expires after 90 days (free tier)

## 🎉 Success!

Once deployed, your application will be live at:
**https://studdy-buddy-xxxx.onrender.com**

Share this URL with your users!

---

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Check application logs in Render dashboard

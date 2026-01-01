# Deployment Guide - Studdy-Buddy

## Prerequisites
- Git installed
- GitHub account
- Render account (free tier available at https://render.com)

## Step 1: Prepare Your Code

1. Make sure all changes are saved
2. Verify `.gitignore` is properly configured (already done)
3. Create a `.env` file for local testing (copy from `.env.example`)

## Step 2: Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Studdy-Buddy complete application"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `studdy-buddy`
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL

## Step 4: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/studdy-buddy.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and configure:
   - Web service (Node.js app)
   - PostgreSQL database
   - Environment variables

5. Click "Apply" to deploy

### Option B: Manual Setup

1. **Create PostgreSQL Database:**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `studdy-buddy-db`
   - Plan: Free
   - Click "Create Database"
   - Copy the "Internal Database URL"

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** studdy-buddy
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
   
3. **Add Environment Variables:**
   - Click "Environment" tab
   - Add these variables:
     ```
     NODE_ENV=production
     DATABASE_URL=<paste the Internal Database URL from step 1>
     JWT_SECRET=<generate a long random string>
     ```

4. Click "Create Web Service"

## Step 6: Verify Deployment

1. Wait for the build to complete (5-10 minutes)
2. Render will provide a URL like: `https://studdy-buddy-xxxx.onrender.com`
3. Open the URL in your browser
4. Test the following:
   - Register a new account
   - Login
   - Add friends
   - Create posts
   - Send messages
   - Create and join groups
   - Chat with AI mentors

## Step 7: Update Your Application URL

After deployment, update any hardcoded URLs in your code if necessary. The application is already configured to work with both localhost and production URLs.

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set in environment variables
- Check Render logs for connection errors
- Ensure the database is in the same region as your web service

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Review build logs in Render dashboard

### WebSocket Issues
- Render free tier supports WebSockets
- Ensure Socket.IO is properly configured (already done)
- Check browser console for connection errors

## Updating Your Deployment

To deploy updates:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Render will automatically detect the push and redeploy your application.

## Free Tier Limitations

Render free tier includes:
- ✅ 750 hours/month of runtime
- ✅ WebSocket support
- ✅ Automatic HTTPS
- ✅ PostgreSQL database (90 days, then expires)
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down may take 30-60 seconds

## Custom Domain (Optional)

1. Go to your web service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed

## Monitoring

- View logs: Render Dashboard → Your Service → Logs
- Monitor performance: Render Dashboard → Your Service → Metrics
- Set up alerts: Render Dashboard → Your Service → Settings → Notifications

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Create an issue in your repository

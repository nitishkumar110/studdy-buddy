# Studdy-Buddy Social Platform

A premium study partner platform with social networking features including friends, posts, real-time chat, and AI mentors.

## 🚀 Features

- **User Authentication** - Register and login system
- **Friend System** - Send/accept friend requests, manage connections
- **Social Feed** - Create posts, share images, like content
- **Real-time Chat** - WebSocket-powered instant messaging
- **Notifications** - Stay updated on friend requests and interactions
- **AI Mentors** - Chat with AI tutors for different subjects
- **Study Groups** - Join and participate in study groups
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (better-sqlite3)
- **Real-time:** Socket.IO
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Authentication:** JWT (JSON Web Tokens)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd studdy-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 🌐 Deployment

See [deployment_guide.md](deployment_guide.md) for detailed instructions on deploying to:
- Local network
- ngrok (quick internet access)
- Render (free cloud hosting)
- Railway
- Heroku

## 📱 Quick Access from Other Devices

1. Find your computer's IP address:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. Access from any device on the same network:
   ```
   http://YOUR_IP:3000
   ```

## 🔐 Security Notes

⚠️ **IMPORTANT:** Before deploying publicly:
- Change `JWT_SECRET` in `server.js`
- Implement password hashing (currently plain text)
- Set up HTTPS/SSL
- Configure proper CORS settings

## 📂 Project Structure

```
studdy-buddy/
├── public/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript modules
│   ├── assets/         # Images and media
│   ├── index.html      # Landing page
│   ├── login.html      # Login page
│   ├── register.html   # Registration page
│   ├── friends.html    # Friends management
│   ├── feed.html       # Social feed
│   ├── chat.html       # Real-time chat
│   └── ai-chat.html    # AI mentor chat
├── server.js           # Express server & API routes
├── database.js         # SQLite database setup
├── ai-logic.js         # AI mentor logic
└── package.json        # Dependencies

```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login

### Friends
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:id` - Accept request
- `POST /api/friends/reject/:id` - Reject request
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get pending requests
- `DELETE /api/friends/:id` - Remove friend

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts/:id/like` - Like/unlike post
- `DELETE /api/posts/:id` - Delete post

### Messages
- `GET /api/messages/:userId` - Get conversation
- `POST /api/messages` - Send message

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🧪 Testing

Test accounts are pre-seeded:
- alex@edu.com / password123
- maria@edu.com / password123
- sam@edu.com / password123

## 📝 License

ISC

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

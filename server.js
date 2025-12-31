require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { query, initDb } = require('./db'); // Use new Postgres DB module
const aiLogic = require('./ai-logic');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize Database
initDb().catch(console.error);

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, major } = req.body;
    try {
        const result = await query(
            'INSERT INTO users (email, password, name, major) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, password, name, major]
        );
        const userId = result.rows[0].id;
        const token = jwt.sign({ id: userId, email }, JWT_SECRET);
        res.json({ success: true, userId, token, message: "Registered successfully" });
    } catch (err) {
        if (err.code === '23505') { // unique_violation code for Postgres
            res.status(400).json({ success: false, message: "Email already exists" });
        } else {
            console.error(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        const user = result.rows[0];

        if (user) {
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
            res.json({
                success: true,
                user: { id: user.id, name: user.name, major: user.major, bio: user.bio },
                token
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- USER ROUTES ---

app.get('/api/users/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    try {
        const result = await query(
            'SELECT id, name, major, bio FROM users WHERE (name ILIKE $1 OR major ILIKE $2) AND id != $3 LIMIT 20',
            [`%${q}%`, `%${q}%`, req.user.id] // ILIKE for case-insensitive search
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT id, name, major, bio, created_at FROM users WHERE id = $1', [req.params.id]);
        const user = result.rows[0];
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- FRIEND ROUTES ---

app.post('/api/friends/request', authenticateToken, async (req, res) => {
    const { friendId } = req.body;
    try {
        // Check if already friends or request exists
        const existing = await query(
            'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $3 AND friend_id = $4)',
            [req.user.id, friendId, friendId, req.user.id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Friend request already exists' });
        }

        await query('INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)', [req.user.id, friendId, 'pending']);

        // Create notification
        const userResult = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const userName = userResult.rows[0].name;

        await query('INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
            [friendId, 'friend_request', req.user.id, `${userName} sent you a friend request`]
        );

        // Emit socket event
        io.to(`user_${friendId}`).emit('notification', {
            type: 'friend_request',
            from: userName,
            fromId: req.user.id
        });

        res.json({ success: true, message: 'Friend request sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/friends/accept/:requestId', authenticateToken, async (req, res) => {
    try {
        const requestResult = await query('SELECT * FROM friends WHERE id = $1 AND friend_id = $2', [req.params.requestId, req.user.id]);
        const request = requestResult.rows[0];

        if (!request) {
            return res.status(404).json({ success: false, message: 'Friend request not found' });
        }

        await query('UPDATE friends SET status = $1 WHERE id = $2', ['accepted', req.params.requestId]);

        // Create notification
        const userResult = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const userName = userResult.rows[0].name;

        await query('INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
            [request.user_id, 'friend_accepted', req.user.id, `${userName} accepted your friend request`]
        );

        res.json({ success: true, message: 'Friend request accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/friends/reject/:requestId', authenticateToken, async (req, res) => {
    try {
        await query('UPDATE friends SET status = $1 WHERE id = $2 AND friend_id = $3', ['rejected', req.params.requestId, req.user.id]);
        res.json({ success: true, message: 'Friend request rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/friends', authenticateToken, async (req, res) => {
    try {
        const friends = await query(`
            SELECT u.id, u.name, u.major, u.bio, f.created_at
            FROM friends f
            JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
            WHERE (f.user_id = $1 OR f.friend_id = $2) AND f.status = 'accepted' AND u.id != $3
        `, [req.user.id, req.user.id, req.user.id]);
        res.json(friends.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/friends/requests', authenticateToken, async (req, res) => {
    try {
        const requests = await query(`
            SELECT f.id, u.id as user_id, u.name, u.major, u.bio, f.created_at
            FROM friends f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = $1 AND f.status = 'pending'
        `, [req.user.id]);
        res.json(requests.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/friends/:friendId', authenticateToken, async (req, res) => {
    try {
        await query('DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $3 AND friend_id = $4)',
            [req.user.id, req.params.friendId, req.params.friendId, req.user.id]);
        res.json({ success: true, message: 'Friend removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- POST ROUTES ---

app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
    const { content } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const insertResult = await query(
            'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING id',
            [req.user.id, content, imageUrl]
        );
        const postId = insertResult.rows[0].id;

        const postResult = await query(`
            SELECT p.*, u.name, u.major 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.id = $1
        `, [postId]);

        res.json({ success: true, post: postResult.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/posts/feed', authenticateToken, async (req, res) => {
    try {
        const posts = await query(`
            SELECT p.*, u.name, u.major,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) > 0 FROM post_likes WHERE post_id = p.id AND user_id = $1) as user_liked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id IN (
                SELECT CASE 
                    WHEN f.user_id = $2 THEN f.friend_id 
                    ELSE f.user_id 
                END
                FROM friends f
                WHERE (f.user_id = $3 OR f.friend_id = $4) AND f.status = 'accepted'
            ) OR p.user_id = $5
            ORDER BY p.created_at DESC
            LIMIT 50
        `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

        // Convert user_liked to boolean (Postgres returns boolean but good to ensure)
        const formattedPosts = posts.rows.map(post => ({
            ...post,
            user_liked: Boolean(post.user_liked),
            likes_count: parseInt(post.likes_count)
        }));

        res.json(formattedPosts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Public endpoint for recent posts (for home page)
app.get('/api/posts/recent', async (req, res) => {
    try {
        const posts = await query(`
            SELECT p.*, u.name, u.major,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 6
        `);

        const formattedPosts = posts.rows.map(post => ({
            ...post,
            likes_count: parseInt(post.likes_count)
        }));

        res.json(formattedPosts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const existing = await query('SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2', [req.params.id, req.user.id]);

        if (existing.rows.length > 0) {
            await query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
            res.json({ success: true, liked: false });
        } else {
            await query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
            res.json({ success: true, liked: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        await query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- MESSAGE ROUTES ---

app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
    try {
        const messages = await query(`
            SELECT m.*, u.name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $3 AND m.receiver_id = $4)
            ORDER BY m.created_at ASC
        `, [req.user.id, req.params.userId, req.params.userId, req.user.id]);
        res.json(messages.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { receiverId, content } = req.body;
    try {
        const insertResult = await query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id',
            [req.user.id, receiverId, content]
        );
        const messageId = insertResult.rows[0].id;

        const message = await query('SELECT * FROM messages WHERE id = $1', [messageId]);

        // Emit to receiver via socket
        io.to(`user_${receiverId}`).emit('new_message', message.rows[0]);

        res.json({ success: true, message: message.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- NOTIFICATION ROUTES ---

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await query(`
            SELECT n.*, u.name as from_name
            FROM notifications n
            LEFT JOIN users u ON n.from_user_id = u.id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [req.user.id]);
        res.json(notifications.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await query('UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- AI CHAT ROUTE ---

app.post('/api/chat', (req, res) => {
    const { message, persona } = req.body;
    const response = aiLogic.getResponse(message, persona);
    setTimeout(() => {
        res.json({ reply: response });
    }, 1000);
});

// --- GROUP ROUTES ---

app.post('/api/groups', authenticateToken, async (req, res) => {
    const { name, subject, description, icon_class } = req.body;
    try {
        const result = await query(
            'INSERT INTO groups (name, subject, description, icon_class, status, members_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, subject, description, icon_class || 'fa-solid fa-users', 'Active', 1]
        );
        res.json({ success: true, group: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/groups', async (req, res) => {
    try {
        const result = await query('SELECT * FROM groups ORDER BY created_at DESC');
        // ... (seeding logic remains same) ...
        // If empty, seed some default groups
        if (result.rows.length === 0) {
            const seedGroups = [
                { name: 'Python Beginners', subject: 'CS', description: 'Weekly coding challenges and peer review for Python basics.', icon: 'fa-brands fa-python', status: 'Active' },
                { name: 'Organic Chemistry Prep', subject: 'Chemistry', description: "Preparing for finals? Let's master mechanisms together.", icon: 'fa-solid fa-flask', status: 'Recruiting' },
                { name: 'Calculus II Warriors', subject: 'Math', description: 'Deep dive into integrals and series. Serious inquiries only.', icon: 'fa-solid fa-calculator', status: 'Private' },
                { name: 'Spanish Conversation', subject: 'Language', description: 'Practice speaking Spanish casually every weekend.', icon: 'fa-solid fa-language', status: 'Active' },
                { name: 'Data Science Hub', subject: 'CS', description: 'Sharing resources on ML, AI, and Big Data.', icon: 'fa-solid fa-database', status: 'Active' }
            ];

            for (const g of seedGroups) {
                await query(
                    'INSERT INTO groups (name, subject, description, icon_class, status, members_count) VALUES ($1, $2, $3, $4, $5, $6)',
                    [g.name, g.subject, g.description, g.icon, g.status, Math.floor(Math.random() * 20) + 1]
                );
            }
            const seeded = await query('SELECT * FROM groups ORDER BY created_at DESC');
            return res.json(seeded.rows);
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/groups/:id/join', authenticateToken, async (req, res) => {
    try {
        await query('UPDATE groups SET members_count = members_count + 1 WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Joined group successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- GROUP CHAT ROUTES ---

app.get('/api/groups/:id/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await query(`
            SELECT gm.*, u.name as sender_name, u.avatar_url
            FROM group_messages gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1
            ORDER BY gm.created_at ASC
            LIMIT 100
        `, [req.params.id]);
        res.json(messages.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/groups/:id/messages', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const insertResult = await query(
            'INSERT INTO group_messages (group_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
            [req.params.id, req.user.id, content]
        );
        const newMessage = {
            id: insertResult.rows[0].id,
            group_id: req.params.id,
            user_id: req.user.id,
            content,
            created_at: insertResult.rows[0].created_at,
            sender_name: req.user.name // We need to fetch this or attach it to req.user
        };

        // Improve name fetching
        const userRes = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        newMessage.sender_name = userRes.rows[0].name;

        // Emit via socket
        io.to(`group_${req.params.id}`).emit('new_group_message', newMessage);

        res.json({ success: true, message: newMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- BUDDIES ROUTE (Legacy) ---
// Kept for backward compatibility if any old frontend code checks it, or just useful for debugging
app.get('/api/buddies', async (req, res) => {
    try {
        const users = await query('SELECT id, name, major FROM users LIMIT 20');
        res.json(users.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- WEBSOCKET ---

const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('authenticate', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);

        // Broadcast online status
        io.emit('user_online', userId);
    });

    socket.on('send_message', async (data) => {
        const { receiverId, content, senderId } = data;

        try {
            // Save to database
            const insertResult = await query(
                'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id',
                [senderId, receiverId, content]
            );
            const messageId = insertResult.rows[0].id;

            const messageResult = await query(`
                SELECT m.*, u.name as sender_name
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = $1
            `, [messageId]);

            const message = messageResult.rows[0];

            // Send to receiver
            io.to(`user_${receiverId}`).emit('new_message', message);

            // Confirm to sender
            socket.emit('message_sent', message);
        } catch (e) {
            console.error("Error saving socket message:", e);
        }
    });

    socket.on('typing', (data) => {
        io.to(`user_${data.receiverId}`).emit('user_typing', {
            userId: data.senderId,
            isTyping: data.isTyping
        });
    });

    socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
    });

    // --- WebRTC Signaling ---

    socket.on('call_user', (data) => {
        const { userToCall, signalData, from, name } = data;
        io.to(`user_${userToCall}`).emit('call_user', { signal: signalData, from, name });
    });

    socket.on('answer_call', (data) => {
        io.to(`user_${data.to}`).emit('call_accepted', data.signal);
    });

    socket.on('ice_candidate', (data) => {
        io.to(`user_${data.to}`).emit('ice_candidate', data.candidate);
    });

    socket.on('reject_call', (data) => {
        io.to(`user_${data.to}`).emit('call_rejected');
    });

    socket.on('disconnect', () => {
        // Find and remove user
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                io.emit('user_offline', userId);
                break;
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📱 Social features: Friends, Feed, Chat enabled (Postgres)`);
    console.log(`🤖 AI Mentors ready: CS, Mech, Civil, Electrical`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use.`);
        console.error(`Please stop the process running on port ${PORT} or change the PORT in server.js.\n`);
        process.exit(1);
    }
});


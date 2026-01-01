const Database = require('better-sqlite3');
const path = require('path');

// Create SQLite database
const db = new Database(path.join(__dirname, 'studdybuddy.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Helper to run queries (mimics pg Pool interface)
const query = (text, params = []) => {
    try {
        // Convert PostgreSQL-style $1, $2 placeholders to SQLite ? placeholders
        const sqliteQuery = text.replace(/\$(\d+)/g, '?');

        // Determine if it's a SELECT query or modification query
        const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');

        if (isSelect) {
            const stmt = db.prepare(sqliteQuery);
            const rows = stmt.all(...params);
            return { rows };
        } else {
            const stmt = db.prepare(sqliteQuery);
            const info = stmt.run(...params);

            // For INSERT with RETURNING, we need to fetch the last inserted row
            if (text.toUpperCase().includes('RETURNING')) {
                const lastId = info.lastInsertRowid;
                const tableName = text.match(/INSERT INTO (\w+)/i)?.[1];
                if (tableName && lastId) {
                    const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
                    const rows = [selectStmt.get(lastId)];
                    return { rows };
                }
            }

            return { rows: [], rowCount: info.changes };
        }
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Initialize Tables
const initDb = async () => {
    try {
        // Users table
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT,
                major TEXT,
                bio TEXT,
                avatar_url TEXT,
                profile_image TEXT,
                quote TEXT,
                resume_url TEXT,
                interests TEXT,
                skills TEXT,
                social_links TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Friends table
        db.exec(`
            CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Posts table
        db.exec(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                image_url TEXT,
                likes_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Post likes table
        db.exec(`
            CREATE TABLE IF NOT EXISTS post_likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Messages table
        db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Groups table
        db.exec(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                subject TEXT,
                icon_class TEXT DEFAULT 'fa-solid fa-users',
                members_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Active',
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );
        `);

        // Group messages table
        db.exec(`
            CREATE TABLE IF NOT EXISTS group_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Notifications table
        db.exec(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                from_user_id INTEGER,
                message TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        console.log('✅ Database initialized successfully (SQLite)');
    } catch (e) {
        console.error('❌ Database initialization failed:', e);
        throw e;
    }
};

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});

module.exports = {
    query,
    initDb,
    db
};

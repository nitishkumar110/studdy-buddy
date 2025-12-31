const { Pool } = require('pg');

// Create a new pool using the connection string from environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

// Helper to run queries
const query = (text, params) => pool.query(text, params);

// Initialize Tables
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT,
                major TEXT,
                bio TEXT,
                avatar_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS friends (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                image_url TEXT,
                likes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS post_likes (
                id SERIAL PRIMARY KEY,
                post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(post_id, user_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                subject TEXT,
                icon_class TEXT DEFAULT 'fa-solid fa-users',
                members_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Active',
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Database initialized successfully');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Database initialization failed:', e);
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    query,
    initDb,
    pool
};

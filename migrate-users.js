const sqlite3 = require('better-sqlite3');
const { Pool } = require('pg');

// Connect to local SQLite database
const sqliteDb = sqlite3('./studdybuddy.db');

// Connect to production PostgreSQL database (External URL)
const DATABASE_URL = 'postgresql://studdybuddy:bGsrNtgz4Jb3bUq5eYaNRuUMaknru0Ds@dpg-d5b299qli9vc73bf4vng-a.oregon-postgres.render.com/studdybuddy_hoda';

const pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrateData() {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...\n');

    try {
        // Get all users from SQLite
        const users = sqliteDb.prepare('SELECT * FROM users').all();
        console.log(`📊 Found ${users.length} users in local database`);

        if (users.length === 0) {
            console.log('⚠️  No users to migrate');
            return;
        }

        // Migrate users to PostgreSQL
        for (const user of users) {
            try {
                await pgPool.query(
                    `INSERT INTO users (email, password, name, major, bio, avatar_url, profile_image, quote, resume_url, interests, skills, social_links, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                     ON CONFLICT (email) DO NOTHING`,
                    [
                        user.email,
                        user.password,
                        user.name,
                        user.major,
                        user.bio,
                        user.avatar_url,
                        user.profile_image,
                        user.quote,
                        user.resume_url,
                        user.interests,
                        user.skills,
                        user.social_links,
                        user.created_at
                    ]
                );
                console.log(`✅ Migrated user: ${user.email}`);
            } catch (err) {
                console.error(`❌ Failed to migrate ${user.email}:`, err.message);
            }
        }

        console.log('\n🎉 Migration completed!');
        console.log('📝 Summary:');
        console.log(`   - Total users processed: ${users.length}`);

        // Verify migration
        const result = await pgPool.query('SELECT COUNT(*) FROM users');
        console.log(`   - Users in PostgreSQL: ${result.rows[0].count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        sqliteDb.close();
        await pgPool.end();
    }
}

// Run migration
migrateData();

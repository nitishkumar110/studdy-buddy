const sqlite3 = require('better-sqlite3');

// Connect to local SQLite database
const sqliteDb = sqlite3('./studdybuddy.db');

try {
    // Get all users from SQLite
    const users = sqliteDb.prepare('SELECT email, name, major FROM users').all();

    console.log('\n📊 Local SQLite Database Users:');
    console.log('================================');
    console.log(`Total users: ${users.length}\n`);

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Major: ${user.major || 'N/A'}\n`);
    });

} catch (error) {
    console.error('Error:', error.message);
} finally {
    sqliteDb.close();
}

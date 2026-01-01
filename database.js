#!/usr/bin/env node

// Detect environment and use appropriate database
const isDevelopment = !process.env.DATABASE_URL;

if (isDevelopment) {
    console.log('🔧 Development mode: Using SQLite');
    module.exports = require('./database-sqlite');
} else {
    console.log('🚀 Production mode: Using PostgreSQL');
    module.exports = require('./db');
}

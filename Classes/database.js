// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * 🛠️ LOCAL DEV & DEPLOYMENT TIPS:
 * * 1. LOCAL WORK: Keep your .env file as is. This script detects if you're local
 * and will skip SSL requirements so you don't get connection errors.
 * * 2. DB_PORT: I added a fallback to 3306 just in case it's missing from .env.
 * * 3. PRODUCTION DEPLOY: 
 * - In your hosting dashboard, set NODE_ENV to 'production'.
 * - This will trigger the 'ssl' block below which is required by most 
 * cloud DBs (like TiDB, AWS, or PlanetScale).
 * - If your production DB doesn't use SSL, just change 'rejectUnauthorized' to false.
 */

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.db_host,
            user: process.env.db_user,
            password: process.env.db_pass,
            database: process.env.db_name,
            port: process.env.db_port || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            
            // ✨ HYBRID SSL CHECK
            // If process.env.NODE_ENV is not 'production', it returns 'false' and stays local-friendly.
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: true 
            } : false
        });
    }

    async getQuery(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            // Detailed error logging to help you debug during dev!
            console.error(`❌ DB Query Failed: [${sql}] | Error: ${error.message}`);
            throw error;
        }
    }

    async close() {
        try {
            await this.pool.end();
            console.log('Database pool closed safely.');
        } catch (error) {
            console.error('Error closing database pool:', error.message);
        }
    }
}

// We export the CLASS so you can instantiate it where needed, 
// or you can do 'module.exports = new Database();' to share one pool.
module.exports = Database;
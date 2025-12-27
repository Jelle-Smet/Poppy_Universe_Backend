const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        // 1. Setup default pool options
        const poolConfig = {
            host: process.env.db_host,
            user: process.env.db_user,
            password: process.env.db_pass,
            database: process.env.db_name,
            port: process.env.db_port || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        };

        // 2. Handle SSL (Cloud vs Local)
        // If DB_CA_PATH exists in .env, we assume we need SSL (Aiven)
        if (process.env.DB_CA_PATH) {
            try {
                const caPath = path.resolve(process.env.DB_CA_PATH);
                poolConfig.ssl = {
                    ca: fs.readFileSync(caPath),
                    rejectUnauthorized: true
                };
                console.log('🛡️  SSL Configured for Database');
            } catch (err) {
                console.error('❌ Failed to read SSL CA file:', err.message);
                // Fallback to no SSL if file is missing (good for local dev)
                poolConfig.ssl = false;
            }
        } else {
            poolConfig.ssl = false;
        }

        this.pool = mysql.createPool(poolConfig);
    }

    async getQuery(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
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

module.exports = Database;
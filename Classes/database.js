// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.db_host,
            user: process.env.db_user,
            password: process.env.db_pass,
            database: process.env.db_name,
            port: process.env.db_port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    async getQuery(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Error executing query:', error.message);
            throw error;
        }
    }

    async close() {
        try {
            await this.pool.end();
            console.log('Database pool closed');
        } catch (error) {
            console.error('Error closing database pool:', error.message);
        }
    }
}

module.exports = Database;

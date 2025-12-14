// Controllers/Status_Controller.js
const db = new (require('../Classes/database'))(); // Re-use your DB class

exports.getSystemStatus = async (req, res) => {
    let dbStatus = 'Online'; // Assume online first

    try {
        // Attempt a simple, fast query. This line will THROW an error 
        // if the database connection fails (State 2).
        await db.getQuery("SELECT 1 + 1 AS result"); 
    } catch (error) {
        console.error('Database check failed:', error.message);
        dbStatus = 'Offline'; // Database failed the check
    }

    // THIS IS THE CORRECT RESPONSE FORMAT
    res.status(200).json({
        serviceStatus: 'Online',      // Express server is running
        databaseStatus: dbStatus,     // 'Online' or 'Offline' based on the check
    });
};
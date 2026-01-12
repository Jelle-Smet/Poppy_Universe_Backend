// We create the instance exactly like your working Maintenance Controller
const db = new (require('../Classes/database'))(); 

exports.getSystemStatus = async (req, res) => {
    console.log("🔍 System Status Check triggered...");
    
    let dbStatus = 'Online'; 
    let aiStatus = 'Online'; // Default to Online, will change if check fails

    // 1. Check Database
    try {
        await db.getQuery("SELECT 1"); 
        console.log("✅ Database is responsive.");
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        dbStatus = 'Offline'; 
    }

    // 2. Check AI Brain (Hugging Face Space)
    try {
        // We ping the Space URL. We use a short timeout so the whole status 
        // page doesn't hang if HF is being slow.
        const aiResponse = await fetch(process.env.ML_SERVICE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`
            },
            signal: AbortSignal.timeout(5000) // 5 second limit
        });

        if (!aiResponse.ok) {
            aiStatus = 'Limited'; 
        }
    } catch (error) {
        console.error('❌ AI Brain check failed:', error.message);
        aiStatus = 'Offline';
    }

    // Return the response with all three metrics
    return res.status(200).json({
        serviceStatus: 'Online',      // Express Server
        databaseStatus: dbStatus,     // Aiven MySQL
        aiStatus: aiStatus            // Hugging Face Space
    });
};
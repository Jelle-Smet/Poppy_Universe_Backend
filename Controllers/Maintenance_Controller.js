const db = require('../Classes/database'); // Adjust path to your DB class

exports.keepUniverseAlive = async (req, res) => {
    console.log("💓 Heartbeat started: Poking all systems...");
    
    // We use Promise.allSettled so that if one service is down, 
    // it doesn't stop us from waking up the others.
    const results = await Promise.allSettled([
        // 1. Poke Aiven DB (Using .query is the standard for mysql2)
        // If your database class has a custom method, ensure the name matches here.
        db.query("SELECT 1"),

        // 2. Poke C# Engine (Hits the health check we made)
        fetch(`${process.env.ENGINE_URL}/`).catch(err => console.log("Engine Poke Failed:", err.message)),

        // 3. Poke ML Service (Wakes up Hugging Face)
        fetch(`${process.env.ML_SERVICE_URL}/`, {
            headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}` }
        }).catch(err => console.log("ML Poke Failed:", err.message))
    ]);

    // Map the results to a readable status
    const status = results.map((res, i) => ({
        service: ["Database", "Engine", "ML_Service"][i],
        status: res.status === "fulfilled" ? "✅ Awake" : "❌ Failed/Sleeping"
    }));

    console.log("📊 Heartbeat Result:", status);

    // We send a 200 OK even if a service is "Failed" 
    // This prevents the bot from thinking the Backend itself is dead.
    return res.status(200).json({ 
        success: true, 
        message: "Heartbeat pulse sent to the Poppy Universe.",
        system_status: status
    });
};
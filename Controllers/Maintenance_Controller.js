const db = require('../Classes/database'); // Adjust path to your DB class

exports.keepUniverseAlive = async (req, res) => {
    console.log("💓 Heartbeat started: Poking all systems...");
    
    // We use Promise.allSettled so that if one service is down, 
    // it doesn't stop us from waking up the others.
    const results = await Promise.allSettled([
        // 1. Poke Aiven DB (A simple query keeps the connection pool active)
        db.getQuery("SELECT 1", []),

        // 2. Poke C# Engine (Hits the health check we made)
        fetch(`${process.env.ENGINE_URL}/`),

        // 3. Poke ML Service (Wakes up Hugging Face)
        fetch(`${process.env.ML_SERVICE_URL}/`, {
            headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}` }
        })
    ]);

    const status = results.map((res, i) => ({
        service: ["Database", "Engine", "ML_Service"][i],
        status: res.status === "fulfilled" ? "✅ Awake" : "❌ Failed/Sleeping"
    }));

    console.log("📊 Heartbeat Result:", status);
    return res.json({ 
        success: true, 
        message: "Heartbeat pulse sent to the Poppy Universe.",
        system_status: status
    });
};
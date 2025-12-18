const db = new (require('../Classes/database'))();
const mlController = require('./ML_Controller');

/**
 * 🌌 GET CELESTIAL POOL
 * Fetches 2000 random stars, all planets, and all moons.
 */
exports.getCelestialPool = async (req, res) => { 
    try {
        // 1️⃣ Query Stars: 2000 random stars for variety/discovery
        const starSql = `
            SELECT 
                Star_ID AS Id, Star_Name AS Name, Star_Source AS Source, 
                Star_RA AS RA_ICRS, Star_DE AS DE_ICRS, Star_GMag AS Gmag, 
                Star_SpType AS SpectralType 
            FROM Stars
            WHERE Star_GMag < 12 
            ORDER BY RAND() 
            LIMIT 2000`;

        // 2️⃣ Query Planets: All major bodies
        const planetSql = `
            SELECT 
                Planet_ID AS Id, Planet_Name AS Name, Planet_Magnitude AS Magnitude, 
                Planet_Color AS Color, Planet_Distance_From_Sun AS DistanceFromSun, 
                Planet_Distance_From_Earth AS DistanceFromEarth, Planet_Diameter AS Diameter, 
                Planet_Mass AS Mass, Planet_Orbital_Period AS OrbitalPeriod, 
                Planet_Orbital_Inclination AS OrbitalInclination, Planet_SemiMajorAxisAU AS SemiMajorAxisAU, 
                Planet_Longitude_Ascending_Node AS LongitudeAscendingNode, Planet_Argument_Periapsis AS ArgumentPeriapsis, 
                Planet_Mean_Anomaly AS MeanAnomaly, Planet_Mean_Temperature AS MeanTemperature, 
                Planet_Number_of_Moons AS NumberOfMoons, Planet_Has_Rings AS HasRings, 
                Planet_Has_Magnetic_Field AS HasMagneticField, Planet_Type AS Type 
            FROM Planets`;

        // 3️⃣ Query Moons: All natural satellites
        const moonSql = `
            SELECT 
                Moon_ID AS Id, Moon_Name AS Name, Parent_Planet_Name AS Parent, 
                Moon_Color AS Color, Moon_Diameter AS Diameter, Moon_Mass AS Mass, 
                Moon_Orbital_Period AS OrbitalPeriod, Moon_SemiMajorAxisKm AS SemiMajorAxisKm, 
                Moon_Inclination AS Inclination, Moon_Surface_Temperature AS SurfaceTemperature, 
                Moon_Composition AS Composition, Moon_Surface_Features AS SurfaceFeatures, 
                Moon_Distance_From_Earth AS DistanceFromEarth 
            FROM Moons`;

        // Run all queries simultaneously
        const [stars, planets, moons] = await Promise.all([
            db.getQuery(starSql),
            db.getQuery(planetSql),
            db.getQuery(moonSql)
        ]);

        // Construct the single "Pool" object
        const pool = {
            Stars: stars,
            Planets: planets,
            Moons: moons
        };

        res.json({
            success: true,
            count: {
                stars: stars.length,
                planets: planets.length,
                moons: moons.length
            },
            data: pool
        });

    } catch (err) {
        console.error("Celestial Pool Error:", err);
        res.status(500).json({ success: false, error: "Failed to gather celestial data pool." });
    }
};

exports.getUserConfig = async (req, res) => {
    // 🛡️ SECURITY CHECK: Ensure the middleware actually caught the ID
    const userId = req.userId; 

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: No explorer ID found." });
    }

    // Capture location/time from body (sent by Postman or Frontend)
    const { 
        latitude = 51.016, 
        longitude = 4.242, 
        observationTime = new Date().toISOString() 
    } = req.body; 

    try {
        // 1️⃣ Fetch Basic User Info (Using your specific column names like User_Name)
        const userRows = await db.getQuery(
            "SELECT User_ID, User_Name FROM Users WHERE User_ID = ?", 
            [userId]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "Explorer not found." });
        }

        // 2️⃣ Fetch 'Liked_Objects' (Updating the table name and joins)
        const likesSql = `
            SELECT lo.Object_Type, 
                   CASE 
                     WHEN lo.Object_Type = 'Star' THEN s.Star_Name
                     WHEN lo.Object_Type = 'Planet' THEN p.Planet_Name
                     WHEN lo.Object_Type = 'Moon' THEN m.Moon_Name
                   END AS Name
            FROM Liked_Objects lo
            LEFT JOIN Stars s ON lo.Object_Type = 'Star' AND lo.Object_Reference_ID = s.Star_ID
            LEFT JOIN Planets p ON lo.Object_Type = 'Planet' AND lo.Object_Reference_ID = p.Planet_ID
            LEFT JOIN Moons m ON lo.Object_Type = 'Moon' AND lo.Object_Reference_ID = m.Moon_ID
            WHERE lo.User_ID = ?
        `;
        const likeRows = await db.getQuery(likesSql, [userId]);

        // 3️⃣ Format for C#
        const userConfig = {
            ID: userId,
            Name: userRows[0].User_Name,
            Latitude: parseFloat(latitude),
            Longitude: parseFloat(longitude),
            ObservationTime: observationTime,
            LikedStars: likeRows.filter(l => l.Object_Type === 'Star').map(l => l.Name),
            LikedPlanets: likeRows.filter(l => l.Object_Type === 'Planet').map(l => l.Name),
            LikedMoons: likeRows.filter(l => l.Object_Type === 'Moon').map(l => l.Name)
        };

        res.json({ success: true, data: userConfig });

    } catch (err) {
        console.error("User Config Fetch Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 📈 GET LAYER 2 (TRENDING)
 */
exports.getLayer2Data = async (req, res) => {
    try {
        // Pass null for req and res to trigger the internal 'return'
        const trendingData = await mlController.runLayer2Model(null, null);
        
        res.json({
            success: true,
            source: "ML_Controller_Internal",
            count: trendingData?.length || 0,
            data: trendingData
        });
    } catch (err) {
        console.error("Layer 2 Engine Call Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧬 GET LAYER 3 (COLLABORATIVE FILTERING)
 */
exports.getLayer3Data = async (req, res) => {
    try {
        const l3Data = await mlController.runLayer3Model(null, null);
        
        res.json({
            success: true,
            count: l3Data?.length || 0,
            data: l3Data
        });
    } catch (err) {
        console.error("Layer 3 Engine Call Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧠 GET LAYER 4 (NEURAL NETWORK)
 */
exports.getLayer4Data = async (req, res) => {
    try {
        const l4Data = await mlController.runLayer4Model(null, null);
        
        res.json({
            success: true,
            count: l4Data?.length || 0,
            data: l4Data
        });
    } catch (err) {
        console.error("Layer 4 Engine Call Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
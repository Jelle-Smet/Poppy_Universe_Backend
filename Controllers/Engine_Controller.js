const db = new (require('../Classes/database'))();
const mlController = require('./ML_Controller');
const path = require('path');
const { spawn } = require('child_process');

/**
 * 🌌 GET CELESTIAL POOL
 * Fetches 2000 random stars (filtered for 100% complete data), all planets, and all moons.
 */
exports.getCelestialPool = async (req, res) => { 
    try {
        // 1️⃣ Query Stars: Applying your dynamic "Complete Stars" logic
        // This ensures every star has all values for the C# engine to work with.
        const starSql = `
            SELECT 
                Star_ID AS Id, 
                Star_Name AS Name, 
                Star_Source AS Source, 
                Star_RA AS RA_ICRS, 
                Star_DE AS DE_ICRS, 
                Star_GMag AS Gmag, 
                Star_BPMag AS BPmag, 
                Star_RPMag AS RPmag, 
                NULL AS Parallax, 
                Star_SpType AS SpectralType, 
                Star_Teff AS Teff, 
                Star_Luminosity AS Luminosity, 
                Star_Mass AS Mass, 
                NULL AS IsBinary, 
                NULL AS HasPlanetCandidates
            FROM Stars
            WHERE 
                -- String columns MUST NOT BE NULL
                Star_Name IS NOT NULL AND 
                Star_Source IS NOT NULL AND 
                Star_SpType IS NOT NULL AND
                -- Numeric columns MUST NOT BE NULL (replicating your COLUMN = COLUMN logic)
                Star_RA = Star_RA AND 
                Star_DE = Star_DE AND 
                Star_GMag = Star_GMag AND
                Star_BPMag = Star_BPMag AND
                Star_RPMag = Star_RPMag AND
                Star_Teff = Star_Teff AND
                Star_Luminosity = Star_Luminosity AND
                Star_Mass = Star_Mass AND
                -- Brightness threshold
                Star_GMag < 12
            ORDER BY RAND() 
            LIMIT 2000`;

        // 2️⃣ Query Planets: Mapping exactly to your Planet_Objects.cs
        const planetSql = `
            SELECT 
                Planet_ID AS Id, 
                Planet_Name AS Name, 
                Planet_Type AS Type, 
                Planet_Color AS Color, 
                Planet_Distance_From_Sun AS DistanceFromSun, 
                Planet_Distance_From_Earth AS DistanceFromEarth, 
                Planet_Diameter AS Diameter, 
                Planet_Mass AS Mass, 
                Planet_Mean_Temperature AS MeanTemperature, 
                Planet_Number_of_Moons AS NumberOfMoons, 
                Planet_Has_Rings AS HasRings, 
                Planet_Has_Magnetic_Field AS HasMagneticField, 
                Planet_Magnitude AS Magnitude, 
                Planet_SemiMajorAxisAU AS SemiMajorAxis, 
                NULL AS Eccentricity,
                Planet_Orbital_Inclination AS OrbitalInclination, 
                Planet_Longitude_Ascending_Node AS LongitudeOfAscendingNode, 
                Planet_Argument_Periapsis AS ArgumentOfPeriapsis, 
                Planet_Mean_Anomaly AS MeanAnomalyAtEpoch, 
                NULL AS MeanMotion, 
                Planet_Orbital_Period AS OrbitalPeriod
            FROM Planets`;

        // 3️⃣ Query Moons: Mapping exactly to your Moon_Objects.cs
        const moonSql = `
            SELECT 
                Moon_ID AS Id, 
                Moon_Name AS Name, 
                Parent_Planet_Name AS Parent, 
                Moon_Color AS Color, 
                Moon_Diameter AS Diameter, 
                Moon_Mass AS Mass, 
                Moon_Surface_Temperature AS SurfaceTemperature, 
                Moon_Composition AS Composition, 
                Moon_Surface_Features AS SurfaceFeatures, 
                NULL AS Magnitude, 
                Moon_Distance_From_Earth AS DistanceFromEarth, 
                NULL AS Density, 
                NULL AS SurfaceGravity, 
                NULL AS EscapeVelocity, 
                NULL AS RotationPeriod, 
                NULL AS NumberOfRings, 
                Moon_SemiMajorAxisKm AS SemiMajorAxisKm, 
                NULL AS Eccentricity, 
                Moon_Inclination AS Inclination, 
                NULL AS LongitudeOfAscendingNode, 
                NULL AS ArgumentOfPeriapsis, 
                NULL AS MeanAnomalyAtEpoch, 
                NULL AS MeanMotion, 
                Moon_Orbital_Period AS OrbitalPeriod
            FROM Moons`;

        // Run all queries simultaneously
        const [stars, planets, moons] = await Promise.all([
            db.getQuery(starSql),
            db.getQuery(planetSql),
            db.getQuery(moonSql)
        ]);

        const pool = {
            Stars: stars,
            Planets: planets,
            Moons: moons
        };

        if (res) {
            return res.json({
                success: true,
                count: { stars: stars.length, planets: planets.length, moons: moons.length },
                data: pool
            });
        }
        return { success: true, data: pool };

    } catch (err) {
        console.error("Celestial Pool Error:", err);
        if (res) res.status(500).json({ success: false, error: "Failed to gather celestial data pool." });
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

        if (res) {
            return res.json({ success: true, data: userConfig });
        } else {
            return { success: true, data: userConfig };
        }

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
        // Pass null for req and res to mlController to trigger internal return
        const trendingData = await mlController.runLayer2Model(null, null);
        
        // ✨ THE FIX: Only call .json() if 'res' actually exists!
        if (res) {
            return res.json({
                success: true,
                source: "ML_Controller_Internal",
                count: trendingData?.length || 0,
                data: trendingData
            });
        }

        // If res is null, we just return the data object so executeEngine can use it
        return { success: true, data: trendingData };

    } catch (err) {
        console.error("Layer 2 Engine Call Error:", err);
        if (res) {
            return res.status(500).json({ success: false, error: err.message });
        }
        throw err; // Throw so executeEngine knows something went wrong
    }
};

/**
 * 🧬 GET LAYER 3 (COLLABORATIVE FILTERING)
 * Updated to be "Hybrid" so it doesn't crash the engine.
 */
exports.getLayer3Data = async (req, res) => {
    try {
        // 1. Handle both ID-only calls and standard req/res calls
        // If 'req' is just an ID string/number, use it. Otherwise, look for req.userId.
        const userId = (typeof req !== 'object') ? req : (req.userId || req.body?.userId);

        if (!userId) {
            throw new Error("User ID is required for Layer 3 personalization.");
        }

        // 2. Run the model
        const l3Data = await mlController.runLayer3Model(userId, null);
        
        // ✨ THE HYBRID CHECK: Only call .json() if 'res' actually exists!
        if (res) {
            return res.json({
                success: true,
                count: l3Data?.length || 0,
                data: l3Data
            });
        }

        // 3. Internal Return: If res is null, we just return the data object
        // This is what executeEngine will receive.
        return { success: true, data: l3Data };

    } catch (err) {
        console.error("Layer 3 Engine Call Error:", err);
        
        // Only try to use res.status if res exists
        if (res) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        // Throw so executeEngine's try/catch can handle it
        throw err; 
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


// --------------------------------------
// Run Engine Endpoints
//---------------------------------------

// Helper to safely extract only the number from a string like "2.5%" or "Boosted: 10"
const safeParseFloat = (val) => {
    if (!val) return 0;
    // Regex: find the first sequence of numbers and optional decimal point
    const match = String(val).match(/[-+]?([0-9]*\.[0-9]+|[0-9]+)/);
    return match ? parseFloat(match[0]) : 0;
};

// ═══════════════════════════════════════════════════════════════
// 🛠️ MAPPING HELPERS (Flattens C# nested data into clean JSON)
// ═══════════════════════════════════════════════════════════════
const mapStarResult = (s) => ({
    Star_ID: s.Star.Id,
    Star_Name: s.Star.Name,
    Star_Source: s.Star.Source,
    Star_SpType: s.Star.SpectralType,
    Star_Evol_Category: s.Star.Star_Evol_Category || "unknown",
    Star_Age: s.Star.Age,
    Star_Teff: s.Star.Teff,
    Star_Luminosity: s.Star.Luminosity,
    Star_Mass: s.Star.Mass,
    Star_Radius: s.Star.Radius,
    Star_Distance: s.Star.Distance,
    // Positioning Data
    Altitude: s.Altitude, 
    Azimuth: s.Azimuth,
    Is_Visible: s.IsVisible,
    // Engine Results
    Match_Score: s.Score,
    Match_Percentage: s.MatchPercentage,
    // 📈 Boost Data
    Boost_Amount_Pct: safeParseFloat(s.BoostDescription),
    Weather_Visibility_Chance: s.VisibilityChance,
    Weather_Explanation: s.ChanceReason
});

const mapPlanetResult = (p) => ({
    Planet_ID: p.Planet.Id,
    Planet_Name: p.Planet.Name,
    Planet_Color: p.Planet.Color,
    Planet_Distance_From_Sun: p.Planet.DistanceFromSun,
    Planet_Magnitude: p.Planet.Magnitude,
    Planet_Type: p.Planet.Type,
    Planet_Diameter: p.Planet.Diameter,
    Planet_Number_of_Moons: p.Planet.NumberOfMoons,
    Planet_Mass: p.Planet.Mass,
    // Positioning Data
    Altitude: p.Altitude,
    Azimuth: p.Azimuth,
    Is_Visible: p.IsVisible,
    // Engine Results
    Match_Score: p.Score,
    Match_Percentage: p.MatchPercentage,
    // 📈 Boost Data
    Boost_Amount_Pct: safeParseFloat(p.BoostDescription),
    Weather_Visibility_Chance: p.VisibilityChance,
    Weather_Explanation: p.ChanceReason
});

const mapMoonResult = (m) => ({
    Moon_ID: m.Moon.Id,
    Moon_Name: m.Moon.Name,
    Parent_Planet_Name: m.Parent,
    Moon_Color: m.Moon.Color,
    Moon_Diameter: m.Moon.Diameter,
    Moon_Mass: m.Moon.Mass,
    // Positioning Data
    Altitude: m.Altitude,
    Azimuth: m.Azimuth,
    Is_Visible: m.IsVisible,
    // Engine Results
    Match_Score: m.Score,
    Match_Percentage: m.MatchPercentage,
    // 📈 Boost Data
    Boost_Amount_Pct: safeParseFloat(m.BoostDescription),
    Weather_Visibility_Chance: m.VisibilityChance,
    Weather_Explanation: m.ChanceReason
});

// ═══════════════════════════════════════════════════════════════
// 🌌 THE MASTER ENGINE EXECUTOR
// ═══════════════════════════════════════════════════════════════

/**
 * 🚀 MASTER ENGINE EXECUTOR
 * Layers: L1 (Base), L2 (Trending), L3 (Matrix Factorization),
 */
const executeEngine = async (req, res, layers = { l2: false, l3: false, l4: false, l5: false }) => {
    try {
        // 1️⃣ Gather Base Data (L1 Fuel)
        const poolData = await exports.getCelestialPool(null, null); 
        const userConfig = await exports.getUserConfig(req, null); 

        // ✨ GLOBAL ID: Define it here so all layers can use it
        const userId = userConfig.data?.ID;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: No explorer ID found." });
        }

        // 2️⃣ Build Payload Shell
        const enginePayload = {
            User: userConfig.data,
            Pool: poolData.data,
            Config: layers, 
            Layer2Data: null,
            Layer3Data: null,
            Layer4Data: null // ✨ Placeholder for Layer 4
        };

        // 📈 LAYER 2: TRENDING DATA
        if (layers.l2) {
            const trendingResponse = await exports.getLayer2Data(null, null);
            enginePayload.Layer2Data = trendingResponse.data;
        }

        // 🧬 LAYER 3: PERSONALIZATION MATRIX
        if (layers.l3) {
            // Pass the globally defined userId
            const matrixResponse = await exports.getLayer3Data(userId);
            
            // Ensure C# gets a single object, not an array
            enginePayload.Layer3Data = Array.isArray(matrixResponse.data) 
                ? matrixResponse.data[0] 
                : matrixResponse.data;
        }

        // 🕒 LAYER 4: USER HISTORY / DISCOVERY
        if (layers.l4) {
            console.log(`Layer 4 requested for User: ${userId}`);
            // This is where you'll call your L4 data fetcher
            // const historyResponse = await exports.getLayer4Data(userId);
            // enginePayload.Layer4Data = historyResponse.data;
        }

        // 3️⃣ Spawn C# Engine
        const enginePath = path.resolve(__dirname, '../../../Recommendation_Engine/Poppy_Universe_Engine/bin/Debug/net8.0/Poppy_Universe_Engine.exe');
        const engine = spawn(enginePath);

        let output = '';
        let engineStderr = '';

        engine.on('error', (err) => {
            console.error("❌ FAILED TO START ENGINE:", err);
            if (!res.headersSent) res.status(500).json({ error: "Failed to start C# engine." });
        });

        engine.stdout.on('data', (data) => { output += data.toString(); });
        engine.stderr.on('data', (data) => { engineStderr += data.toString(); });

        // 4️⃣ Pipe the data to C# via stdin
        engine.stdin.write(JSON.stringify(enginePayload));
        engine.stdin.end();

        // 5️⃣ On finish, clean up and send results
        engine.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ error: "Engine crashed", details: engineStderr });
            }

            try {
                const marker = "---JSON_START---";
                if (!output.includes(marker)) throw new Error("JSON marker missing.");

                const jsonPart = output.substring(output.indexOf(marker) + marker.length).trim();
                const rawResults = JSON.parse(jsonPart);

                res.json({
                    success: true,
                    active_layers: layers,
                    results: {
                        Stars: (rawResults.Stars || []).map(mapStarResult),
                        Planets: (rawResults.Planets || []).map(mapPlanetResult),
                        Moons: (rawResults.Moons || []).map(mapMoonResult)
                    }
                });

            } catch (err) {
                res.status(500).json({ error: "Failed to process engine results", message: err.message });
            }
        });

    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// 🌟 THE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// L1 Only (Existing)
exports.runLayer1Full = async (req, res) => {
    return executeEngine(req, res, { l2: false, l3: false, l4: false, l5: false });
};

// L1 + L2 Trending (New!)
exports.runLayer1And2 = async (req, res) => {
    return executeEngine(req, res, { l2: true, l3: false, l4: false, l5: false });
};

// L1 + L3 Matrix Factorization
exports.runLayer1And3 = async (req, res) => {
    return executeEngine(req, res, { l2: false, l3: true, l4: false, l5: false });
};
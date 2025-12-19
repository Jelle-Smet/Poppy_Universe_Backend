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

/**
 * 🌌 RUN LAYER 1 ENGINE
 * Gathers data, runs the C# Recommendation Engine, and flattens the results.
 */
exports.runLayer1Full = async (req, res) => {
    try {
        // 1️⃣ Gather all data from your existing endpoints
        const poolData = await exports.getCelestialPool(null, null); 
        const userConfig = await exports.getUserConfig(req, null); 

        // 2️⃣ Combine into the "Big Mac" Payload
        const enginePayload = {
            User: userConfig.data,
            Pool: poolData.data
        };

        // ==========================================================
        // 🚀 DEPLOYMENT CHANGE START
        // ==========================================================
        /* Once deployed (e.g., on Azure or AWS), you can't "spawn" a local .exe 
           easily from a web server. You will replace the "Spawn C# Engine" 
           section below with an HTTP request to your hosted Engine API:

           const response = await axios.post(process.env.ENGINE_SERVICE_URL, enginePayload);
           return res.json({
               success: true,
               results: response.data.results // Assuming the hosted engine returns clean JSON
           });
        */
        // ==========================================================

        // 3️⃣ Spawn C# Engine (LOCAL ONLY)
        const enginePath = path.resolve(__dirname, '../../../Recommendation_Engine/Poppy_Universe_Engine/bin/Debug/net8.0/Poppy_Universe_Engine.exe');
        
        // Note: On some Linux servers, you might need to spawn 'mono' or use 'dotnet'
        const engine = spawn(enginePath);

        let output = '';
        let engineStderr = '';

        engine.on('error', (err) => {
            console.error("❌ FAILED TO START ENGINE:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to start C# engine.", details: err.message });
            }
        });

        engine.stdout.on('data', (data) => {
            output += data.toString();
            console.log("C# Output Chunk Received"); 
        });

        engine.stderr.on('data', (data) => {
            engineStderr += data.toString();
        });

        // 4️⃣ Pipe the data to C# via stdin
        engine.stdin.write(JSON.stringify(enginePayload));
        engine.stdin.end();

        // 5️⃣ On finish, process the raw output
        engine.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ error: "Engine crashed", details: engineStderr });
            }

            try {
                const marker = "---JSON_START---";
                if (!output.includes(marker)) {
                    throw new Error("Could not find JSON marker in C# output.");
                }

                const jsonPart = output.substring(output.indexOf(marker) + marker.length).trim();
                const finalResults = JSON.parse(jsonPart);

                // ✨ FLATTEN & CLEAN RESULTS (The mapping you requested)
                const cleanStars = (finalResults.Stars || []).map(s => ({
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
                    Match_Score: s.Score,
                    Match_Percentage: s.MatchPercentage,
                    Weather_Visibility_Chance: s.VisibilityChance,
                    Weather_Explanation: s.ChanceReason
                }));

                const cleanPlanets = (finalResults.Planets || []).map(p => ({
                    Planet_ID: p.Planet.Id,
                    Planet_Name: p.Planet.Name,
                    Planet_Color: p.Planet.Color,
                    Planet_Distance_From_Sun: p.Planet.DistanceFromSun,
                    Planet_Magnitude: p.Planet.Magnitude,
                    Planet_Type: p.Planet.Type,
                    Planet_Diameter: p.Planet.Diameter,
                    Planet_Number_of_Moons: p.Planet.NumberOfMoons,
                    Planet_Mass: p.Planet.Mass,
                    Match_Score: p.Score,
                    Match_Percentage: p.MatchPercentage,
                    Weather_Visibility_Chance: p.VisibilityChance,
                    Weather_Explanation: p.ChanceReason
                }));

                const cleanMoons = (finalResults.Moons || []).map(m => ({
                    Moon_ID: m.Moon.Id,
                    Moon_Name: m.Moon.Name,
                    Parent_Planet_Name: m.Parent,
                    Moon_Color: m.Moon.Color,
                    Moon_Diameter: m.Moon.Diameter,
                    Moon_Mass: m.Moon.Mass,
                    Match_Score: m.Score,
                    Match_Percentage: m.MatchPercentage,
                    Weather_Visibility_Chance: m.VisibilityChance,
                    Weather_Explanation: m.ChanceReason
                }));

                res.json({
                    success: true,
                    results: {
                        Stars: cleanStars,
                        Planets: cleanPlanets,
                        Moons: cleanMoons
                    }
                });

            } catch (err) {
                console.error("Parse Error:", err);
                res.status(500).json({ error: "Failed to process engine results", message: err.message });
            }
        });
        // 🚀 DEPLOYMENT CHANGE END

    } catch (err) {
        console.error("General runLayer1Full Error:", err);
        res.status(500).json({ error: err.message });
    }
};
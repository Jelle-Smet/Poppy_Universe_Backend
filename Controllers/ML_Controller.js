const db = new (require('../Classes/database'))();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// ENDPOINTS TO EXTRACT DATA FROM DATABASE

// ---------------- LAYER 2 ----------------
exports.getLayer2Data = async (req, res) => {
  try {
    const sql = `
      SELECT
        Interaction_ID,
        User_ID,
        Object_Type,
        Object_Reference_ID AS Object_ID,
        Interaction_Type,
        Interaction_Rating,
        Interaction_Timestamp AS Timestamp
      FROM Interactions
      WHERE Interaction_Type IN ('Like', 'Rate', 'View');
    `;

    const data = await db.getQuery(sql, []);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching Layer 2 data:', err);
    return res.status(500).json({ message: 'Failed to fetch Layer 2 data' });
  }
};

// ---------------- LAYER 3 ----------------
exports.getLayer3Data = async (req, res) => {
  try {
    const sql = `
      SELECT
        i.Interaction_ID,
        i.User_ID,
        i.Object_Type AS Category_Type,
        CASE i.Object_Type
            WHEN 'Star' THEN s.Star_SpType
            WHEN 'Planet' THEN p.Planet_Type
            WHEN 'Moon' THEN m.Parent_Planet_Name
        END AS Category_Value,
        CASE i.Interaction_Type
            WHEN 'Like' THEN 1
            WHEN 'Rate' THEN i.Interaction_Rating
            ELSE 0
        END AS Strength,
        i.Interaction_Timestamp AS Timestamp
      FROM Interactions i
      LEFT JOIN Stars s ON i.Object_Type='Star' AND i.Object_Reference_ID = s.Star_ID
      LEFT JOIN Planets p ON i.Object_Type='Planet' AND i.Object_Reference_ID = p.Planet_ID
      LEFT JOIN Moons m ON i.Object_Type='Moon' AND i.Object_Reference_ID = m.Moon_ID
      WHERE i.Interaction_Type IN ('Like', 'Rate');
    `;

    const data = await db.getQuery(sql, []);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching Layer 3 data:', err);
    return res.status(500).json({ message: 'Failed to fetch Layer 3 data' });
  }
};

// ---------------- LAYER 4 ----------------
exports.getLayer4Data = async (req, res) => {
  try {
    const sql = `
      SELECT
        i.Interaction_ID,
        i.User_ID,
        i.Object_Type AS Category_Type,
        CASE i.Object_Type
            WHEN 'Star' THEN s.Star_SpType
            WHEN 'Planet' THEN p.Planet_Type
            WHEN 'Moon' THEN m.Parent_Planet_Name
        END AS Category_Value,
        CASE i.Interaction_Type
            WHEN 'Like' THEN 1
            WHEN 'Rate' THEN i.Interaction_Rating
            ELSE 0
        END AS Strength,
        i.Interaction_Timestamp AS Timestamp
      FROM Interactions i
      LEFT JOIN Stars s ON i.Object_Type='Star' AND i.Object_Reference_ID = s.Star_ID
      LEFT JOIN Planets p ON i.Object_Type='Planet' AND i.Object_Reference_ID = p.Planet_ID
      LEFT JOIN Moons m ON i.Object_Type='Moon' AND i.Object_Reference_ID = m.Moon_ID
      WHERE i.Interaction_Type IN ('Like', 'Rate');
    `;

    const data = await db.getQuery(sql, []);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching Layer 4 data:', err);
    return res.status(500).json({ message: 'Failed to fetch Layer 4 data' });
  }
};

// ENDPOINTS TO RUN THE ML MODELS WITH EXPORTED DATA 

// ---------------- LAYER 2 : RUN MODEL ----------------
exports.runLayer2Model = async (req, res) => {
    const startedAt = new Date();
    const outputCsvPath = path.resolve(__dirname, '../../../Machine_Learning/Output_Data/Layer_2_Top_Trending_Per_Type.csv');

    try {
        // 1️⃣ Get data from DB
        const sql = `
            SELECT 
                Interaction_ID, User_ID, Object_Type, 
                Object_Reference_ID AS Object_ID, 
                Interaction_Type, Interaction_Rating, 
                Interaction_Timestamp AS Timestamp
            FROM Interactions
            WHERE Interaction_Type IN ('Like', 'Rate', 'View');
        `;
        const dbData = await db.getQuery(sql, []);
        const dbCount = dbData.length; 

        // 2️⃣ Decide logic based on that length
        let dataSource = dbCount >= 300 ? 'database' : 'fictional';

        // ⚡ SHORT-CIRCUIT: If data is low, skip Python and return existing CSV instantly.
        if (dataSource === 'fictional') {
            console.log(`Layer 2: Low data (${dbCount}). Returning cached trends.`);
            return returnCsvAsJson(outputCsvPath, dataSource, startedAt, res, {
                dbCount,
                totalRowsProcessed: 0
            });
        }

        // ==========================================================
        // 🚀 DEPLOYMENT CHANGE START
        // ==========================================================
        /* Once deployed on separate providers, DELETE the "Spawn Python" 
           section below and replace it with an HTTP request like this:

           const response = await axios.post(process.env.ML_SERVICE_URL, {
               dataSource: dataSource,
               data: dbData 
           });
           
           return res.json({
               success: true,
               ...response.data, 
               dbCount: dbData.length,
               startedAt
           });
        */
        // ==========================================================

        // 3️⃣ Spawn Python (LOCAL ONLY - Runs only if data >= 300)
        const scriptPath = path.resolve(__dirname, '../../../Machine_Learning/Models/Layer_2/Scripts/Trend_Model.py');
        const python = spawn('python', ['-u', scriptPath], {
            env: { ...process.env, DATA_SOURCE: dataSource },
            cwd: path.dirname(scriptPath)
        });

        // 4️⃣ Send data to Python via stdin
        python.stdin.write(JSON.stringify(dbData));
        python.stdin.end(); 

        let pythonLogs = '';
        let stderr = '';
        python.stdout.on('data', (d) => { pythonLogs += d.toString(); });
        python.stderr.on('data', (d) => { stderr += d.toString(); });

        python.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ success: false, error: stderr || 'Python failed' });
            }

            const rowMatch = pythonLogs.match(/TOTAL_ROWS_PROCESSED: (\d+)/);
            const totalRowsProcessed = rowMatch ? parseInt(rowMatch[1]) : 0;

            return returnCsvAsJson(outputCsvPath, dataSource, startedAt, res, {
                dbCount,
                totalRowsProcessed
            });
        });
        // 🚀 DEPLOYMENT CHANGE END (Keep this marker for the block above)

    } catch (err) {
        console.error('Layer 2 failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ---------------- LAYER 3 : RUN MASTER MODEL ----------------
exports.runLayer3Model = async (req, res) => {
    const startedAt = new Date();
    const outputCsvPath = path.resolve(__dirname, '../../../Machine_Learning/Output_Data/Layer_3_Final_Predictions.csv');

    try {
        // 1️⃣ Get data from DB
        const sql = `
          SELECT
            i.Interaction_ID, i.User_ID, i.Object_Type AS Category_Type,
            CASE i.Object_Type
                WHEN 'Star' THEN s.Star_SpType
                WHEN 'Planet' THEN p.Planet_Type
                WHEN 'Moon' THEN m.Parent_Planet_Name
            END AS Category_Value,
            CASE i.Interaction_Type
                WHEN 'Like' THEN 1
                WHEN 'Rate' THEN i.Interaction_Rating
                ELSE 0
            END AS Strength,
            i.Interaction_Timestamp AS Timestamp
          FROM Interactions i
          LEFT JOIN Stars s ON i.Object_Type='Star' AND i.Object_Reference_ID = s.Star_ID
          LEFT JOIN Planets p ON i.Object_Type='Planet' AND i.Object_Reference_ID = p.Planet_ID
          LEFT JOIN Moons m ON i.Object_Type='Moon' AND i.Object_Reference_ID = m.Moon_ID
          WHERE i.Interaction_Type IN ('Like', 'Rate');
        `;
        const dbData = await db.getQuery(sql, []);
        const dbCount = dbData.length;

        // 2️⃣ Define Threshold & Short-Circuit
        const MIN_REQUIRED = 500; 
        let dataSource = dbCount >= MIN_REQUIRED ? 'database' : 'fictional';

        if (dataSource === 'fictional') {
            return returnCsvAsJson(outputCsvPath, dataSource, startedAt, res, {
                dbCount,
                totalRowsProcessed: 0
            });
        }

        // ==========================================================
        // 🚀 DEPLOYMENT CHANGE START
        // ==========================================================
        /* Once deployed on separate providers, DELETE the "Spawn Python" 
           section below and replace it with an HTTP request like this:

           const response = await axios.post(process.env.ML_SERVICE_URL_L3, {
               dataSource: dataSource,
               data: dbData 
           });
           
           return res.json({
               success: true,
               ...response.data, 
               dbCount: dbData.length,
               startedAt
           });
        */
        // ==========================================================

        // 3️⃣ Spawn Master Python (LOCAL ONLY)
        const scriptPath = path.resolve(__dirname, '../../../Machine_Learning/Models/Layer_3/Scripts/Layer_3_Master_File.py');
        const python = spawn('python', ['-u', scriptPath], {
            env: { ...process.env, DATA_SOURCE: dataSource },
            cwd: path.dirname(scriptPath)
        });

        // 4️⃣ Pipe data to Python via stdin
        python.stdin.write(JSON.stringify(dbData));
        python.stdin.end();

        let pythonLogs = '';
        let stderr = '';
        python.stdout.on('data', (d) => { pythonLogs += d.toString(); });
        python.stderr.on('data', (d) => { stderr += d.toString(); });

        python.on('close', (code) => {
            if (code !== 0) return res.status(500).json({ success: false, error: stderr || 'Layer 3 Master failed' });
            const rowMatch = pythonLogs.match(/TOTAL_ROWS_PROCESSED: (\d+)/);
            const totalRowsProcessed = rowMatch ? parseInt(rowMatch[1]) : 0;

            return returnCsvAsJson(outputCsvPath, dataSource, startedAt, res, {
                dbCount,
                totalRowsProcessed
            });
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ---------------- LAYER 4 : RUN MASTER NN MODEL ----------------
exports.runLayer4Model = async (req, res) => {
    const startedAt = new Date();
    const outputCsvPath = path.resolve(__dirname, '../../../Machine_Learning/Output_Data/Layer4_Final_Predictions.csv');

    try {
        // 1️⃣ Get data from DB
        const sql = `
          SELECT
            i.Interaction_ID, i.User_ID, i.Object_Type AS Category_Type,
            CASE i.Object_Type
                WHEN 'Star' THEN s.Star_SpType
                WHEN 'Planet' THEN p.Planet_Type
                WHEN 'Moon' THEN m.Parent_Planet_Name
            END AS Category_Value,
            CASE i.Interaction_Type
                WHEN 'Like' THEN 1
                WHEN 'Rate' THEN i.Interaction_Rating
                ELSE 0
            END AS Strength,
            i.Interaction_Timestamp AS Timestamp
          FROM Interactions i
          LEFT JOIN Stars s ON i.Object_Type='Star' AND i.Object_Reference_ID = s.Star_ID
          LEFT JOIN Planets p ON i.Object_Type='Planet' AND i.Object_Reference_ID = p.Planet_ID
          LEFT JOIN Moons m ON i.Object_Type='Moon' AND i.Object_Reference_ID = m.Moon_ID
          WHERE i.Interaction_Type IN ('Like', 'Rate');
        `;
        const dbData = await db.getQuery(sql, []);
        const dbCount = dbData.length;

        // 2️⃣ Decide: Short-circuit if low data
        const MIN_REQUIRED = 500; 
        let dataSource = dbCount >= MIN_REQUIRED ? 'database' : 'fictional';

        if (dataSource === 'fictional') {
            return returnCsvAsJson(outputCsvPath, dataSource, startedAt, res, { 
                dbCount, 
                totalRowsProcessed: 0 
            });
        }

        // ==========================================================
        // 🚀 DEPLOYMENT CHANGE START
        // ==========================================================
        /* Once deployed on separate providers, DELETE the "Spawn Python" 
           section below and replace it with an HTTP request like this:

           const response = await axios.post(process.env.ML_SERVICE_URL_L4, {
               dataSource: dataSource,
               data: dbData 
           });
           
           return res.json({
               success: true,
               ...response.data, 
               dbCount: dbData.length,
               startedAt
           });
        */
        // ==========================================================

        // 3️⃣ Spawn Master Python (LOCAL ONLY)
        const scriptPath = path.resolve(__dirname, '../../../Machine_Learning/Models/Layer_4/Scripts/Master_Layer4.py');
        const python = spawn('python', ['-u', scriptPath], {
            env: { ...process.env, DATA_SOURCE: dataSource },
            cwd: path.dirname(scriptPath)
        });

        // 4️⃣ Pipe data to Python
        python.stdin.write(JSON.stringify(dbData));
        python.stdin.end();

        let pythonLogs = '';
        let stderr = '';
        python.stdout.on('data', (d) => { pythonLogs += d.toString(); });
        python.stderr.on('data', (d) => { stderr += d.toString(); });

        python.on('close', (code) => {
            if (code !== 0) return res.status(500).json({ success: false, error: stderr || 'Layer 4 Master failed' });
            const rowMatch = pythonLogs.match(/TOTAL_ROWS_PROCESSED: (\d+)/);
            const totalRowsProcessed = rowMatch ? parseInt(rowMatch[1]) : 0;

            return returnCsvAsJson(outputCsvPath, dataSource, startedAt, res, {
                dbCount,
                totalRowsProcessed
            });
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// --- UPDATED HELPER: Now handles internal calls ---
function returnCsvAsJson(csvPath, dataSource, startedAt, res, meta = {}) {
    if (!fs.existsSync(csvPath)) {
        if (res) return res.status(404).json({ success: false, error: "CSV not found" });
        return []; // Return empty array for internal engine call
    }

    const csvRaw = fs.readFileSync(csvPath, 'utf8');
    const lines = csvRaw.trim().split('\n');
    if (lines.length < 2) return res ? res.json({ success: true, data: [] }) : [];

    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => (obj[h.trim()] = values[i]?.trim()));
        return obj;
    });

    // ✨ THE FORK: If 'res' exists, send to web. If not, return to Engine Controller.
    if (res) {
        return res.json({
            success: true,
            dataSource,
            dbCount: meta.dbCount,
            totalRowsProcessed: meta.totalRowsProcessed,
            startedAt,
            finishedAt: new Date(),
            rows: data.length,
            data
        });
    } else {
        return data; 
    }
}
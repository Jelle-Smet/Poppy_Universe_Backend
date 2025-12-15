// controllers/planetsController.js
const db = new (require('../Classes/database'))();

// ---------------- GET PLANET BY ID ----------------
exports.getPlanetById = async (req, res) => {
  try {
    const planetId = req.params.id;
    if (!planetId) return res.status(400).json({ message: 'Planet ID required' });

    const planet = await db.getQuery(
      `SELECT 
         Planet_ID,
         Planet_Name,
         Planet_Magnitude,
         Planet_Color,
         Planet_Distance_From_Sun,
         Planet_Distance_From_Earth,
         Planet_Diameter,
         Planet_Mass,
         Planet_Orbital_Period,
         Planet_Orbital_Inclination,
         Planet_SemiMajorAxisAU,
         Planet_Longitude_Ascending_Node,
         Planet_Argument_Periapsis,
         Planet_Mean_Anomaly,
         Planet_Mean_Temperature,
         Planet_Number_of_Moons,
         Planet_Has_Rings,
         Planet_Has_Magnetic_Field,
         Planet_Type
       FROM Planets
       WHERE Planet_ID = ?`,
      [planetId]
    );

    if (!planet.length) return res.status(404).json({ message: 'Planet not found' });

    return res.json({ planet: planet[0] });
  } catch (err) {
    console.error('Error fetching planet:', err);
    return res.status(500).json({ message: 'Failed to fetch planet' });
  }
};

// ---------------- GET PLANET ENCYCLOPEDIA (PAGINATED) ----------------
exports.getPlanetEncyclopedia = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200); // hard cap
    const offset = parseInt(req.query.offset) || 0;
    const includeSun = req.query.includeSun === 'true'; // optional: include Sun

    let query = `
      SELECT
        Planet_ID,
        Planet_Name,
        Planet_Color,
        Planet_Distance_From_Sun,
        Planet_Magnitude,
        Planet_Type,
        Planet_Diameter,
        Planet_Number_of_Moons,
        Planet_Mass
      FROM Planets
    `;

    const params = [];
    if (!includeSun) {
      query += ` WHERE Planet_Type != 'Star'`;
    }

    query += ` ORDER BY Planet_ID LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const planets = await db.getQuery(query, params);

    return res.json({
      planets,
      limit,
      offset,
      count: planets.length
    });
  } catch (err) {
    console.error('Error fetching planet encyclopedia:', err);
    return res.status(500).json({ message: 'Failed to fetch planet encyclopedia' });
  }
};


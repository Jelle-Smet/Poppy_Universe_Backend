// controllers/planetsController.js

// go up one folder (..) then into Classes/
const db = new (require('../Classes/database'))();

exports.getAllPlanets = async (req, res) => {
    try {
        const planets = await db.getQuery("SELECT * FROM planets");
        res.json(planets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Couldn't fetch planets 😭" });
    }
};

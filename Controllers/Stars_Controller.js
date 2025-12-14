// Stars_Controller.js
const db = new (require('../Classes/database'))();

// ---------------- GET MY STARS ----------------
const getMyStars = async (req, res) => {
  try {
    const ownerId = req.userId; // use req.userId from your Auth middleware
    if (!ownerId) return res.status(401).json({ message: 'Not authenticated' });

    const stars = await db.getQuery(
      `SELECT Star_ID, Star_Name, Star_Source, Star_RA, Star_DE, Star_Distance,
              Star_SpType, Star_Luminosity, Star_Mass, Star_Age, Star_RV_Category
       FROM Stars
       WHERE Owner_ID = ?`,
      [ownerId]
    );

    return res.json({ stars });
  } catch (err) {
    console.error('Error fetching stars:', err);
    return res.status(500).json({ message: 'Failed to fetch stars' });
  }
};

// ---------------- GET STAR BY ID ----------------
const getStarById = async (req, res) => {
  try {
    const starId = req.params.id;
    if (!starId) return res.status(400).json({ message: 'Star ID required' });

    const star = await db.getQuery(
      `SELECT s.Star_ID, s.Star_Name, s.Star_Source, s.Star_RA, s.Star_DE, s.Star_Distance,
              s.Star_GMag, s.Star_BPMag, s.Star_RPMag, s.Star_Teff, s.Star_LogG, s.Star_FeH,
              s.Star_Radius, s.Star_Luminosity, s.Star_Mass, s.Star_Age, s.Star_SpType,
              s.Star_RV_Category, s.Star_Evol_Category,
              u.User_Name, u.User_FN, u.User_LN
       FROM Stars s
       JOIN Users u ON s.Owner_ID = u.User_ID
       WHERE s.Star_ID = ?`,
      [starId]
    );

    if (!star.length) return res.status(404).json({ message: 'Star not found' });

    const starData = star[0];
    const ownerName = starData.first_name && starData.last_name 
                      ? `${starData.first_name} ${starData.last_name}` 
                      : starData.username;

    return res.json({ star: starData, owner: ownerName });
  } catch (err) {
    console.error('Error fetching star:', err);
    return res.status(500).json({ message: 'Failed to fetch star' });
  }
};


// ---------------- EXPORT ----------------
module.exports = {
  getMyStars,
  getStarById,
};

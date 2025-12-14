const db = new (require('../Classes/database'))();

// ---------------- RATE OBJECT ----------------
const rateObject = async (req, res) => {
  try {
    const userId = req.userId;
    const { objectType, objectId, rating } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    if (!objectType || !objectId || !rating) {
      return res.status(400).json({ message: 'Missing objectType, objectId, or rating' });
    }

    // Check if rating already exists
    const existing = await db.getQuery(
      `SELECT Interaction_ID 
       FROM Interactions
       WHERE User_ID = ?
         AND Object_Type = ?
         AND Object_Reference_ID = ?
         AND Interaction_Type = 'Rate'`,
      [userId, objectType, objectId]
    );

    if (existing.length > 0) {
      // Update rating
      await db.getQuery(
        `UPDATE Interactions
         SET Interaction_Rating = ?
         WHERE Interaction_ID = ?`,
        [rating, existing[0].Interaction_ID]
      );

      return res.status(200).json({ message: 'Rating updated' });
    } else {
      // Insert new rating
      await db.getQuery(
        `INSERT INTO Interactions
         (User_ID, Object_Type, Object_Reference_ID, Interaction_Type, Interaction_Rating)
         VALUES (?, ?, ?, 'Rate', ?)`,
        [userId, objectType, objectId, rating]
      );

      return res.status(200).json({ message: 'Rating created' });
    }
  } catch (err) {
    console.error('Error rating object:', err);
    return res.status(500).json({ message: 'Failed to rate object' });
  }
};

// ---------------- LIKE OBJECT ----------------
const likeObject = async (req, res) => {
  try {
    const userId = req.userId;
    const { objectType, objectId } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    if (!objectType || !objectId) {
      return res.status(400).json({ message: 'Missing objectType or objectId' });
    }

    // Check if already liked
    const existing = await db.getQuery(
      `SELECT Interaction_ID
       FROM Interactions
       WHERE User_ID = ?
         AND Object_Type = ?
         AND Object_Reference_ID = ?
         AND Interaction_Type = 'Like'`,
      [userId, objectType, objectId]
    );

    if (existing.length > 0) {
      // Already liked → do nothing
      return res.status(200).json({ message: 'Already liked' });
    }

    // Insert like once
    await db.getQuery(
      `INSERT INTO Interactions
       (User_ID, Object_Type, Object_Reference_ID, Interaction_Type)
       VALUES (?, ?, ?, 'Like')`,
      [userId, objectType, objectId]
    );

    return res.status(200).json({ message: 'Liked' });
  } catch (err) {
    console.error('Error liking object:', err);
    return res.status(500).json({ message: 'Failed to like object' });
  }
};

module.exports = {
  rateObject,
  likeObject
};

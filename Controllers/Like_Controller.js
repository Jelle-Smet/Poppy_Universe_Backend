const db = new (require('../Classes/database'))();

// ---------------- TOGGLE LIKE ----------------
const toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { objectType, objectId } = req.body;

    if (!userId || !objectType || !objectId) {
      return res.status(400).json({ message: 'Missing user, objectType, or objectId' });
    }

    // Check if already liked
    const existing = await db.getQuery(
      `SELECT Liked_Object_ID 
       FROM Liked_Objects 
       WHERE User_ID = ? AND Object_Type = ? AND Object_Reference_ID = ?`,
      [userId, objectType, objectId]
    );

    // -------- UNLIKE --------
    if (existing.length > 0) {
      await db.getQuery(
        `DELETE FROM Liked_Objects 
         WHERE User_ID = ? AND Object_Type = ? AND Object_Reference_ID = ?`,
        [userId, objectType, objectId]
      );

      return res.json({
        liked: false,
        message: 'Object unliked'
      });
    }

    // -------- LIKE --------
    await db.getQuery(
      `INSERT INTO Liked_Objects (User_ID, Object_Type, Object_Reference_ID)
       VALUES (?, ?, ?)`,
      [userId, objectType, objectId]
    );

    return res.json({
      liked: true,
      message: 'Object liked'
    });

  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ message: 'Failed to toggle like' });
  }
};

// ---------------- GET LIKE STATUS ----------------
const getLikeStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, id } = req.query; // type=Star, id=Star_ID

    if (!userId || !type || !id) {
      return res.status(400).json({ message: 'Missing user, type, or id' });
    }

    const existing = await db.getQuery(
      `SELECT Liked_Object_ID 
       FROM Liked_Objects 
       WHERE User_ID = ? AND Object_Type = ? AND Object_Reference_ID = ?`,
      [userId, type, id]
    );

    return res.json({ isLiked: existing.length > 0 });

  } catch (err) {
    console.error('Error getting like status:', err);
    return res.status(500).json({ message: 'Failed to get like status' });
  }
};

module.exports = {
  toggleLike,
  getLikeStatus
};

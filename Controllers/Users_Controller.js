// controllers/userController.js
const db = new (require('../Classes/database'))(); // Adjust path if needed
const bcrypt = require('bcryptjs');

// Helper function to generate a secure random token (e.g., for auth)
const generateToken = () => {
    return require('crypto').randomBytes(64).toString('hex');
};

/**
 * 🛰️ REGISTRATION / SIGNUP HANDLER (POST /api/signup)
 */
exports.signup = async (req, res) => {
    const { User_FN, User_LN, User_Username, User_Email, User_Password } = req.body;

    if (!User_FN || !User_LN || !User_Email || !User_Password) {
        return res.status(400).json({ message: "All required explorer data missing." });
    }

    // --- LOGIC: Calculate final username ---
    const finalUsername = User_Username?.trim() 
        ? User_Username.trim() 
        : `${User_FN.trim()} ${User_LN.trim()}`;

    if (!finalUsername) {
        return res.status(400).json({ message: "Username could not be generated from First Name and Last Name." });
    }
    // ---------------------------------------

    try {
        // 1. Check if user already exists
        const existingUser = await db.getQuery(
            "SELECT * FROM Users WHERE User_Email = ?",
            [User_Email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email already in use. Try logging in." });
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(User_Password, 10); 

        // 3. Insert new user into the database
        const sql = `
            INSERT INTO Users (User_FN, User_LN, User_Name, User_Email, User_Password) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
            User_FN, 
            User_LN, 
            finalUsername, 
            User_Email, 
            hashedPassword
        ];

        // FIX APPLIED: Changed db.runQuery to db.getQuery
        const result = await db.getQuery(sql, params); 

        // For simplicity, we'll use the new ID as the Owner_ID
        const newUserId = result.insertId; 
        
        // Return success
        res.status(201).json({ 
            message: `New explorer "${finalUsername}" successfully registered.`,
            userId: newUserId 
        });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ message: "Hyperspace anomaly during registration. Try again." });
    }
};

/**
 * 👽 LOGIN HANDLER (POST /api/login)
 * (No changes needed here, as it already uses db.getQuery)
 */
exports.login = async (req, res) => {
    const { User_Email, User_Password } = req.body;

    if (!User_Email || !User_Password) {
        return res.status(400).json({ message: "Please provide both email and encryption key." });
    }

    try {
        // 1. Fetch user by email
        const users = await db.getQuery(
            "SELECT * FROM Users WHERE User_Email = ?",
            [User_Email]
        );
        
        const user = users[0];

        // 2. Check if user exists
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 3. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(User_Password, user.User_Password); // 

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 4. Authentication successful: Generate Token and return user details
        const token = generateToken();

        // Return the data your Vue component expects
        res.json({
            message: "Login successful! Welcome aboard, Explorer.",
            token: token,
            user: {
                id: user.User_ID,
                username: user.User_Name, 
                email: user.User_Email,
                ownerId: user.User_ID 
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "The cosmic winds say try again." });
    }
};
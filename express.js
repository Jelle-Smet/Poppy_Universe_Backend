// index.js
const express = require('express');
const cors = require('cors');
// Import bcryptjs here so it's installed (optional, but good practice)
const bcrypt = require('bcryptjs'); // Will be used in userController
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// default route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ⭐ Add your routes here
app.use('/planets', require('./Routes/Planets'));


// 🔑 NEW: User authentication routes
app.use('/api', require('./Routes/Users')); 

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

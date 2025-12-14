// express.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Status route
app.use('/status', require('./Routes/Status'));

// Default route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Planets
app.use('/planets', require('./Routes/Planets'));

// stars
app.use('/api/stars', require('./Routes/Stars'));

// Interactions
app.use('/api/interactions', require('./Routes/Interactions'));

// Likes
app.use('/api/likes', require('./Routes/Like'));


// 🔑 Auth routes
app.use('/api', require('./Routes/Users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

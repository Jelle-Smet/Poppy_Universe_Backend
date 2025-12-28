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

// stars
app.use('/api/stars', require('./Routes/Stars'));

// Interactions
app.use('/api/interactions', require('./Routes/Interactions'));

// Likes
app.use('/api/likes', require('./Routes/Like'));

// Planets
app.use('/api/planets', require('./Routes/Planets'));

// Moons
app.use('/api/moons', require('./Routes/Moons'));

// ML 
app.use('/api/ml', require('./Routes/ML'));

// Engine
app.use('/api/engine', require('./Routes/Engine'));

// Object Scanner
app.use('/api/object_scanner', require('./Routes/Object_Scanner'));

// Object 
app.use('/api/objects', require('./Routes/Object'));

// maintenence
app.use('/api/maintenance', maintenanceRoutes);

// 🔑 Auth routes
app.use('/api', require('./Routes/Users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

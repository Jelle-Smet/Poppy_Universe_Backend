// express.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 🔗 1. IMPORT MAINTENANCE ROUTES
// Ensure this file exists in your Routes folder!
const maintenanceRoutes = require('./Routes/Maintenance');

const app = express();

// 🛠️ 2. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🌍 3. STATUS & DEFAULT ROUTES
app.use('/status', require('./Routes/Status'));

app.get('/', (req, res) => {
    res.send('🌌 Poppy Universe Backend is Online and Soaring!');
});

// 🔭 4. CELESTIAL & ENGINE ROUTES
app.use('/api/stars', require('./Routes/Stars'));
app.use('/api/planets', require('./Routes/Planets'));
app.use('/api/moons', require('./Routes/Moons'));
app.use('/api/objects', require('./Routes/Object'));
app.use('/api/object_scanner', require('./Routes/Object_Scanner'));

// 🧠 5. ENGINE & ML ROUTES
app.use('/api/ml', require('./Routes/ML'));
app.use('/api/engine', require('./Routes/Engine'));

// 👤 6. USER & INTERACTION ROUTES
app.use('/api/interactions', require('./Routes/Interactions'));
app.use('/api/likes', require('./Routes/Like'));
app.use('/api', require('./Routes/Users')); // 🔑 Auth routes

// 💓 7. MAINTENANCE (THE HEARTBEAT)
// This is the endpoint UptimeRobot will hit to keep the universe awake
app.use('/api/maintenance', maintenanceRoutes);

// 🚀 8. RENDER DEPLOYMENT FIX
// We use '0.0.0.0' and process.env.PORT to ensure Render can reach the app
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =============================================
    🚀 POPPY UNIVERSE BACKEND IS LIVE
    📡 Listening on Port: ${PORT}
    🔗 Maintenance: /api/maintenance/heartbeat
    =============================================
    `);
});
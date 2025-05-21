const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { syncModels } = require('./models');
const { initDbFunctions } = require('./db/init-db');
const routes = require('./routes');
require('dotenv').config();

// Express initialization
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Test route
app.get('/', (req, res) => {
    res.send('Time tracking system API is running');
});

// Server startup
const startServer = async () => {
    try {
        // Check database connection
        await testConnection();

        // Sync models with database
        await syncModels();

        // Initialize database functions
        await initDbFunctions();

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 
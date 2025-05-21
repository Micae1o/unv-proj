const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');

/**
 * Initialize database stored functions and triggers
 */
const initDbFunctions = async () => {
    try {
        const functionsFilePath = path.join(__dirname, 'functions.sql');
        const sqlFunctions = fs.readFileSync(functionsFilePath, 'utf8');

        console.log('Initializing database functions...');
        await sequelize.query(sqlFunctions);
        console.log('Database functions successfully initialized');

        return true;
    } catch (error) {
        console.error('Error initializing database functions:', error);
        return false;
    }
};

module.exports = { initDbFunctions }; 
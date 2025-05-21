const express = require('express');
const router = express.Router();
const employeeRoutes = require('./employeeRoutes');
const timeRecordRoutes = require('./timeRecordRoutes');

router.use('/employees', employeeRoutes);
router.use('/time-tracking', timeRecordRoutes);

module.exports = router; 
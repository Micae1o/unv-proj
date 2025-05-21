const express = require('express');
const router = express.Router();
const timeRecordController = require('../controllers/timeRecordController');

router.get('/summary/:year/:month', timeRecordController.getMonthSummary);
router.get('/:year/:month/mode/:mode', timeRecordController.getTimeRecordsWithMode);
router.get('/:year/:month', timeRecordController.getTimeRecordsByMonth);
router.post('/', timeRecordController.updateTimeRecords);

module.exports = router; 
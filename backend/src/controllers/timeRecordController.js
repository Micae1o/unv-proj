const { TimeRecord, Employee } = require('../models');
const { sequelize } = require('../config/db');
const { Op, QueryTypes } = require('sequelize');

// Get time tracking data based on mode (display or edit)
exports.getTimeRecordsWithMode = async (req, res) => {
    try {
        const { year, month, mode } = req.params;

        // Validate parameters
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
            return res.status(400).json({ message: 'Invalid request parameters' });
        }

        if (mode !== 'display' && mode !== 'edit') {
            return res.status(400).json({ message: 'Invalid mode parameter. Must be "display" or "edit"' });
        }

        let employees;
        if (mode === 'display') {
            // Display mode: Get only employees with working hours
            employees = await sequelize.query(
                'SELECT * FROM get_active_employees_with_hours(:year, :month)',
                {
                    replacements: { year: yearNum, month: monthNum },
                    type: QueryTypes.SELECT
                }
            );
        } else {
            // Edit mode: Get all active employees
            employees = await sequelize.query(
                'SELECT * FROM get_active_employees_in_month(:year, :month)',
                {
                    replacements: { year: yearNum, month: monthNum },
                    type: QueryTypes.SELECT
                }
            );
        }

        // Get time records for each employee
        const result = [];
        for (const employee of employees) {
            const timeRecords = await sequelize.query(
                'SELECT * FROM get_employee_hours_in_month(:employeeId, :year, :month)',
                {
                    replacements: { employeeId: employee.id, year: yearNum, month: monthNum },
                    type: QueryTypes.SELECT
                }
            );

            result.push({
                employeeId: employee.id,
                employeeName: employee.name,
                end_date: employee.end_date,
                start_date: employee.start_date,
                totalHours: employee.total_hours || 0,
                workingDays: employee.working_days || 0,
                timeRecords
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error retrieving time tracking data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get time tracking data for a specified month
exports.getTimeRecordsByMonth = async (req, res) => {
    try {
        const { year, month } = req.params;

        // Validate parameters
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
            return res.status(400).json({ message: 'Invalid request parameters' });
        }

        // Get time records for the specified month
        const timeRecords = await sequelize.query(
            `SELECT 
                tr.id, tr.employee_id as "employeeId", e.name as "employeeName", 
                tr.year, tr.month, tr.day, tr.hours
            FROM time_records tr
            JOIN employees e ON tr.employee_id = e.id
            WHERE tr.year = :year AND tr.month = :month`,
            {
                replacements: { year: yearNum, month: monthNum },
                type: QueryTypes.SELECT
            }
        );

        console.log(timeRecords);

        res.status(200).json(timeRecords);
    } catch (error) {
        console.error('Error retrieving time tracking data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get monthly hours summary
exports.getMonthSummary = async (req, res) => {
    try {
        const { year, month } = req.params;

        // Validate parameters
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
            return res.status(400).json({ message: 'Invalid request parameters' });
        }

        // Use stored function to get summary
        const summary = await sequelize.query(
            'SELECT * FROM get_monthly_hours_summary(:year, :month)',
            {
                replacements: { year: yearNum, month: monthNum },
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json(summary);
    } catch (error) {
        console.error('Error retrieving hours summary:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Save/update time tracking records
exports.updateTimeRecords = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const records = req.body;

        if (!Array.isArray(records)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Invalid request data' });
        }

        console.log(`Processing ${records.length} time records`);

        const results = [];
        const errors = [];

        for (const record of records) {
            const { employeeId, year, month, day, hours } = record;

            console.log(`Processing record: employee ${employeeId}, year ${year}, month ${month}, day ${day}, hours ${hours}`);

            try {
                // Check if parameters are valid
                if (!employeeId || employeeId <= 0 ||
                    !year || year < 2000 || year > 2100 ||
                    month === undefined || month < 0 || month > 11 ||
                    !day || day <= 0 || day > 31 ||
                    hours === undefined || hours === null) {

                    const errorMsg = `Invalid parameters: employeeId=${employeeId}, year=${year}, month=${month}, day=${day}, hours=${hours}`;
                    console.error(errorMsg);

                    errors.push({
                        employeeId,
                        year,
                        month,
                        day,
                        hours: hours || 0,
                        status: 'error',
                        message: 'Invalid parameters'
                    });
                    continue;
                }

                // Use stored function to update record
                console.log(`Calling update_time_record(${employeeId}, ${year}, ${month}, ${day}, ${hours || 0})`);

                try {
                    const [result] = await sequelize.query(
                        'SELECT * FROM update_time_record(:employeeId, :year, :month, :day, :hours)',
                        {
                            replacements: {
                                employeeId,
                                year,
                                month,
                                day,
                                hours: hours || 0
                            },
                            type: QueryTypes.SELECT,
                            transaction
                        }
                    );

                    console.log('Result from update_time_record:', result);

                    if (result.success) {
                        results.push({
                            employeeId,
                            year,
                            month,
                            day,
                            hours: hours || 0,
                            status: 'success'
                        });
                    } else {
                        console.error(`Failed to update record for employee ${employeeId}, date ${year}-${month}-${day}: ${result.error_message}`);
                        errors.push({
                            employeeId,
                            year,
                            month,
                            day,
                            hours: hours || 0,
                            status: 'error',
                            message: result.error_message || 'Failed to update record'
                        });
                    }
                } catch (sqlError) {
                    console.error(`SQL Error in update_time_record: ${sqlError.message}`);
                    errors.push({
                        employeeId,
                        year,
                        month,
                        day,
                        hours: hours || 0,
                        status: 'error',
                        message: `SQL Error: ${sqlError.message}`
                    });
                }
            } catch (error) {
                console.error(`Error updating record: ${error.message}`);
                console.error(error.stack);
                errors.push({
                    employeeId,
                    year,
                    month,
                    day,
                    hours: hours || 0,
                    status: 'error',
                    message: error.message
                });
            }
        }

        await transaction.commit();
        console.log(`Processed ${results.length} successful records and ${errors.length} errors`);

        res.status(200).json({
            results,
            errors,
            success: errors.length === 0
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error saving time tracking data:', error);
        console.error(error.stack);
        res.status(500).json({ message: 'Server error' });
    }
}; 
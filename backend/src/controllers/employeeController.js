const { Employee } = require('../models');
const { Op } = require('sequelize');

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            order: [['name', 'ASC']]
        });
        res.status(200).json(employees);
    } catch (error) {
        console.error('Error getting employee list:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByPk(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        console.error('Error getting employee data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new employee
exports.createEmployee = async (req, res) => {
    try {
        const { name, email, startDate, endDate } = req.body;

        // Check required fields
        if (!name || !email || !startDate) {
            return res.status(400).json({ message: 'Not all required fields are filled' });
        }

        // Check email uniqueness
        const existingEmployee = await Employee.findOne({ where: { email } });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee with this email already exists' });
        }

        const newEmployee = await Employee.create({
            name,
            email,
            startDate,
            endDate
        });

        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update employee data
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, startDate, endDate } = req.body;

        const employee = await Employee.findByPk(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // If email changed, check uniqueness
        if (email && email !== employee.email) {
            const existingEmployee = await Employee.findOne({ where: { email } });
            if (existingEmployee) {
                return res.status(400).json({ message: 'Employee with this email already exists' });
            }
        }

        await employee.update({
            name: name || employee.name,
            email: email || employee.email,
            startDate: startDate || employee.startDate,
            endDate: endDate
        });

        res.status(200).json(employee);
    } catch (error) {
        console.error('Error updating employee data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByPk(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await employee.destroy();

        res.status(200).json({ message: 'Employee successfully deleted' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 
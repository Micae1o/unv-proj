const { sequelize } = require('../config/db');
const Employee = require('./Employee');
const TimeRecord = require('./TimeRecord');

Employee.hasMany(TimeRecord, { foreignKey: 'employee_id', as: 'timeRecords' });
TimeRecord.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

const syncModels = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Models synchronized with database.');
    } catch (error) {
        console.error('Error syncing models:', error);
    }
};

module.exports = {
    Employee,
    TimeRecord,
    syncModels
}; 
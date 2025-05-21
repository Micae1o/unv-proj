import React, { useState, useEffect } from 'react';
import { Table, Select, Button, InputNumber, Typography, Switch } from 'antd';
import { getMonthDays, getMonths, isWeekend } from '../utils/dateUtils';
import MonthlySummary from '../components/MonthlySummary';
import useTimeTracking from '../hooks/useTimeTracking';
import useMonthlySummary from '../hooks/useMonthlySummary';
import useTimeTrackingSave from '../hooks/useTimeTrackingSave';
import './TimeTracking.css';

const { Option } = Select;
const { Text } = Typography;

const TimeTracking = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [daysInMonth, setDaysInMonth] = useState([]);
    const [editingCell, setEditingCell] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const { loading, data: employees, timeData, setTimeData, refetch: refetchTimeData } = useTimeTracking(
        selectedYear,
        selectedMonth,
        editMode ? 'edit' : 'display'
    );

    const { loading: summaryLoading, data: summaryData, refetch: refetchSummary } = useMonthlySummary(
        selectedYear,
        selectedMonth
    );

    const { saving: isSaving, saveData } = useTimeTrackingSave();

    useEffect(() => {
        const days = getMonthDays(selectedYear, selectedMonth);
        setDaysInMonth(days);
    }, [selectedYear, selectedMonth]);

    const handleHoursChange = (employeeId, day, value) => {
        setTimeData(prevData => {
            const newData = { ...prevData };

            if (!newData[employeeId]) {
                newData[employeeId] = { employeeId, days: {} };
            }

            newData[employeeId].days[day] = value;
            return newData;
        });
    };

    const startEditing = (employeeId, day) => {
        if (editMode && !isWeekend(selectedYear, selectedMonth, day)) {
            // Find employee by id
            const employee = employees.find(emp => emp.employeeId === employeeId);

            // Check if date is in the future
            const currentDate = new Date();
            const recordDate = new Date(selectedYear, selectedMonth, day);

            if (recordDate > currentDate) {
                // Don't allow editing for future dates
                return;
            }

            // Check if date is before start_date
            if (employee && employee.start_date) {
                const startDate = new Date(employee.start_date);
                startDate.setHours(0, 0, 0, 0);
                if (recordDate < startDate) {
                    // Don't allow editing for dates before employment started
                    return;
                }
            }

            // Check if employee has end_date and if selected date is after end_date
            if (employee && employee.end_date) {
                const endDate = new Date(employee.end_date);

                if (recordDate > endDate) {
                    // Don't allow editing for dates after termination
                    return;
                }
            }

            setEditingCell({ employeeId, day });
        }
    };

    // Helper function to check if a cell is editable
    const isCellEditable = (employee, day) => {
        console.log('employee', employee);
        console.log('day', day);
        if (!editMode || isWeekend(selectedYear, selectedMonth, day)) {
            return false;
        }

        // Check if date is in the future
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
        const recordDate = new Date(selectedYear, selectedMonth, day);

        if (recordDate > currentDate) {
            return false;
        }

        // Check if date is before start_date
        if (employee && employee.start_date) {
            const startDate = new Date(employee.start_date);
            startDate.setHours(0, 0, 0, 0);
            if (recordDate < startDate) {
                return false;
            }
        }

        // Check if date is after end_date
        if (employee && employee.end_date) {
            const endDate = new Date(employee.end_date);
            return recordDate <= endDate;
        }

        return true;
    };

    const stopEditing = () => {
        setEditingCell(null);
    };

    const handleSave = async () => {
        if (!editMode) {
            return;
        }

        const dataToSave = [];

        Object.entries(timeData).forEach(([employeeId, data]) => {
            Object.entries(data.days).forEach(([day, hours]) => {
                if (hours !== undefined && hours !== null) {
                    dataToSave.push({
                        employeeId: parseInt(employeeId),
                        year: selectedYear,
                        month: selectedMonth,
                        day: parseInt(day),
                        hours,
                    });
                }
            });
        });

        await saveData(dataToSave, () => {
            refetchTimeData();
            refetchSummary();
        });
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: 'name',
            key: 'name',
            fixed: 'left',
            width: 150,
        },
        ...daysInMonth.map(({ day, isWeekend: isWeekendDay }) => ({
            title: day,
            dataIndex: ['days', day.toString()],
            key: day.toString(),
            width: 80,
            className: isWeekendDay ? 'weekend-cell' : 'time-cell',
            render: (text, record) => {
                const isEditing = editingCell &&
                    editingCell.employeeId === record.employeeId &&
                    editingCell.day === day;

                const isEditable = isCellEditable(record, day);
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const recordDate = new Date(selectedYear, selectedMonth, day);

                const isBeforeEmployment = record.start_date &&
                    recordDate < new Date(record.start_date);
                const isAfterTermination = record.end_date &&
                    recordDate > new Date(record.end_date);
                const isFutureDate = recordDate > currentDate;

                return isWeekendDay ? (
                    <div className="weekend-day-cell">-</div>
                ) : isFutureDate ? (
                    <div className="future-date-cell" title="Future date">
                        {text !== undefined && text !== null ? (
                            <Text disabled>{text}</Text>
                        ) : (
                            <Text type="secondary" disabled>0</Text>
                        )}
                    </div>
                ) : isBeforeEmployment ? (
                    <div className="before-employment-cell" title="Date before employment started">
                        {text !== undefined && text !== null ? (
                            <Text disabled>{text}</Text>
                        ) : (
                            <Text type="secondary" disabled>0</Text>
                        )}
                    </div>
                ) : isAfterTermination ? (
                    <div className="terminated-day-cell" title="Date after termination">
                        {text !== undefined && text !== null ? (
                            <Text disabled>{text}</Text>
                        ) : (
                            <Text type="secondary" disabled>0</Text>
                        )}
                    </div>
                ) : isEditing ? (
                    <InputNumber
                        min={0}
                        max={12}
                        value={text}
                        onChange={(value) => handleHoursChange(record.employeeId, day, value)}
                        onPressEnter={() => stopEditing()}
                        onBlur={() => stopEditing()}
                        autoFocus
                        className="time-input-editing"
                    />
                ) : (
                    <div
                        className={`time-cell-clickable${!isEditable ? ' read-only' : ''}`}
                        onClick={() => startEditing(record.employeeId, day)}
                    >
                        {text !== undefined && text !== null ? (
                            <Text>{text}</Text>
                        ) : (
                            <Text type="secondary">0</Text>
                        )}
                    </div>
                );
            },
        })),
    ];

    const getYears = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    };

    const handleModeChange = (checked) => {
        setEditMode(checked);
        setEditingCell(null);
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <h2>Time Tracking</h2>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                    <Select
                        style={{ width: 120 }}
                        value={selectedYear}
                        onChange={setSelectedYear}
                    >
                        {getYears().map(year => (
                            <Option key={year} value={year}>{year}</Option>
                        ))}
                    </Select>

                    <Select
                        style={{ width: 120 }}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                    >
                        {getMonths().map(month => (
                            <Option key={month.value} value={month.value}>{month.label}</Option>
                        ))}
                    </Select>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text>{editMode ? 'Edit Mode' : 'Display Mode'}</Text>
                        <Switch
                            checked={editMode}
                            onChange={handleModeChange}
                            checkedChildren="Edit"
                            unCheckedChildren="View"
                        />
                    </div>

                    {editMode && (
                        <Button
                            type="primary"
                            onClick={handleSave}
                            loading={isSaving}
                        >
                            Save
                        </Button>
                    )}
                </div>
            </div>

            <MonthlySummary
                data={summaryData}
                loading={summaryLoading}
            />

            <Table
                columns={columns}
                dataSource={employees}
                rowKey="employeeId"
                loading={loading}
                scroll={{ x: 'max-content' }}
                pagination={false}
                bordered
                size="large"
                style={{ fontSize: '16px' }}
                className={`time-tracking-table ${editMode ? 'edit-mode' : 'display-mode'}`}
                rowClassName={() => 'time-tracking-row'}
            />
        </div>
    );
};

export default TimeTracking; 
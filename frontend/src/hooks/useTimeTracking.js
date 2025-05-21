import { useState, useEffect, useCallback } from 'react';
import { timeTrackingService } from '../services/api';
import { message } from 'antd';

export const useTimeTracking = (year, month, mode) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [timeData, setTimeData] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await timeTrackingService.getByMonthWithMode(year, month, mode);
            const responseData = response.data;

            const formattedData = {};

            responseData.forEach(employee => {
                formattedData[employee.employeeId] = {
                    employeeId: employee.employeeId,
                    name: employee.employeeName,
                    days: {},
                    totalHours: employee.totalHours,
                    workingDays: employee.workingDays,
                    end_date: employee.end_date,
                    start_date: employee.start_date
                };

                if (employee.timeRecords && Array.isArray(employee.timeRecords)) {
                    employee.timeRecords.forEach(record => {
                        formattedData[employee.employeeId].days[record.day] = record.hours;
                    });
                }
            });

            setData(Object.values(formattedData));
            setTimeData(formattedData);
        } catch (error) {
            message.error('Failed to load time tracking data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [year, month, mode]);

    useEffect(() => {
        if (year !== undefined && month !== undefined) {
            fetchData();
        }
    }, [year, month, mode, fetchData]);

    return {
        loading,
        data,
        timeData,
        setTimeData,
        refetch: fetchData
    };
};

export default useTimeTracking; 
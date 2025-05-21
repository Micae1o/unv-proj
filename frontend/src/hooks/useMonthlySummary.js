import { useState, useEffect, useCallback } from 'react';
import { timeTrackingService } from '../services/api';
import { message } from 'antd';

export const useMonthlySummary = (year, month) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await timeTrackingService.getMonthlySummary(year, month);
            setData(response.data);
        } catch (error) {
            console.error('Error loading summary:', error);
            message.error('Failed to load monthly summary');
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        if (year !== undefined && month !== undefined) {
            fetchData();
        }
    }, [year, month, fetchData]);

    return {
        loading,
        data,
        refetch: fetchData
    };
};

export default useMonthlySummary; 
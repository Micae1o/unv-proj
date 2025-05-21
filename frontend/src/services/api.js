import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const employeeService = {
    getAll: () => api.get('/employees'),
    getActive: () => api.get('/employees/active'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
};

export const timeTrackingService = {
    getByMonth: (year, month) => api.get(`/time-tracking/${year}/${month}`),
    getByMonthWithMode: (year, month, mode) => api.get(`/time-tracking/${year}/${month}/mode/${mode}`),
    getMonthlySummary: (year, month) => api.get(`/time-tracking/summary/${year}/${month}`),
    update: (data) => api.post('/time-tracking', data),
};

export default api; 
import { useState } from 'react';
import { timeTrackingService } from '../services/api';
import { message } from 'antd';

export const useTimeTrackingSave = () => {
    const [loading, setLoading] = useState(false);

    const saveData = async (dataToSave, onSuccess) => {
        setLoading(true);
        try {
            const response = await timeTrackingService.update(dataToSave);

            if (response.data.success) {
                message.success('Data saved successfully');
                if (onSuccess) onSuccess();
                return true;
            } else {
                if (response.data.errors && response.data.errors.length > 0) {
                    message.warning(`Saved with errors: ${response.data.errors.length} records not processed`);
                }
                return false;
            }
        } catch (error) {
            message.error('Failed to save data');
            console.error(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        saving: loading,
        saveData
    };
};

export default useTimeTrackingSave; 
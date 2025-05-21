import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleMenuClick = (e) => {
        navigate(e.key);
    };

    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/' || path === '/employees') {
            return ['employees'];
        }
        if (path === '/time-tracking') {
            return ['time-tracking'];
        }
        return [];
    };

    return (
        <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
            <div className="logo" style={{ float: 'left', color: 'white', fontSize: '18px', marginRight: '24px' }}>
                System of time tracking
            </div>
            <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={getSelectedKey()}
                onClick={handleMenuClick}
                items={[
                    {
                        key: 'employees',
                        label: 'Employees'
                    },
                    {
                        key: 'time-tracking',
                        label: 'Time tracking'
                    }
                ]}
            />
        </Header>
    );
};

export default AppHeader; 
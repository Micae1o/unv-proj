import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import './App.css';

import Employees from './pages/Employees';
import TimeTracking from './pages/TimeTracking';

import AppHeader from './components/AppHeader';

const { Content } = Layout;

function App() {
    return (
        <Router>
            <Layout className="layout" style={{ minHeight: '100vh' }}>
                <AppHeader />
                <Content style={{ padding: '0 50px', marginTop: 114 }}>
                    <div className="site-layout-content" style={{ padding: 24, minHeight: 380 }}>
                        <Routes>
                            <Route path="/" element={<Employees />} />
                            <Route path="/employees" element={<Employees />} />
                            <Route path="/time-tracking" element={<TimeTracking />} />
                        </Routes>
                    </div>
                </Content>
            </Layout>
        </Router>
    );
}

export default App;

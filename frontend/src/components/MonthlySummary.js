import React from 'react';
import { Table, Card, Spin } from 'antd';

const MonthlySummary = ({ data, loading }) => {
    const columns = [
        {
            title: 'Employee',
            dataIndex: 'employee_name',
            key: 'employee_name',
        },
        {
            title: 'Working Days',
            dataIndex: 'working_days',
            key: 'working_days',
            align: 'center',
        },
        {
            title: 'Total Hours',
            dataIndex: 'total_hours',
            key: 'total_hours',
            align: 'center',
        },
        {
            title: 'Average Hours per Day',
            key: 'average',
            align: 'center',
            render: (_, record) =>
                record.working_days > 0
                    ? (record.total_hours / record.working_days).toFixed(1)
                    : '-'
        }
    ];

    return (
        <Card title="Monthly Summary" style={{ marginBottom: 20 }}>
            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="employee_id"
                    pagination={false}
                    bordered
                    summary={pageData => {
                        if (pageData.length === 0) return null;

                        const totalHours = pageData.reduce((total, current) => total + +current.total_hours, 0);
                        const totalDays = pageData.reduce((total, current) => total + +current.working_days, 0);

                        return (
                            <>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={1}>
                                        <strong>Total</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="center">
                                        <strong>{totalDays}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="center">
                                        <strong>{totalHours}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3} align="center">
                                        <strong>
                                            {totalDays > 0 ? (totalHours / totalDays).toFixed(1) : '-'}
                                        </strong>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            </>
                        );
                    }}
                />
            </Spin>
        </Card>
    );
};

export default MonthlySummary; 
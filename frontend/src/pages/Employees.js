import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { employeeService } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import dayjs from 'dayjs';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingEmployee, setEditingEmployee] = useState(null);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await employeeService.getAll();
            setEmployees(response.data);
        } catch (error) {
            message.error('An error occurred while loading the list of employees');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const showModal = (employee = null) => {
        setEditingEmployee(employee);
        form.resetFields();

        if (employee) {
            form.setFieldsValue({
                ...employee,
                startDate: employee.startDate ? dayjs(employee.startDate, 'YYYY-MM-DD') : null,
                endDate: employee.endDate ? dayjs(employee.endDate, 'YYYY-MM-DD') : null,
            });
        }

        setModalVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            const formattedData = {
                ...values,
                startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
                endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
            };

            if (editingEmployee) {
                await employeeService.update(editingEmployee.id, formattedData);
                message.success('Employee updated successfully');
            } else {
                await employeeService.create(formattedData);
                message.success('Employee added successfully');
            }

            setModalVisible(false);
            fetchEmployees();
        } catch (error) {
            message.error('An error occurred while saving data');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await employeeService.delete(id);
            message.success('Employee deleted successfully');
            fetchEmployees();
        } catch (error) {
            message.error('An error occurred while deleting the employee');
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Start date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (text) => text ? formatDate(new Date(text)) : '-',
        },
        {
            title: 'End date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (text) => text ? formatDate(new Date(text)) : '-',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this employee?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>Employees</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showModal()}
                >
                    Add employee
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={employees}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title={editingEmployee ? 'Edit employee' : 'Add employee'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter the employee name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please enter the email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="startDate"
                        label="Start date"
                        rules={[{ required: true, message: 'Please select the start date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="endDate"
                        label="End date"
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingEmployee ? 'Save' : 'Add'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Employees; 
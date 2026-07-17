import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { ArrowUpOutlined, MoneyCollectOutlined, FireOutlined } from '@ant-design/icons';

export default function Dashboard() {
    const [overview, setOverview] = useState<any>({});
    const [ranking, setRanking] = useState<any[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem('coolmall_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        fetch('/api/dashboard/overview', { headers: { 'x-role': user.role, 'x-user-id': user.userId.toString() } })
            .then(res => res.json()).then(res => setOverview(res.data || {}));

        fetch('/api/dashboard/sales-ranking', { headers: { 'x-role': user.role, 'x-user-id': user.userId.toString() } })
            .then(res => res.json()).then(res => setRanking(res.data || []));
    }, []);

    const columns = [
        { title: '资产编号', dataIndex: 'id', key: 'id' },
        { title: 'H5 模板名称', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text}</strong> },
        { title: '总销量', dataIndex: 'sales', key: 'sales', render: (val: number) => <Tag color="blue">{val} 笔</Tag> },
        { title: '净利润 (RMB)', dataIndex: 'revenue', key: 'revenue', render: (val: number) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{val.toFixed(2)}</span> },
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', minHeight: '80vh' }}>
            <h2 style={{ marginBottom: 24, fontSize: '20px', fontWeight: 'bold' }}>商业资产大盘</h2>
            <Row gutter={16}>
                <Col span={8}>
                    <Card hoverable style={{ borderTop: '4px solid #cf1322' }}>
                        <Statistic title="累计真实流水收益" value={overview.totalRevenue || 0} precision={2} valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} prefix={<MoneyCollectOutlined />} suffix="元" />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card hoverable style={{ borderTop: '4px solid #3f8600' }}>
                        <Statistic title="订单总量" value={overview.monthlySales || 0} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} prefix={<ArrowUpOutlined />} suffix="单" />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
                        <Statistic title="云端托管工程数" value={overview.workCount || 0} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} prefix={<FireOutlined />} suffix="个" />
                    </Card>
                </Col>
            </Row>
            <h3 style={{ marginTop: 40, marginBottom: 20, fontSize: '18px', fontWeight: 'bold' }}>高转化模板排行 Top Sales</h3>
            <Table dataSource={ranking} columns={columns} pagination={false} rowKey="id" bordered />
        </div>
    );
}
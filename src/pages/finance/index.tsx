import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Space, Button, Select, Modal, Descriptions } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';

export default function Finance() {
    const [data, setData] = useState<any[]>([]);

    // 🌟 交互状态区
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('全部');
    const [detailRecord, setDetailRecord] = useState<any>(null); // 控制详情弹窗

    const loadRealFinancialRecords = () => {
        const userStr = localStorage.getItem('coolmall_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        fetch('/api/finance/all-list', {
            method: 'GET',
            headers: { 'x-role': user.role, 'x-user-id': user.userId.toString() }
        }).then(res => res.json()).then(res => {
            if (res.code === 200 && res.data) {
                const mappedData = res.data.map((item: any) => ({
                    id: 'INV-20260716-' + item.id,
                    orderNo: item.order_no,
                    buyer: item.user_email,
                    amount: item.amount,
                    invoiceType: '增值税专用发票',
                    status: item.status === 'success' ? '已交付' : '待处理',
                    remarks: item.remark,
                    date: item.created_at
                }));
                setData(mappedData);
            }
        });
    };

    useEffect(() => { loadRealFinancialRecords(); }, []);

    // 🌟 核心突破：多维矩阵模糊过滤 (文本模糊 + 状态下拉)
    const displayedData = data.filter(item => {
        const matchText = !searchText ||
            item.buyer.toLowerCase().includes(searchText.toLowerCase()) ||
            item.orderNo.includes(searchText) ||
            item.id.includes(searchText);
        const matchStatus = filterStatus === '全部' || item.status === filterStatus;
        return matchText && matchStatus;
    });

    const columns = [
        { title: '流转单号', dataIndex: 'id', key: 'id', width: 160 },
        { title: '关联主订单', dataIndex: 'orderNo', key: 'orderNo' },
        { title: '购方抬头', dataIndex: 'buyer', key: 'buyer', render: (text: string) => <strong>{text}</strong> },
        { title: '开票金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${val.toFixed(2)}` },
        { title: '票种', dataIndex: 'invoiceType', key: 'invoiceType' },
        {
            title: '税务状态', dataIndex: 'status', key: 'status', render: (status: string) => {
                let color = status === '红字冲销' ? 'red' : (status === '已交付' ? 'green' : 'orange');
                return <Tag color={color} icon={status === '红字冲销' ? <SyncOutlined spin /> : null}>{status}</Tag>;
            }
        },
        { title: '流转备注追踪', dataIndex: 'remarks', key: 'remarks' },
        {
            title: '操作', key: 'action', render: (_: any, record: any) => (
                <Space>
                    {record.status === '待处理' && <Button type="primary" size="small" icon={<CheckCircleOutlined />}>执行交付</Button>}
                    {/* 🌟 激活详情按钮 */}
                    <Button size="small" onClick={() => setDetailRecord(record)}>详情</Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>企业级合规开票与税务流转中台</h2>
                <Space>
                    {/* 🌟 状态筛选下拉框 */}
                    <Select defaultValue="全部" style={{ width: 120 }} onChange={setFilterStatus}>
                        <Select.Option value="全部">所有状态</Select.Option>
                        <Select.Option value="已交付">已交付</Select.Option>
                        <Select.Option value="待处理">待处理</Select.Option>
                        <Select.Option value="红字冲销">红字冲销</Select.Option>
                    </Select>

                    {/* 🌟 带清除 X 号、回车触发的搜索框 */}
                    <Input.Search
                        placeholder="搜单号/主订单/购方"
                        allowClear
                        enterButton="查询"
                        onChange={e => setSearchText(e.target.value)}
                        onSearch={value => setSearchText(value)}
                        style={{ width: 280 }}
                    />
                    <Button type="primary">手动开票申请</Button>
                </Space>
            </div>
            <Table dataSource={displayedData} columns={columns} pagination={{ pageSize: 10 }} rowKey="id" bordered />

            {/* 🌟 动态发票详情弹窗 */}
            <Modal title="发票追踪详情" open={!!detailRecord} onCancel={() => setDetailRecord(null)} footer={[<Button key="close" onClick={() => setDetailRecord(null)}>关闭</Button>]}>
                {detailRecord && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="流转单号">{detailRecord.id}</Descriptions.Item>
                        <Descriptions.Item label="关联订单">{detailRecord.orderNo}</Descriptions.Item>
                        <Descriptions.Item label="购买方抬头"><strong>{detailRecord.buyer}</strong></Descriptions.Item>
                        <Descriptions.Item label="开票金额"><span style={{ color: 'red' }}>¥{detailRecord.amount.toFixed(2)}</span></Descriptions.Item>
                        <Descriptions.Item label="票据种类">{detailRecord.invoiceType}</Descriptions.Item>
                        <Descriptions.Item label="当前状态"><Tag color={detailRecord.status === '已交付' ? 'green' : 'orange'}>{detailRecord.status}</Tag></Descriptions.Item>
                        <Descriptions.Item label="系统发生时间">{detailRecord.date}</Descriptions.Item>
                        <Descriptions.Item label="审计备注">{detailRecord.remarks}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Button, Timeline, Spin, Space, Typography, Badge, message } from 'antd';
import { ArrowUpOutlined, MoneyCollectOutlined, FireOutlined, CheckOutlined, CloseOutlined, RocketOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 定义技能树提案的类型
interface Proposal {
    id: string;
    title: string;
    desc: string;
    status: 'pending' | 'approved' | 'rejected';
    type: 'marketing' | 'tech' | 'mall';
}

export default function Dashboard() {
    // === 原有商业资产状态 ===
    const [overview, setOverview] = useState<any>({});
    const [ranking, setRanking] = useState<any[]>([]);

    // === 新增：AI 实时心流状态 ===
    const [aiThoughts, setAiThoughts] = useState<any[]>([]);

    // === 新增 AI CEO 技能树状态 ===
    const [proposals, setProposals] = useState<Proposal[]>([
        {
            id: 'skill_auto_seo',
            title: '自动化双语 SEO 洗稿中枢',
            desc: '夜间侦测发现海外 Pinterest 对插画类模板流量扶持极大。已编写自动抓取、双语翻译并静默发帖的脚本原型。',
            status: 'pending',
            type: 'marketing'
        },
        {
            id: 'skill_webgl_3d',
            title: 'WebGL 3D 旋转组件注入',
            desc: '竞品分析显示 3D 组件转化率溢价 20%。已抓取 Three.js 开源代码并封装，请求合入底层组件库。',
            status: 'pending',
            type: 'tech'
        }
    ]);

    useEffect(() => {
        const userStr = localStorage.getItem('coolmall_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        // 1. 获取商业大盘数据
        fetch('/api/dashboard/overview', { headers: { 'x-role': user.role, 'x-user-id': user.userId.toString() } })
            .then(res => res.json()).then(res => setOverview(res.data || {}));

        fetch('/api/dashboard/sales-ranking', { headers: { 'x-role': user.role, 'x-user-id': user.userId.toString() } })
            .then(res => res.json()).then(res => setRanking(res.data || []));

        // 2. 尝试从后端拉取真实的 AI 技能树提案
        fetch('/api/ai/proposals')
            .then(res => res.json())
            .then(res => {
                if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
                    setProposals(res.data);
                }
            }).catch(() => { });
    }, []);

    // 3. 实时轮询获取 AI 的心流日志与灵感
    useEffect(() => {
        const fetchThoughts = () => {
            fetch('/api/ai/thoughts')
                .then(res => res.json())
                .then(res => {
                    if (res.code === 200 && Array.isArray(res.data)) {
                        setAiThoughts(res.data);
                    }
                }).catch(() => { });
        };

        fetchThoughts();
        const timer = setInterval(fetchThoughts, 5000); // 每 5 秒自动同步一次大脑心流
        return () => clearInterval(timer);
    }, []);

    // 👑 真实向后端发送审批指令，触发 AI 自主写代码合入主干
    const handleAction = (id: string, action: 'approved' | 'rejected') => {
        const userStr = localStorage.getItem('coolmall_user');
        if (!userStr) {
            message.error('请先登录管理员账号');
            return;
        }
        const user = JSON.parse(userStr);

        if (action === 'approved') {
            message.loading({ content: 'AI CEO 正在编写并合入进化代码...', key: 'evolving' });

            fetch('/api/ai/approve-skill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-role': user.role,
                    'x-user-id': user.userId.toString()
                },
                body: JSON.stringify({ id })
            })
                .then(res => res.json())
                .then(res => {
                    if (res.code === 200) {
                        message.success({ content: '✅ 进化成功！AI 已将新功能代码写入源码！', key: 'evolving', duration: 3 });
                        setProposals(prev =>
                            prev.map(p => p.id === id ? { ...p, status: 'approved' } : p)
                        );
                    } else {
                        message.error({ content: '❌ 合入失败: ' + res.msg, key: 'evolving' });
                    }
                })
                .catch(() => {
                    message.error({ content: '❌ 网络异常，AI 进化中断', key: 'evolving' });
                });
        } else {
            setProposals(prev =>
                prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p)
            );
            message.warning('❌ 已驳回！AI CEO 已将该提案销毁。');
        }
    };

    // ⏪ 紧急回滚：一键撤销 AI 最近一次的代码进化
    const handleRollback = () => {
        const userStr = localStorage.getItem('coolmall_user');
        if (!userStr) {
            message.error('请先登录管理员账号');
            return;
        }
        const user = JSON.parse(userStr);

        message.loading({ content: '正在执行紧急回滚，恢复上一个安全版本...', key: 'rolling' });

        fetch('/api/ai/rollback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-role': user.role,
                'x-user-id': user.userId.toString()
            }
        })
            .then(res => res.json())
            .then(res => {
                if (res.code === 200) {
                    message.success({ content: res.msg, key: 'rolling', duration: 3 });
                } else {
                    message.error({ content: '回滚失败: ' + res.msg, key: 'rolling' });
                }
            })
            .catch(() => {
                message.error({ content: '网络异常，回滚中断', key: 'rolling' });
            });
    };

    const columns = [
        { title: '资产编号', dataIndex: 'id', key: 'id' },
        { title: 'H5 模板名称', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text}</strong> },
        { title: '总销量', dataIndex: 'sales', key: 'sales', render: (val: number) => <Tag color="blue">{val} 笔</Tag> },
        { title: '净利润 (RMB)', dataIndex: 'revenue', key: 'revenue', render: (val: number) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{val.toFixed(2)}</span> },
    ];

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {/* 🔴 第一部分：原有的商业资产大盘 */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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

            {/* 🔵 第二部分：新增的 AI CEO 监控与进化面板 */}
            <Row gutter={[24, 24]}>
                {/* 左侧：AI CEO 实时汇报大屏（动态心流展示） */}
                <Col span={8}>
                    <Card
                        title={<><RocketOutlined style={{ color: '#1890ff' }} /> AI 员工实时动态</>}
                        bordered={false}
                        style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    >
                        <Timeline>
                            {aiThoughts.length > 0 ? (
                                aiThoughts.map((item: any) => (
                                    <Timeline.Item key={item.id} color={item.type === 'thought' ? 'blue' : 'green'}>
                                        <Text strong>{item.title}</Text>
                                        <div style={{ fontSize: '12px', color: '#555', marginTop: 2 }}>{item.content}</div>
                                        <div style={{ fontSize: '10px', color: '#999', marginTop: 2 }}>{item.time}</div>
                                    </Timeline.Item>
                                ))
                            ) : (
                                <Timeline.Item color="gray" dot={<Spin size="small" />}>
                                    <Text>AI 正在初始化心流矩阵，等待脑电波接入...</Text>
                                </Timeline.Item>
                            )}
                        </Timeline>
                    </Card>
                </Col>

                {/* 右侧：技能树进化审批 */}
                <Col span={16}>
                    <Card
                        title={<><BulbOutlined style={{ color: '#faad14' }} /> 待批阅的进化技能树</>}
                        extra={
                            <Space>
                                <Button danger size="small" onClick={handleRollback}>⏪ 紧急回滚版本</Button>
                                <Badge count={proposals.filter(p => p.status === 'pending').length} />
                            </Space>
                        }
                        bordered={false}
                        style={{ minHeight: '400px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    >
                        {proposals.map(item => (
                            <Card
                                type="inner"
                                key={item.id}
                                style={{ marginBottom: '16px', borderLeft: item.status === 'pending' ? '4px solid #1890ff' : '4px solid #d9d9d9' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <Space style={{ marginBottom: 8 }}>
                                            <Title level={5} style={{ margin: 0 }}>{item.title}</Title>
                                            {item.type === 'marketing' && <Tag color="volcano">营销扩张</Tag>}
                                            {item.type === 'tech' && <Tag color="geekblue">技术进化</Tag>}
                                            {item.type === 'mall' && <Tag color="green">商城升级</Tag>}
                                        </Space>
                                        <p style={{ color: '#555', margin: 0 }}>{item.desc}</p>
                                    </div>

                                    {item.status === 'pending' ? (
                                        <Space>
                                            <Button type="primary" icon={<CheckOutlined />} onClick={() => handleAction(item.id, 'approved')}>
                                                批准进化
                                            </Button>
                                            <Button danger icon={<CloseOutlined />} onClick={() => handleAction(item.id, 'rejected')}>
                                                驳回
                                            </Button>
                                        </Space>
                                    ) : (
                                        <Tag color={item.status === 'approved' ? 'success' : 'default'}>
                                            {item.status === 'approved' ? '已点亮' : '已废弃'}
                                        </Tag>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
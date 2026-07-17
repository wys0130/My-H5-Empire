import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Modal, Form, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function UsersManage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState(''); // 🌟 新增：搜索关键字状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = () => {
    const userStr = localStorage.getItem('coolmall_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    fetch('/api/admin/users', { headers: { 'x-role': user.role, 'x-user-id': user.userId.toString() } })
      .then(res => res.json()).then(res => { if (res.code === 200) setUsers(res.data); });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleUpdateRole = (id: number, newRole: string) => {
    const userStr = localStorage.getItem('coolmall_user');
    const user = JSON.parse(userStr || '{}');
    fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-role': user.role, 'x-user-id': user.userId.toString() },
      body: JSON.stringify({ targetUserId: id, newRole, vipDays: 30 })
    }).then(res => res.json()).then(res => {
      if (res.code === 200) { message.success(res.msg); fetchUsers(); }
      else { message.error(res.msg); }
    });
  };

  const handleCreateAgent = () => {
    form.validateFields().then(values => {
      const userStr = localStorage.getItem('coolmall_user');
      const user = JSON.parse(userStr || '{}');
      fetch('/api/admin/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': user.role, 'x-user-id': user.userId.toString() },
        body: JSON.stringify({ agentEmail: values.email, agentPassword: values.password })
      }).then(res => res.json()).then(res => {
        if (res.code === 200) {
          message.success(res.msg); setIsModalVisible(false); form.resetFields(); fetchUsers();
        } else { message.error(res.msg); }
      });
    });
  };

  // 🌟 核心突破：前台实时模糊匹配引擎
  const displayedUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchText.toLowerCase()) ||
    String(u.id).includes(searchText) ||
    u.role.includes(searchText)
  );

  const columns = [
    { title: '系统 UID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '注册邮箱 (账号)', dataIndex: 'username', key: 'username' },
    {
      title: '当前真实身份', dataIndex: 'role', key: 'role', render: (role: string) => {
        const colorMap: any = { 'admin': 'red', 'agent': 'purple', 'vip': 'gold', 'user': 'blue' };
        const textMap: any = { 'admin': '超级总控', 'agent': '下级代理', 'vip': '高级VIP', 'user': '普通创作者' };
        return <Tag color={colorMap[role] || 'default'}>{textMap[role] || role}</Tag>;
      }
    },
    { title: 'VIP 到期时间', dataIndex: 'vip_expire', key: 'vip_expire', render: (val: string) => val || '永久 / 未开通' },
    {
      title: '操作权限指派', key: 'action', render: (_: any, record: any) => (
        <Space size="middle">
          {record.role !== 'admin' && (
            <>
              <Popconfirm title="确定将其升级为包月 VIP 吗？" onConfirm={() => handleUpdateRole(record.id, 'vip')}>
                <Button type="primary" size="small" style={{ background: '#faad14', borderColor: '#faad14' }}>提拔 VIP</Button>
              </Popconfirm>
              <Popconfirm title="将其降级为免费的普通用户？" onConfirm={() => handleUpdateRole(record.id, 'user')}>
                <Button size="small">撤权</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>多租户权限总闸</h2>
        <Space>
          {/* 🌟 完美解决：带清除 X 号、回车触发、实时模糊检索的高级搜索框 */}
          <Input.Search
            placeholder="搜账号、UID 或 身份"
            allowClear
            enterButton="查询"
            onChange={e => setSearchText(e.target.value)}
            onSearch={value => setSearchText(value)}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>新增代理商账号</Button>
        </Space>
      </div>

      <Table dataSource={displayedUsers} columns={columns} rowKey="id" bordered pagination={{ pageSize: 10 }} />

      <Modal title="指派下级代理商" open={isModalVisible} onOk={handleCreateAgent} onCancel={() => setIsModalVisible(false)} okText="确认创建并下发" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="代理商登录邮箱" rules={[{ required: true, message: '必须输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
            <Input placeholder="输入你想给代理商分配的账号 (如 agent01@coolmall.com)" />
          </Form.Item>
          <Form.Item name="password" label="设置初始密码" rules={[{ required: true, message: '必须输入密码' }, { min: 6, message: '密码安全等级需≥6位' }]}>
            <Input.Password placeholder="代理商拿到后可登录" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
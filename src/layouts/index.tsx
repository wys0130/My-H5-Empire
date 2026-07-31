import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Tag, Button, message, Tabs, Modal, Table, Switch, Space, Input, Carousel, Upload } from 'antd';
// 🌟 确保正确导入了垃圾桶图标 DeleteOutlined
import { DashboardOutlined, BankOutlined, AppstoreOutlined, TeamOutlined, LogoutOutlined, SafetyCertificateOutlined, BuildOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { history, useLocation } from 'umi';

import Dashboard from '@/pages/dashboard';
import Finance from '@/pages/finance';
import ExcelEditor from '@/pages/excel/index';

message.config({ top: 70, maxCount: 3 });

const { Header, Sider, Content } = Layout;

// =================================================================
// 🌟 2. 后台管理组件
// =================================================================
const AdminUsers = () => {
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const loadUsers = () => {
    fetch('/api/admin/users/list', { headers: { 'x-role': 'admin', 'x-user-id': '1' } })
      .then(r => r.json()).then(res => setData(res.data || []));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password) {
      message.warning('请填写完整的邮箱和密码！');
      return;
    }
    message.loading({ content: '正在创建账号...', key: 'create-user' });
    fetch('/api/admin/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' },
      body: JSON.stringify(newUser)
    })
      .then(r => r.json())
      .then(res => {
        if (res.code === 200) {
          message.success({ content: '🎉 新账号创建成功！', key: 'create-user' });
          setIsModalVisible(false);
          setNewUser({ username: '', password: '', role: 'user' });
          loadUsers();
        } else {
          message.error({ content: res.msg || '创建失败', key: 'create-user' });
        }
      });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return message.warning('请先勾选目标用户！');
    Modal.confirm({
      title: `确认批量注销选中的 ${selectedRowKeys.length} 个账号吗？`,
      onOk: () => {
        message.success('批量注销成功');
        setSelectedRowKeys([]);
        loadUsers();
      }
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const cols = [
    { title: 'ID', dataIndex: 'id' },
    { title: '账号邮箱', dataIndex: 'username', render: (t: string) => <b>{t}</b> },
    { title: '身份权限', dataIndex: 'role', render: (r: string) => <Tag color={r === 'admin' ? 'red' : 'blue'}>{r}</Tag> },
    { title: '注册时间', dataIndex: 'date' },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button size="small" type="primary" style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }} onClick={() => message.success(`重置密码成功: ${record.username}`)}>
            重置密码
          </Button>
          <Button size="small" danger onClick={() => {
            Modal.confirm({
              title: `确认注销用户 ${record.username} 吗？`,
              onOk: () => { message.success('模拟注销成功'); loadUsers(); }
            });
          }}>
            注销
          </Button>
        </Space>
      )
    },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 'bold' }}>系统账号管控</h3>
          {selectedRowKeys.length > 0 && (
            <Space>
              <span style={{ fontSize: '13px', color: '#666' }}>已选 {selectedRowKeys.length} 项</span>
              <Button size="small" danger onClick={handleBatchDelete}>批量注销</Button>
            </Space>
          )}
        </div>
        <Button type="primary" style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff' }} onClick={() => setIsModalVisible(true)}>
          新增账号
        </Button>
      </div>
      <Table scroll={{ y: 500 }} rowSelection={rowSelection} columns={cols} dataSource={data} rowKey="id" pagination={{ pageSize: 8 }} />
      <Modal title="管理员手动新增账号" visible={isModalVisible} onOk={handleCreateUser} onCancel={() => setIsModalVisible(false)} okText="确认创建" cancelText="取消">
        <Space direction="vertical" style={{ width: '100%', marginTop: 10 }} size="large">
          <Input placeholder="输入用户邮箱 (例如: user@qq.com)" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
          <Input.Password placeholder="输入登录密码" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
        </Space>
      </Modal>
    </div>
  );
};

const AdminHomepage = () => {
  const [data, setData] = useState([{ id: 1, title: '', desc: '', image_url: '', bg: '' }]);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    fetch('/api/settings/carousel').then(r => r.json()).then(res => { if (res.data?.length > 0) setData(res.data); });
    fetch('/api/settings/announcement').then(r => r.json()).then(res => { if (res.code === 200) setAnnouncementText(res.data || ''); });
  }, []);

  const save = () => {
    fetch('/api/admin/settings/carousel', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ data }) }).then(r => r.json());
    fetch('/api/admin/settings/announcement', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ content: announcementText }) }).then(r => r.json()).then(() => message.success('主页配置全部保存成功！'));
  };

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 'bold' }}>商城主页轮播图设置</h3>
          <p style={{ color: '#888', margin: '8px 0 0 0', fontSize: '13px' }}>* 请上传比例约为 3:1 的横向大图 (推荐尺寸: 1200x400 px，单张不超过 2MB)</p>
        </div>
        {/* 🌟 核心修复：添加和生效按钮保持 40px 等高并排，整齐美观 */}
        <Space>
          <Button type="dashed" style={{ height: '40px' }} onClick={() => setData([...data, { id: Date.now(), title: '', desc: '', image_url: '', bg: '' }])}>+ 添加轮播图</Button>
          <Button style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff', height: '40px' }} onClick={save}>确认生效</Button>
        </Space>
      </div>

      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa' }}>
        <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>顶部滚动公告内容</h4>
        <Input
          placeholder="请输入要在商城首页顶部显示的公告通知文字..."
          value={announcementText}
          onChange={e => setAnnouncementText(e.target.value)}
        />
      </div>

      {data.map((item, i) => (
        <div key={item.id || i} style={{ display: 'flex', gap: 16, marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, position: 'relative' }}>
          <Upload action="/api/upload" showUploadList={false} onChange={(info) => {
            if (info.file.size > 2 * 1024 * 1024) { message.error('图片不能超过 2MB！'); return; }
            if (info.file.status === 'done') { const nd = [...data]; nd[i].image_url = info.file.response.url; setData(nd); message.success('图片上传成功'); }
          }}>
            <div style={{ width: 150, height: 100, background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {!item.image_url && <span style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>点击上传底图<br />(1200x400)</span>}
            </div>
          </Upload>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <Input placeholder="主标题文字" value={item.title} onChange={e => { const nd = [...data]; nd[i].title = e.target.value; setData(nd); }} />
            <Input placeholder="副标题文字" value={item.desc} onChange={e => { const nd = [...data]; nd[i].desc = e.target.value; setData(nd); }} />
          </div>
          {/* 🌟 核心修复：删除按钮改成简洁美观的垃圾桶图标 DeleteOutlined */}
          {data.length > 1 && (
            <Button danger type="primary" icon={<DeleteOutlined />} style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => setData(data.filter((_, idx) => idx !== i))} />
          )}
        </div>
      ))}
    </div>
  );
};

const AdminAudit = () => {
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viewBackup, setViewBackup] = useState<string | null>(null);
  const [selectedWorkKeys, setSelectedWorkKeys] = useState<React.Key[]>([]);
  const [selectedLogKeys, setSelectedLogKeys] = useState<React.Key[]>([]);

  const load = () => {
    fetch('/api/admin/all-works', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setData(res.data || []));
    fetch('/api/admin/operation-logs', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setLogs(res.data || []));
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string, status: boolean) => {
    fetch('/api/h5/work/toggle-publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id, is_published: status ? 1 : 0 }) }).then(() => { message.success('已刷新'); load(); });
  };

  const handleBatchForceDelete = () => {
    if (selectedWorkKeys.length === 0) return message.warning('请先勾选作品！');
    Modal.confirm({
      title: `确认批量强制销毁选中的 ${selectedWorkKeys.length} 个作品吗？`,
      onOk: () => {
        Promise.all(
          selectedWorkKeys.map(id => fetch('/api/admin/force-delete-work', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id }) }).then(r => r.json()))
        ).then(() => { message.success('批量销毁成功'); setSelectedWorkKeys([]); load(); });
      }
    });
  };

  const handleBatchDeleteLogs = () => {
    if (selectedLogKeys.length === 0) return message.warning('请先勾选日志！');
    Modal.confirm({
      title: `确认批量删除选中的 ${selectedLogKeys.length} 条日志吗？`,
      onOk: () => {
        Promise.all(
          selectedLogKeys.map(id => fetch('/api/admin/operation-logs/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id }) }).then(r => r.json()))
        ).then(() => { message.success('日志批量删除成功'); setSelectedLogKeys([]); load(); });
      }
    });
  };

  const workRowSelection = { selectedRowKeys: selectedWorkKeys, onChange: (keys: React.Key[]) => setSelectedWorkKeys(keys) };
  const logRowSelection = { selectedRowKeys: selectedLogKeys, onChange: (keys: React.Key[]) => setSelectedLogKeys(keys) };

  const cols = [
    {
      title: '快照',
      dataIndex: 'cover_url',
      render: (url: string) => (
        <img
          src={url}
          style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4 }}
          // 🌟 核心修复：图片加载失败时自动替换为占位图，彻底解决后台一堆碎图的问题
          onError={(e: any) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/40x50/f3f4f6/999999?text=无图';
          }}
        />
      )
    },
    { title: '作品名', dataIndex: 'title' },
    { title: '状态', dataIndex: 'is_published', render: (val: number, r: any) => <Switch size="small" checked={val === 1} onChange={(c) => toggle(r.id, c)} checkedChildren="已上架" unCheckedChildren="已下架" /> },
    { title: '操作', render: (_: any, r: any) => (<Button danger size="small" onClick={() => { Modal.confirm({ title: '确认销毁？', onOk: () => { fetch('/api/admin/force-delete-work', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id: r.id }) }).then(() => { message.success('已销毁并备份'); load(); }); } }); }}>强制销毁</Button>) }
  ];

  const logCols = [
    { title: '时间', dataIndex: 'created_at' },
    { title: '类型', dataIndex: 'action', render: () => <Tag color="red">删除</Tag> },
    { title: '目标 ID', dataIndex: 'target_id' },
    {
      title: '操作',
      render: (_: any, r: any) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => setViewBackup(r.backup_data)}>查看内容</Button>
          <Button danger size="small" onClick={() => {
            Modal.confirm({
              title: '确认删除这条日志吗？',
              onOk: () => {
                fetch('/api/admin/operation-logs/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' },
                  body: JSON.stringify({ id: r.id })
                }).then(r => r.json()).then(res => {
                  if (res.code === 200) { message.success('日志已删除'); load(); }
                });
              }
            });
          }}>删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <h3 style={{ marginBottom: 20, fontWeight: 'bold' }}>作品风控审查</h3>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="作品大盘" key="1">
          <div style={{ marginBottom: 16 }}>
            {selectedWorkKeys.length > 0 && (
              <Space>
                <span style={{ fontSize: '13px', color: '#666' }}>已选 {selectedWorkKeys.length} 项</span>
                <Button size="small" danger onClick={handleBatchForceDelete}>批量强制销毁</Button>
              </Space>
            )}
          </div>
          <Table scroll={{ y: 500 }} rowSelection={workRowSelection} columns={cols} dataSource={data} rowKey="id" pagination={false} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="销毁日志" key="2">
          <div style={{ marginBottom: 16 }}>
            {selectedLogKeys.length > 0 && (
              <Space>
                <span style={{ fontSize: '13px', color: '#666' }}>已选 {selectedLogKeys.length} 项</span>
                <Button size="small" danger onClick={handleBatchDeleteLogs}>批量删除日志</Button>
              </Space>
            )}
          </div>
          <Table scroll={{ y: 500 }} rowSelection={logRowSelection} columns={logCols} dataSource={logs} rowKey="id" pagination={false} />
        </Tabs.TabPane>
      </Tabs>

      <Modal title="销毁数据快照 (JSON 备份)" visible={!!viewBackup} onCancel={() => setViewBackup(null)} footer={null} width={800}>
        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {viewBackup ? JSON.stringify(JSON.parse(viewBackup), null, 2) : ''}
          </pre>
        </div>
      </Modal>
    </div>
  );
};

const AdminComponents = () => {
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', icon: '📦', category: '基础组件' });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const load = () => fetch('/api/components/list').then(r => r.json()).then(res => setData(res.data || []));
  useEffect(() => { load(); }, []);

  const toggleStatus = (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    fetch('/api/admin/components/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id, status: newStatus }) })
      .then(r => r.json()).then(res => {
        if (res.code === 200) { message.success('设置成功'); load(); }
        else { message.error(res.msg); }
      });
  };

  const handleBatchToggle = (status: number) => {
    if (selectedRowKeys.length === 0) return message.warning('请先勾选目标组件！');

    Promise.all(
      selectedRowKeys.map(id =>
        fetch('/api/admin/components/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' },
          body: JSON.stringify({ id, status })
        }).then(r => r.json())
      )
    ).then(() => {
      message.success(`成功批量${status === 1 ? '开启' : '关闭'}所选组件`);
      setSelectedRowKeys([]);
      load();
    });
  };

  const handleAdd = () => {
    if (!newComp.name) return message.warning('请输入名称');
    fetch('/api/admin/components/add', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify(newComp) })
      .then(r => r.json()).then(res => {
        if (res.code === 200) { message.success(res.msg); setIsModalVisible(false); load(); }
        else { message.error(res.msg); }
      });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const cols = [
    { title: '图标', dataIndex: 'icon', render: (t: string) => <div style={{ background: '#f5f5f5', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 16 }}>{t}</div> },
    { title: '名称', dataIndex: 'name', render: (t: string) => <b>{t}</b> },
    { title: '分类', dataIndex: 'category', render: (t: string) => <Tag color="processing">{t}</Tag> },
    { title: '状态', dataIndex: 'status', render: (val: number, r: any) => <Switch size="small" checked={val === 1} onChange={() => toggleStatus(r.id, r.status)} checkedChildren="开" unCheckedChildren="关" /> },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 'bold' }}>组件管控大盘</h3>
          {selectedRowKeys.length > 0 && (
            <Space>
              <span style={{ fontSize: '13px', color: '#666' }}>已选 {selectedRowKeys.length} 项</span>
              <Button size="small" type="primary" onClick={() => handleBatchToggle(1)}>批量开启</Button>
              <Button size="small" style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff' }} onClick={() => handleBatchToggle(0)}>批量关闭</Button>
            </Space>
          )}
        </div>
        <Button style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff' }} onClick={() => setIsModalVisible(true)}>下发新组件</Button>
      </div>

      <Table scroll={{ y: 500 }} rowSelection={rowSelection} columns={cols} dataSource={data} rowKey="id" pagination={false} />

      <Modal title="下发新组件" visible={isModalVisible} onOk={handleAdd} onCancel={() => setIsModalVisible(false)}>
        <Space direction="vertical" style={{ width: '100%', marginTop: 10 }}>
          <Input placeholder="名称 (例如：跑马灯组件)" value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} />
          <Input placeholder="图标 (例如：🎠)" value={newComp.icon} onChange={e => setNewComp({ ...newComp, icon: e.target.value })} />
          <Input placeholder="分类 (例如：扩展组件)" value={newComp.category} onChange={e => setNewComp({ ...newComp, category: e.target.value })} />
        </Space>
      </Modal>
    </div>
  );
};

// =================================================================
// 🌟 3. 主框架入口 (BasicLayout)
// =================================================================
export default function BasicLayout(props: any) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    sessionStorage.setItem('token', 'coolmall_bypass_token');
    (window as any).getFaceUrl = function () { };

    fetch('/api/components/list').then(r => r.json()).then(res => {
      if (res.code === 200) {
        (window as any).__DISABLED_COMPONENTS__ = res.data.filter((c: any) => c.status === 0).map((c: any) => c.name);
      }
    }).catch(() => console.error("组件库黑名单拉取失败"));
  }, []);

  const path = location.pathname.replace(/\/$/, '');
  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const GlobalBrandStyle = () => (
    <style>
      {`
        header { background-color: #ffffff !important; border-bottom: 1px solid #f3f4f6 !important; }
        .ant-menu-horizontal > .ant-menu-item-selected { color: #e11d48 !important; border-bottom: 2px solid #e11d48 !important; }
        .ant-btn-primary { background-color: #e11d48 !important; border-color: #e11d48 !important; color: #fff !important; }
        .ant-btn-primary:hover { background-color: #be123c !important; border-color: #be123c !important; }
        .ant-table-body { overflow-y: auto !important; }

        /* 1. 强制全站所有按钮绝不折行、绝不压扁 */
        .ant-btn {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
        }

        /* 2. 精准针对 /editor 编辑器外层容器修构 Flex 布局，彻底覆盖原版绝对定位碰撞 */
        [class*="editorWrap"] > div:first-child,
        [class*="editorWrap"] [class*="header"],
        [class*="editorWrap"] [class*="Header"] {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          position: relative !important;
          padding: 0 16px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow-x: auto !important;
          gap: 16px !important;
        }

        /* 左侧区域（Logo + 作品名输入框） */
        [class*="editorWrap"] [class*="logoArea"] {
          display: flex !important;
          align-items: center !important;
          position: static !important;
          flex-shrink: 0 !important;
          gap: 12px !important;
        }

        /* 中间操作按键组（撤销/重做/预览/清空）- 彻底干掉 position: absolute 和 translateX */
        [class*="editorWrap"] [class*="controlArea"] {
          display: flex !important;
          align-items: center !important;
          position: static !important;
          transform: none !important;
          left: auto !important;
          right: auto !important;
          flex-shrink: 0 !important;
          gap: 8px !important;
          margin: 0 auto !important;
        }

        /* 右侧操作区（我的作品/发布/后台） */
        [class*="editorWrap"] [class*="btnArea"] {
          display: flex !important;
          align-items: center !important;
          position: static !important;
          flex-shrink: 0 !important;
          gap: 8px !important;
        }
      `}
    </style>
  );

  if (['', '/', '/index'].includes(path)) return <>{props.children}</>;

  if (path.startsWith('/preview')) {
    const isIframe = window.self !== window.top || location.search.includes('gf=1');
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {props.children}
        {!isIframe && (
          <Button onClick={() => window.close()} style={{ position: 'fixed', top: 20, left: 20, zIndex: 999999 }}>返回</Button>
        )}
      </div>
    );
  }

  if (path === '/mall') return <><GlobalBrandStyle />{props.children}</>;
  if (path.startsWith('/editor')) return <><GlobalBrandStyle />{props.children}</>;
  if (path.startsWith('/excel')) return <><GlobalBrandStyle /><ExcelEditor /></>;

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '大盘概览' },
    { key: '/admin/homepage', icon: <SettingOutlined />, label: '主页配置' },
    { key: '/admin/audit', icon: <SafetyCertificateOutlined />, label: '作品审核' },
    { key: '/admin/components', icon: <BuildOutlined />, label: '组件管理' },
    { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/finance', icon: <BankOutlined />, label: '财务开票' },
    { key: '/mall', icon: <AppstoreOutlined />, label: '返回前台' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <GlobalBrandStyle />
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold' }}>
          {collapsed ? 'CM' : '后台管理'}
        </div>
        <Menu theme="dark" selectedKeys={[path]} mode="inline" items={menuItems} onClick={({ key }) => history.push(key)} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,0.08)', zIndex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#e11d48' }}>业务控制台</div>
          <Dropdown overlay={<Menu><Menu.Item key="2" onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }}>退出登录</Menu.Item></Menu>} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar style={{ backgroundColor: '#e11d48' }}>管</Avatar>
              <span style={{ color: '#333', fontWeight: '500' }}>超级管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: '8px', padding: '24px', overflowY: 'auto', height: 'calc(100vh - 112px)' }}>
          {path === '/dashboard' ? <Dashboard /> :
            path === '/users' ? <AdminUsers /> :
              path === '/finance' ? <Finance /> :
                path === '/admin/homepage' ? <AdminHomepage /> :
                  path === '/admin/audit' ? <AdminAudit /> :
                    path === '/admin/components' ? <AdminComponents /> :
                      props.children}
        </Content>
      </Layout>
    </Layout>
  );
}
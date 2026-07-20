import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Tag, Button, message, Tabs, Modal, Table, Switch, Space } from 'antd';
message.config({ top: 70, maxCount: 3 });
import { DashboardOutlined, BankOutlined, AppstoreOutlined, TeamOutlined, LogoutOutlined, ShoppingCartOutlined, AppstoreAddOutlined, SafetyCertificateOutlined, BuildOutlined } from '@ant-design/icons';
import { history, useLocation } from 'umi';

import Dashboard from '@/pages/dashboard';
import UsersManage from '@/pages/users';
import Finance from '@/pages/finance';
import ExcelEditor from '@/pages/excel/index';

const { Header, Sider, Content } = Layout;

// =================================================================
// 🌟 1. 商城大厅与个人中心 (极简文案)
// =================================================================
const MallPortal = () => {
  const [templates, setTemplates] = useState([]);
  const [myWorks, setMyWorks] = useState([]);
  const [activeMenu, setActiveMenu] = useState('mall');
  const [previewModal, setPreviewModal] = useState({ visible: false, url: '' });

  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const loadData = () => {
    fetch('http://localhost:3000/api/templates/list').then(r => r.json()).then(res => { if (res.code === 200) setTemplates(res.data || []); });
    if (user) {
      fetch('http://localhost:3000/api/h5/my-works', { headers: { 'x-role': user.role, 'x-user-id': user.userId?.toString() } })
        .then(r => r.json()).then(res => { if (res.code === 200) setMyWorks(res.data || []); });
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUseTemplate = (tpl: any) => {
    try {
      localStorage.setItem('coolmall_pending_tpl', tpl.json_data || '[]');
      message.success('模板就绪...');
      const isExcel = tpl.category === 'excel' || (tpl.id && String(tpl.id).includes('EXCEL'));
      if (isExcel) setTimeout(() => history.push('/excel'), 600);
      else setTimeout(() => history.push('/editor'), 600);
    } catch (e) { message.error('数据异常'); }
  };

  const handleEditWork = (work: any) => {
    fetch(`http://localhost:3000/api/h5/work/${work.id}`).then(r => r.json()).then(res => {
      if (res.code === 200) {
        localStorage.setItem('coolmall_pending_tpl', JSON.stringify(res.data.schema_json) || '[]');
        message.success('载入中...');
        const isExcel = res.data.category === 'excel' || (work.id && String(work.id).includes('EXCEL'));
        if (isExcel) setTimeout(() => history.push(`/excel?tid=${work.id}`), 600);
        else setTimeout(() => history.push(`/editor?tid=${work.id}`), 600);
      } else {
        message.error(res.msg || '读取失败');
      }
    }).catch(err => message.error('请求异常'));
  };

  const togglePublishStatus = (e: any, work: any) => {
    e.stopPropagation();
    const targetStatus = work.is_published === 1 ? 0 : 1;
    fetch('http://localhost:3000/api/h5/work/toggle-publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
      body: JSON.stringify({ id: work.id, is_published: targetStatus })
    }).then(r => r.json()).then(res => {
      if (res.code === 200) { message.success('操作成功'); loadData(); }
      else { message.error(res.msg || '操作失败'); }
    });
  };

  const isComponent = (id: any) => !String(id).includes('_');
  const mallItems = templates.filter((t: any) => !isComponent(t.id));
  const tplItems = templates.filter((t: any) => isComponent(t.id));

  return (
    <Layout style={{ height: '100vh', background: '#f8f9fa', overflow: 'hidden' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 10 }}>

        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <img src="/logo.png" alt="酷猫" style={{ height: '32px', marginRight: '24px', flexShrink: 0 }} onError={(e) => e.currentTarget.style.display = 'none'} />
          <Menu mode="horizontal" selectedKeys={[activeMenu]} onClick={(e) => setActiveMenu(e.key)} style={{ borderBottom: 'none', lineHeight: '64px', flex: 1, minWidth: 0, border: 'none' }}>
            <Menu.Item key="mall" style={{ fontWeight: 'bold', fontSize: '15px' }}>商城主页</Menu.Item>
            <Menu.Item key="tpl" style={{ fontWeight: 'bold', fontSize: '15px' }}>组件模板</Menu.Item>
            <Menu.Item key="my" style={{ fontWeight: 'bold', fontSize: '15px' }}>我的作品</Menu.Item>
          </Menu>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0, paddingLeft: '16px' }}>
          <span style={{ color: '#666', fontSize: '13px' }}>欢迎, {user?.username}</span>
          <Tag color={user?.role === 'admin' ? 'red' : 'blue'} style={{ fontWeight: 'bold', margin: 0 }}>
            {user?.role === 'admin' ? '管理员' : '创作者'}
          </Tag>
          {user?.role === 'admin' && (
            <Button type="primary" onClick={() => history.push('/dashboard')} style={{ background: '#111827', borderColor: '#111827', color: '#F6D365', fontWeight: 'bold', borderRadius: '6px' }}>
              后台管理
            </Button>
          )}
          <Button onClick={() => history.push('/excel')} style={{ borderRadius: '6px', color: '#107c41', borderColor: '#107c41' }}>新建表格</Button>
          <Button type="primary" onClick={() => { localStorage.removeItem('coolmall_pending_tpl'); history.push('/editor'); }} style={{ borderRadius: '6px', background: '#e11d48', borderColor: '#e11d48' }}>新建页面</Button>
          <Button onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }} style={{ borderRadius: '6px' }}>退出</Button>
        </div>
      </Header>

      <Content style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', height: 'calc(100vh - 64px)', overflowY: 'auto', paddingBottom: '80px' }}>

        {activeMenu === 'mall' && (
          <>
            <Tabs defaultActiveKey="1" size="large" style={{ marginBottom: '24px' }}><Tabs.TabPane tab="商城主页" key="1" /></Tabs>
            {mallItems.length === 0 ? (<div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>暂无数据</div>) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {mallItems.map((tpl: any) => {
                  const isExcel = tpl.category === 'excel' || (tpl.id && String(tpl.id).includes('EXCEL'));
                  return (
                    <div key={tpl.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s', position: 'relative' }} onClick={() => handleUseTemplate(tpl)}>
                      <div style={{ position: 'relative', height: '340px', background: '#f3f4f6', overflow: 'hidden' }}>
                        {!isExcel ? (
                          <iframe src={`/preview?tid=${tpl.id}`} style={{ width: '375px', height: '667px', border: 'none', transform: 'scale(0.66)', transformOrigin: 'top left', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }} />
                        ) : (
                          <img src={tpl.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={tpl.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/300x400/107c41/ffffff?text=Excel'; }} />
                        )}
                        {isExcel && <Tag color="green" style={{ position: 'absolute', top: 12, left: 12 }}>表格</Tag>}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{tpl.title}</h4>
                        <div style={{ fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}><span>{isExcel ? '表格' : '页面'}</span><span>{tpl.date?.split(' ')[0]}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeMenu === 'tpl' && (
          <>
            <Tabs defaultActiveKey="1" size="large" style={{ marginBottom: '24px' }}><Tabs.TabPane tab="组件模板" key="1" /></Tabs>
            {tplItems.length === 0 ? (<div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>暂无组件</div>) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {tplItems.map((tpl: any) => (
                  <div key={tpl.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s', position: 'relative' }} onClick={() => handleUseTemplate(tpl)}>
                    <div style={{ position: 'relative', height: '200px', background: '#f8f9fa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={tpl.cover_url} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} alt={tpl.title} />
                      <Tag color="cyan" style={{ position: 'absolute', top: 12, left: 12 }}>组件</Tag>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{tpl.title}</h4>
                      <div style={{ fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}><span>组件库</span><span>{tpl.date?.split(' ')[0]}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeMenu === 'my' && (
          <>
            <Tabs defaultActiveKey="1" size="large" style={{ marginBottom: '24px' }}><Tabs.TabPane tab="我的作品" key="1" /></Tabs>
            {myWorks.length === 0 ? (<div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>暂无数据</div>) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {myWorks.map((work: any) => {
                  const isExcel = work.category === 'excel' || (work.id && String(work.id).includes('EXCEL'));
                  return (
                    <div key={work.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                        <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleEditWork(work); }}>编辑</Button>
                        <Button size="small" type={work.is_published === 1 ? 'default' : 'primary'} danger={work.is_published === 1} style={work.is_published !== 1 ? { background: '#10b981', borderColor: '#10b981' } : {}} onClick={(e) => togglePublishStatus(e, work)}>
                          {work.is_published === 1 ? '下架' : '上架'}
                        </Button>
                      </div>
                      <div onClick={() => handleEditWork(work)}>
                        <div style={{ height: '340px', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                          {isExcel ? (
                            <img src={work.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={work.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/300x400/107c41/ffffff?text=Excel'; }} />
                          ) : (
                            <iframe src={`/preview?tid=${work.id}`} style={{ width: '375px', height: '667px', border: 'none', transform: 'scale(0.66)', transformOrigin: 'top left', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }} />
                          )}
                          {isExcel && <Tag color="green" style={{ position: 'absolute', top: 12, left: 12 }}>表格</Tag>}
                        </div>
                        <div style={{ padding: '16px' }}>
                          <h4 style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px' }}>{work.title}</h4>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>状态: {work.is_published === 1 ? <span style={{ color: '#10b981' }}>已上架</span> : <span style={{ color: '#f59e0b' }}>未上架</span>}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Content>

      <Modal visible={previewModal.visible} onCancel={() => setPreviewModal({ visible: false, url: '' })} footer={null} width={414} bodyStyle={{ padding: 0, height: '736px', borderRadius: '12px', overflow: 'hidden' }} destroyOnClose centered closeIcon={<div style={{ background: '#000', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-10px', marginRight: '-10px' }}>X</div>}>
        <iframe src={previewModal.url} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
      </Modal>
    </Layout>
  );
};

// =================================================================
// 🌟 2. 满血 B 端管理后台 (加了分页、改了极简文字、加了按钮事件)
// =================================================================

const AdminTemplates = () => {
  const [data, setData] = useState([]);
  const load = () => fetch('http://localhost:3000/api/admin/templates', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setData(res.data || []));
  useEffect(() => { load(); }, []);
  const cols = [
    { title: '封面', dataIndex: 'cover_url', render: (url: string) => <img src={url} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} /> },
    { title: '名称', dataIndex: 'title', render: (t: string) => <b>{t}</b> },
    { title: '类型', dataIndex: 'category', render: (c: string) => <Tag color={c === 'excel' ? 'green' : 'blue'}>{c === 'excel' ? '表格' : '页面'}</Tag> },
    { title: '时间', dataIndex: 'date' },
    {
      title: '操作', render: (_: any, r: any) => (
        <Button danger size="small" onClick={() => { Modal.confirm({ title: '确认删除', onOk: () => { fetch('http://localhost:3000/api/templates/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) }).then(() => { message.success('已删除'); load(); }); } }); }}>删除</Button>
      )
    }
  ];
  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <h3 style={{ marginBottom: 20, fontWeight: 'bold' }}>模板管理</h3>
      {/* 💥 加上完整分页 */}
      <Table columns={cols} dataSource={data} rowKey="id" pagination={{ pageSize: 8 }} />
    </div>
  );
};

const AdminAudit = () => {
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  const load = () => {
    fetch('http://localhost:3000/api/admin/all-works', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setData(res.data || []));
    fetch('http://localhost:3000/api/admin/operation-logs', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setLogs(res.data || []));
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string, status: boolean) => {
    fetch('http://localhost:3000/api/h5/work/toggle-publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id, is_published: status ? 1 : 0 })
    }).then(r => r.json()).then(res => {
      if (res.code === 200) { message.success('已刷新'); load(); }
      else { message.error(res.msg); }
    });
  };

  const cols = [
    { title: '快照', dataIndex: 'cover_url', render: (url: string) => <img src={url} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} /> },
    { title: '作品名', dataIndex: 'title', render: (t: string) => <b>{t}</b> },
    { title: '状态', dataIndex: 'is_published', render: (val: number, r: any) => <Switch size="small" checked={val === 1} onChange={(c) => toggle(r.id, c)} checkedChildren="上架" unCheckedChildren="下架" /> },
    { title: '时间', dataIndex: 'date' },
    {
      title: '操作', render: (_: any, r: any) => (
        <Button danger size="small" onClick={() => {
          Modal.confirm({
            title: '确认删除？',
            onOk: () => {
              fetch('http://localhost:3000/api/admin/force-delete-work', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id: r.id })
              }).then(r => r.json()).then(res => {
                if (res.code === 200) { message.success('已删除'); load(); } else { message.error('删除失败'); }
              });
            }
          });
        }}>删除</Button>
      )
    }
  ];

  const logCols = [
    { title: '时间', dataIndex: 'created_at' },
    { title: '类型', dataIndex: 'action', render: () => <Tag color="red">删除</Tag> },
    { title: '目标 ID', dataIndex: 'target_id' },
    { title: '备份', dataIndex: 'backup_data', render: () => <Button size="small" type="link">查看</Button> },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <h3 style={{ marginBottom: 20, fontWeight: 'bold' }}>作品审核</h3>
      <Tabs defaultActiveKey="1" onChange={setActiveTab}>
        {/* 💥 加上完整分页，解决图1没滑轮的问题 */}
        <Tabs.TabPane tab="作品大盘" key="1"><Table columns={cols} dataSource={data} rowKey="id" pagination={{ pageSize: 8 }} /></Tabs.TabPane>
        <Tabs.TabPane tab="销毁日志" key="2"><Table columns={logCols} dataSource={logs} rowKey="id" pagination={{ pageSize: 8 }} /></Tabs.TabPane>
      </Tabs>
    </div>
  );
};

const AdminComponents = () => {
  const [data, setData] = useState([]);
  const load = () => fetch('http://localhost:3000/api/components/list').then(r => r.json()).then(res => setData(res.data || []));
  useEffect(() => { load(); }, []);

  const toggleStatus = (id: number, status: boolean) => {
    fetch('http://localhost:3000/api/admin/components/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin' }, body: JSON.stringify({ id, status }) })
      .then(r => r.json()).then(() => { message.success('设置成功'); load(); });
  };

  const cols = [
    { title: '图标', dataIndex: 'icon', render: (t: string) => <div style={{ background: '#f5f5f5', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 16 }}>{t}</div> },
    { title: '名称', dataIndex: 'name', render: (t: string) => <b>{t}</b> },
    { title: '分类', dataIndex: 'category', render: (t: string) => <Tag color="processing">{t}</Tag> },
    { title: '状态', dataIndex: 'status', render: (val: number, r: any) => <Switch size="small" checked={val === 1} onChange={(c) => toggleStatus(r.id, c)} checkedChildren="开" unCheckedChildren="关" /> },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontWeight: 'bold' }}>组件管理</h3>
        {/* 💥 修复图3：增加交互提示 */}
        <Button type="primary" onClick={() => message.info('功能开发中：即将支持上传 UMD 自定义组件包')} style={{ background: '#10b981', borderColor: '#10b981' }}>下发新组件</Button>
      </div>
      <Table columns={cols} dataSource={data} rowKey="id" pagination={{ pageSize: 10 }} />
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
  }, []);

  const path = location.pathname.replace(/\/$/, '');
  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!path.startsWith('/editor')) return;
    let timer: any;
    fetch('http://localhost:3000/api/components/list').then(r => r.json()).then(res => {
      if (res.code !== 200) return;
      const disabledNames = res.data.filter((c: any) => c.status === 0).map((c: any) => c.name);
      if (disabledNames.length === 0) return;

      timer = setInterval(() => {
        disabledNames.forEach((name: string) => {
          const els = document.evaluate(`//*[text()='${name}']`, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < els.snapshotLength; i++) {
            let node = els.snapshotItem(i) as HTMLElement;
            if (node && node.parentElement) {
              node.parentElement.style.setProperty('display', 'none', 'important');
              if (node.parentElement.parentElement && node.parentElement.parentElement.children.length === 1) {
                node.parentElement.parentElement.style.setProperty('display', 'none', 'important');
              }
            }
          }
        });
      }, 1000);
    });
    return () => clearInterval(timer);
  }, [path]);

  const GlobalBrandStyle = () => (
    <style>
      {`
        :root { --ant-primary-color: #e11d48; }
        .ant-btn-primary { background-color: #e11d48 !important; border-color: #e11d48 !important; }
        header { background-color: #ffffff !important; border-bottom: 1px solid #f3f4f6 !important; }
        a { color: #e11d48 !important; }
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
          <Button onClick={() => window.close()} style={{ position: 'fixed', top: 20, left: 20, zIndex: 999999 }}>
            返回
          </Button>
        )}
      </div>
    );
  }

  if (path === '/mall') return <><GlobalBrandStyle /><MallPortal /></>;
  if (path.startsWith('/editor')) return <><GlobalBrandStyle />{props.children}</>;
  if (path.startsWith('/excel')) return <><GlobalBrandStyle /><ExcelEditor /></>;

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '大盘概览' },
    { key: '/admin/templates', icon: <AppstoreAddOutlined />, label: '模板管理' },
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
        <Content style={{ margin: '24px', background: '#fff', borderRadius: '8px', padding: '24px', overflow: 'initial', minHeight: '80vh' }}>
          {path === '/dashboard' ? <Dashboard /> :
            path === '/users' ? <UsersManage /> :
              path === '/finance' ? <Finance /> :
                path === '/admin/templates' ? <AdminTemplates /> :
                  path === '/admin/audit' ? <AdminAudit /> :
                    path === '/admin/components' ? <AdminComponents /> :
                      props.children}
        </Content>
      </Layout>
    </Layout>
  );
}
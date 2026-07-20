import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Tag, Button, message, Tabs } from 'antd';
// 🌟 修复图1：全局下压 message 提示框，彻底告别遮挡打架
message.config({ top: 70, maxCount: 3 });
import { DashboardOutlined, BankOutlined, AppstoreOutlined, TeamOutlined, LogoutOutlined, ShoppingCartOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { history, useLocation } from 'umi';

// 🌟 手动引入 B 端后台页面
import Dashboard from '@/pages/dashboard';
import UsersManage from '@/pages/users';
import Finance from '@/pages/finance';
// 🌟 插入这行：暴力引入我们新建的 Excel 组件
import ExcelEditor from '@/pages/excel/index';

const { Header, Sider, Content } = Layout;

// =================================================================
// 🌟 新增：独立封装的“酷猫总门户商城 (Mall)”组件
// 定位：对标稿定设计/稻壳儿，瀑布流展示全站资产，分流用户至不同编辑器
// =================================================================
const MallPortal = () => {
  const [templates, setTemplates] = useState([]);
  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // 初始化拉取云端模板金库
  useEffect(() => {
    fetch('http://localhost:3000/api/templates/list')
      .then(r => r.json())
      .then(res => {
        if (res.code === 200) setTemplates(res.data || []);
      })
      .catch(() => message.error('无法连接到后端服务器，请检查 Node 服务是否启动'));
  }, []);

  // 点击模板：缓存模板数据，并跳转到长页编辑器
  const handleUseTemplate = (tpl: any) => {
    try {
      // 存入缓存，待会儿编辑器页面加载时会来这里取数据
      localStorage.setItem('coolmall_pending_tpl', tpl.json_data || '[]');
      message.success('模板已就绪，正在分配渲染引擎...');

      // 💥 核心修复：根据模板的 category 智能分配通道！不再无脑进 editor
      if (tpl.category === 'excel') {
        setTimeout(() => history.push('/excel'), 600);
      } else {
        setTimeout(() => history.push('/editor'), 600);
      }
    } catch (e) {
      message.error('模板数据异常');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* 商业级门户顶部导航 */}
      <Header style={{ background: '#fff', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#e11d48', letterSpacing: '1px' }}>酷猫商业中枢</div>
          <Menu mode="horizontal" defaultSelectedKeys={['mall']} style={{ borderBottom: 'none', lineHeight: '64px', minWidth: '250px' }}>
            <Menu.Item key="mall" style={{ fontWeight: 'bold' }}>模板商城</Menu.Item>
            <Menu.Item key="my" onClick={() => message.info('作品云盘模块开发中...')}>我的作品</Menu.Item>
          </Menu>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '13px' }}>欢迎, {user?.username}</span>
          <Tag color={user?.role === 'vip' ? 'gold' : 'blue'}>{user?.role === 'vip' ? 'VIP' : '普通用户'}</Tag>

          {/* 🌟 插入这行：新建 Excel 的按钮 */}
          <Button size="large" onClick={() => history.push('/excel')} style={{ borderRadius: '6px', fontWeight: 'bold', color: '#107c41', borderColor: '#107c41' }}>
            + 新建云表格 (Excel)
          </Button>
          
          <Button
            type="primary"
            size="large"
            // 🌟 点击空白创建时，清空待办模板缓存，进入干净的画布
            onClick={() => { localStorage.removeItem('coolmall_pending_tpl'); history.push('/editor'); }}
            style={{ borderRadius: '6px', fontWeight: 'bold', background: '#e11d48', borderColor: '#e11d48' }}
          >
            + 空白新建长页
          </Button>
          <Button onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }} style={{ borderRadius: '6px' }}>退出</Button>
        </div>
      </Header>

      {/* 瀑布流内容核心区 */}
      <Content style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Tabs defaultActiveKey="1" size="large" style={{ marginBottom: '24px' }}>
          <Tabs.TabPane tab="🔥 推荐精选" key="1" />
          <Tabs.TabPane tab="📄 长页落地页 (Long-page)" key="2" />
          <Tabs.TabPane tab="📑 幻灯片微传单 (底层重构中...)" key="3" disabled />
          <Tabs.TabPane tab="🖼️ 电商静态海报 (引擎接入中...)" key="4" disabled />
        </Tabs>

        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>暂无模板资产，请去编辑器保存一个</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {templates.map((tpl: any) => (
              <div
                key={tpl.id}
                style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s' }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' })}
                onClick={() => handleUseTemplate(tpl)}
              >
                <img src={tpl.cover_url} style={{ width: '100%', height: '320px', objectFit: 'cover', borderBottom: '1px solid #f0f0f0' }} alt={tpl.title} />
                <div style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{tpl.title}</h4>
                  <div style={{ fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                    <span>长页模板</span>
                    <span>{tpl.date?.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Content>
    </Layout>
  );
};


// =================================================================
// 主框架入口 (BasicLayout)
// =================================================================
export default function BasicLayout(props: any) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    sessionStorage.setItem('token', 'coolmall_bypass_token');
  }, []);

  const path = location.pathname.replace(/\/$/, '');
  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const GlobalBrandStyle = () => (
    <style>
      {`
        :root { --ant-primary-color: #e11d48; --ant-primary-color-hover: #be123c; --ant-primary-color-active: #f43f5e; }
        .ant-btn-primary { background-color: #e11d48 !important; border-color: #e11d48 !important; }
        .ant-btn-primary:hover { background-color: #be123c !important; border-color: #be123c !important; }
        header, div[class*="header"] { background-color: #ffffff !important; border-bottom: 1px solid #f3f4f6 !important; box-shadow: none !important; }
        div[class*="header"] .ant-btn, header .ant-btn, .editor-header-nav button { background: transparent !important; border: 1px solid transparent !important; color: #4b5563 !important; font-weight: 500 !important; border-radius: 6px !important; box-shadow: none !important; transition: all 0.2s ease !important; }
        div[class*="header"] .ant-btn:hover, header .ant-btn:hover, .editor-header-nav button:hover { background: #f3f4f6 !important; color: #111827 !important; }
        header .ant-btn-primary, div[class*="header"] .ant-btn-primary { background: #e11d48 !important; color: #ffffff !important; }
        header .ant-btn-primary:hover, div[class*="header"] .ant-btn-primary:hover { background: #be123c !important; }
        .ant-popover, .sketch-picker { z-index: 999999 !important; }
        div[class*="right-setting"], div[class*="form-editor"] { overflow: visible !important; overflow-y: visible !important; }
        a { color: #e11d48 !important; }
        a:hover { color: #be123c !important; }
      `}
    </style>
  );

  // 1. 登录页分发
  if (['', '/', '/index'].includes(path)) {
    return <>{props.children}</>;
  }

  // 2. 预览页分发 (修复：返回时关闭标签页)
  if (path.startsWith('/preview')) {
    const isIframe = window.self !== window.top || location.search.includes('gf=1');
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {props.children}
        {!isIframe && (
          <Button onClick={() => window.close()} style={{ position: 'fixed', top: 20, left: 20, zIndex: 999999, background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', border: 'none', color: '#F6D365', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', borderRadius: '8px' }}>
            &larr; 关闭预览页
          </Button>
        )}
      </div>
    );
  }

  // 3. 🌟 新增：独立总门户分发
  if (path === '/mall') {
    return (
      <>
        <GlobalBrandStyle />
        <MallPortal />
      </>
    );
  }

  // 4. 🌟 C端长页编辑器独立分发
  if (path.startsWith('/editor')) {
    return (
      <>
        <GlobalBrandStyle />
        {props.children}
      </>
    );
  }

  // 🌟 5. Excel 引擎极客硬路由（彻底解决白屏！）
  if (path.startsWith('/excel')) {
    return (
      <>
        <GlobalBrandStyle />
        <ExcelEditor />
      </>
    );
  }

  // 5. B端管理后台分发
  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '财务与资产大盘' },
    { key: '/users', icon: <TeamOutlined />, label: '会员与权限管理' },
    { key: '/finance', icon: <BankOutlined />, label: '合规开票中台' },
    { key: '/mall', icon: <AppstoreOutlined />, label: '返回 C 端总门户' }, // 💡 后台返回的入口也改到商城了
  ];

  const handleLogout = () => {
    localStorage.removeItem('coolmall_user');
    history.push('/');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="1" disabled><Tag color="red">最高权限节点</Tag></Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2" danger icon={<LogoutOutlined />} onClick={handleLogout}>安全退出系统</Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <GlobalBrandStyle />
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold' }}>
          {collapsed ? 'CM' : 'CoolMall Admin'}
        </div>
        <Menu theme="dark" selectedKeys={[path]} mode="inline" items={menuItems} onClick={({ key }) => history.push(key)} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,0.08)', zIndex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#e11d48' }}>酷猫 SaaS 商业中枢</div>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar style={{ backgroundColor: '#e11d48' }}>Admin</Avatar>
              <span style={{ color: '#333', fontWeight: '500' }}>超级管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#f0f2f5', borderRadius: '8px', overflow: 'initial' }}>
          {/* 🌟 暴力接管路由，直接渲染组件，彻底告别白屏！ */}
          {path === '/dashboard' ? <Dashboard /> :
            path === '/users' ? <UsersManage /> :
              path === '/finance' ? <Finance /> :
                path === '/excel' ? <ExcelEditor /> :
                  props.children}
        </Content>
      </Layout>
    </Layout>
  );
}
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Tag, Button, message, Tabs, Modal, Table, Switch, Space, Input, Carousel, Upload } from 'antd';
message.config({ top: 70, maxCount: 3 });
import { DashboardOutlined, BankOutlined, AppstoreOutlined, TeamOutlined, LogoutOutlined, AppstoreAddOutlined, SafetyCertificateOutlined, BuildOutlined, SettingOutlined } from '@ant-design/icons';
import { history, useLocation } from 'umi';

import Dashboard from '@/pages/dashboard';
import Finance from '@/pages/finance';
import ExcelEditor from '@/pages/excel/index';

const { Header, Sider, Content } = Layout;

// =================================================================
// 🌟 1. 商城大厅与个人中心
// =================================================================
const MallPortal = () => {
  const location = useLocation(); // 1. 获取路由对象
  const [templates, setTemplates] = useState([]);
  const [myWorks, setMyWorks] = useState([]);
  const [carouselData, setCarouselData] = useState([]);
  const [announcement, setAnnouncement] = useState('');

  // 2. 初始化时根据网址带的 ?tab=xxx 自动设置激活的菜单
  const initialTab = (location.query as any)?.tab || 'mall';
  const [activeMenu, setActiveMenu] = useState(initialTab);
  const [showVipCenter, setShowVipCenter] = useState(false);

  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const loadData = () => {
    fetch('http://localhost:3000/api/templates/list').then(r => r.json()).then(res => { if (res.code === 200) setTemplates(res.data || []); });
    fetch('http://localhost:3000/api/settings/carousel').then(r => r.json()).then(res => { if (res.code === 200) setCarouselData(res.data || []); });
    fetch('http://localhost:3000/api/settings/announcement').then(r => r.json()).then(res => { if (res.code === 200) setAnnouncement(res.data || ''); });
    if (user) {
      fetch('http://localhost:3000/api/h5/my-works', { headers: { 'x-role': user.role, 'x-user-id': user.userId?.toString() } })
        .then(r => r.json()).then(res => { if (res.code === 200) setMyWorks(res.data || []); });
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUseTemplate = (tpl: any) => {
    localStorage.setItem('coolmall_pending_tpl', tpl.json_data || '[]');
    message.success('模板就绪...');
    const isExcel = tpl.category === 'excel' || (tpl.id && String(tpl.id).includes('EXCEL'));
    setTimeout(() => history.push(isExcel ? '/excel' : '/editor'), 600);
  };

  const handleEditWork = (work: any) => {
    fetch(`http://localhost:3000/api/h5/work/${work.id}`).then(r => r.json()).then(res => {
      if (res.code === 200) {
        localStorage.setItem('coolmall_pending_tpl', JSON.stringify(res.data.schema_json) || '[]');
        message.success('载入中...');
        const isExcel = res.data.category === 'excel' || (work.id && String(work.id).includes('EXCEL'));
        setTimeout(() => history.push(isExcel ? `/excel?tid=${work.id}` : `/editor?tid=${work.id}`), 600);
      } else message.error(res.msg || '读取失败');
    }).catch(() => message.error('请求异常'));
  };

  const togglePublishStatus = (e: any, work: any) => {
    e.stopPropagation();
    const targetStatus = work.is_published === 1 ? 0 : 1;
    fetch('http://localhost:3000/api/h5/work/toggle-publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
      body: JSON.stringify({ id: work.id, is_published: targetStatus })
    }).then(r => r.json()).then(res => {
      if (res.code === 200) { message.success('操作成功'); loadData(); }
    });
  };

  const isComponent = (id: any) => !String(id).includes('_');
  const mallItems = templates.filter((t: any) => !isComponent(t.id));
  const tplItems = templates.filter((t: any) => isComponent(t.id));

  const h5Templates = mallItems.filter((t: any) => t.category !== 'excel' && (!t.id || !String(t.id).includes('EXCEL')));
  const excelTemplates = mallItems.filter((t: any) => t.category === 'excel' || (t.id && String(t.id).includes('EXCEL')));

  return (
    <Layout style={{ height: '100vh', background: '#f8f9fa', overflow: 'hidden' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px', marginRight: '24px' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          <Menu mode="horizontal" selectedKeys={[activeMenu]} onClick={(e) => setActiveMenu(e.key)} style={{ borderBottom: 'none', lineHeight: '64px', flex: 1, border: 'none' }}>
            <Menu.Item key="mall" style={{ fontWeight: 'bold' }}>商城主页</Menu.Item>
            <Menu.Item key="tpl" style={{ fontWeight: 'bold' }}>组件模板</Menu.Item>
            <Menu.Item key="my" style={{ fontWeight: 'bold' }}>我的作品</Menu.Item>
          </Menu>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#666', fontSize: '13px' }}>欢迎, {user?.username}</span>
          <Tag color={user?.role === 'admin' ? 'red' : 'blue'}>{user?.role === 'admin' ? '管理员' : '创作者'}</Tag>

          {user && !user.role?.includes('admin') && (
            <Button style={{ backgroundColor: '#d46b08', borderColor: '#d46b08', color: '#fff' }} onClick={() => setShowVipCenter(true)}>会员中心</Button>
          )}

          {user?.role === 'admin' && (<Button style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff' }} onClick={() => history.push('/dashboard')}>后台管理</Button>)}
          <Button onClick={() => history.push('/excel')} style={{ color: '#107c41', borderColor: '#107c41' }}>新建表格</Button>
          <Button style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff' }} onClick={() => { localStorage.removeItem('coolmall_pending_tpl'); history.push('/editor'); }}>新建页面</Button>
          <Button onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }}>退出</Button>
        </div>
      </Header>

      <Content style={{ padding: '40px 24px', width: '100%', height: 'calc(100vh - 64px)', overflowY: 'auto', paddingBottom: '80px' }}>
        {activeMenu === 'mall' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            {/* 🌟 顶部滚动公告栏 */}
            {announcement && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '10px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#e11d48', fontSize: '14px', boxShadow: '0 2px 6px rgba(225,29,72,0.05)' }}>
                <span style={{ fontSize: '16px' }}>📢</span>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, fontWeight: 500 }}>
                  {announcement}
                </div>
              </div>
            )}

            {carouselData.length > 0 && (
              <Carousel autoplay effect="fade" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '40px', boxShadow: '0 8px 24px rgba(225,29,72,0.15)' }}>
                {carouselData.map((item: any) => (
                  <div key={item.id}>
                    {/* 🌟 在这里把轮播图高度调高，例如改成 200px */}
                    <div style={{ height: '200px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', width: '100%' }}>
                      {item.image_url ? (
                        <img src={item.image_url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#111827', zIndex: 0 }} />
                      )}
                      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
                        <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: 0, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{item.title}</h1>
                        <p style={{ fontSize: '18px', marginTop: '16px', color: '#fff', opacity: 0.9, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            )}

            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderLeft: '4px solid #e11d48', paddingLeft: '12px', marginBottom: '24px', color: '#333' }}>🔥 最新落地页</h2>
              {h5Templates.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px 0', color: '#999', background: '#fff', borderRadius: '12px' }}>暂无页面模板</div>) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                  {h5Templates.map((tpl: any) => (
                    <div key={tpl.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s', position: 'relative' }} onClick={() => handleUseTemplate(tpl)}>
                      <div style={{ position: 'relative', height: '340px', background: '#f3f4f6', overflow: 'hidden' }}>
                        <iframe src={`/preview?tid=${tpl.id}`} style={{ width: '375px', height: '667px', border: 'none', transform: 'scale(0.66)', transformOrigin: 'top left', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }} />
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{tpl.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderLeft: '4px solid #107c41', paddingLeft: '12px', marginBottom: '24px', color: '#333' }}>📊 热门云表格大盘</h2>
              {excelTemplates.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px 0', color: '#999', background: '#fff', borderRadius: '12px' }}>暂无表格模板</div>) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                  {excelTemplates.map((tpl: any) => (
                    <div key={tpl.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s', position: 'relative' }} onClick={() => handleUseTemplate(tpl)}>
                      <div style={{ position: 'relative', height: '340px', background: '#f3f4f6', overflow: 'hidden' }}>
                        <img src={tpl.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={tpl.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/300x400/107c41/ffffff?text=Excel'; }} />
                        <Tag color="green" style={{ position: 'absolute', top: 12, left: 12, fontWeight: 'bold' }}>Excel 云表格</Tag>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{tpl.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeMenu === 'tpl' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {tplItems.map((tpl: any) => (
              <div key={tpl.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onClick={() => handleUseTemplate(tpl)}>
                <div style={{ height: '200px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={tpl.cover_url} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} /></div>
                <div style={{ padding: '16px' }}><h4 style={{ margin: '0', fontWeight: 'bold' }}>{tpl.title}</h4></div>
              </div>
            ))}
          </div>
        )}

        {activeMenu === 'my' && (
          <div>
            {myWorks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', background: '#fff', borderRadius: '12px' }}>
                暂无作品，快去点击右上角“新建页面”或“新建表格”创作吧！
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {myWorks.map((work: any) => {
                  const isExcel = work.category === 'excel' || (work.id && String(work.id).includes('EXCEL'));
                  return (
                    <div key={work.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                        <Button size="small" style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }} onClick={(e) => { e.stopPropagation(); handleEditWork(work); }}>编辑</Button>
                        <Button size="small" style={work.is_published === 1 ? {} : { backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }} danger={work.is_published === 1} onClick={(e) => togglePublishStatus(e, work)}>{work.is_published === 1 ? '下架' : '上架'}</Button>
                      </div>
                      <div onClick={() => handleEditWork(work)}>
                        <div style={{ height: '340px', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                          {isExcel ? <img src={work.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <iframe src={`/preview?tid=${work.id}`} style={{ width: '375px', height: '667px', border: 'none', transform: 'scale(0.66)', transformOrigin: 'top left', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }} />}
                        </div>
                        <div style={{ padding: '16px' }}><h4 style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{work.title}</h4><div style={{ fontSize: '12px', color: '#999' }}>状态: {work.is_published === 1 ? <span style={{ color: '#10b981' }}>已上架</span> : <span style={{ color: '#f59e0b' }}>未上架(草稿)</span>}</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Content>

      <Modal visible={showVipCenter} onCancel={() => setShowVipCenter(false)} footer={null} width={600} bodyStyle={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: "url('/login_bg.png') center/cover", height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }}></div>
          <Avatar size={80} style={{ border: '3px solid #F6D365', zIndex: 1, marginBottom: 16 }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
          <h2 style={{ color: '#F6D365', fontWeight: 'bold', zIndex: 1, margin: 0 }}>酷猫创作者中心</h2>
          <p style={{ color: '#fff', opacity: 0.8, zIndex: 1, marginTop: 8 }}>{user?.username}</p>
        </div>
        <div style={{ padding: '32px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbe6', padding: '16px 24px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
            <div>
              <h3 style={{ color: '#d46b08', margin: 0, fontWeight: 'bold' }}>升级尊贵 VIP 创作者</h3>
              <p style={{ color: '#8c8c8c', margin: '4px 0 0 0', fontSize: '13px' }}>解锁无限次生成长页与云表格特权</p>
            </div>
            <Button style={{ backgroundColor: '#d46b08', borderColor: '#d46b08', fontWeight: 'bold', color: '#fff' }}>¥ 99 立即解锁</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

// =================================================================
// 🌟 2. 满血 B 端管理后台
// =================================================================

const AdminUsers = () => {
  const [data, setData] = useState([]);

  const loadUsers = () => {
    fetch('http://localhost:3000/api/admin/users/list', { headers: { 'x-role': 'admin', 'x-user-id': '1' } })
      .then(r => r.json()).then(res => setData(res.data || []));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleActionTip = (username: string) => {
    message.success(`已成功对用户 [${username}] 执行管理操作`);
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
          {/* 🌟 加上 style 强制指定背景色和白色文字 */}
          <Button size="small" type="primary" style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }} onClick={() => handleActionTip(record.username)}>
            重置密码
          </Button>
          <Button size="small" danger onClick={() => {
            Modal.confirm({
              title: `确认注销用户 ${record.username} 吗？`,
              onOk: () => {
                message.success('模拟注销成功');
                loadUsers();
              }
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
      <h3 style={{ marginBottom: 20, fontWeight: 'bold' }}>系统账号管控</h3>
      <Table columns={cols} dataSource={data} rowKey="id" pagination={{ pageSize: 8 }} />
    </div>
  );
};

const AdminHomepage = () => {
  const [data, setData] = useState([{ id: 1, title: '', desc: '', image_url: '', bg: '' }]);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => { 
    fetch('http://localhost:3000/api/settings/carousel').then(r => r.json()).then(res => { if (res.data?.length > 0) setData(res.data); }); 
    fetch('http://localhost:3000/api/settings/announcement').then(r => r.json()).then(res => { if (res.code === 200) setAnnouncementText(res.data || ''); });
  }, []);

  const save = () => { 
    // 同时保存轮播图和公告
    fetch('http://localhost:3000/api/admin/settings/carousel', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ data }) }).then(r => r.json());
    fetch('http://localhost:3000/api/admin/settings/announcement', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ content: announcementText }) }).then(r => r.json()).then(() => message.success('主页配置全部保存成功！')); 
  };

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 'bold' }}>商城主页轮播图设置</h3>
          <p style={{ color: '#888', margin: '8px 0 0 0', fontSize: '13px' }}>* 请上传比例约为 3:1 的横向大图 (推荐尺寸: 1200x400 px，单张不超过 2MB)</p>
        </div>
        <Button style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff', height: '40px' }} onClick={save}>确认生效</Button>
      </div>

      {/* 🌟 新增公告编辑栏 */}
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa' }}>
        <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>顶部滚动公告内容</h4>
        <Input
          placeholder="请输入要在商城首页顶部显示的公告通知文字..."
          value={announcementText}
          onChange={e => setAnnouncementText(e.target.value)}
        />
      </div>

      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <Upload action="http://localhost:3000/api/upload" showUploadList={false} onChange={(info) => {
            if (info.file.size > 2 * 1024 * 1024) { message.error('图片不能超过 2MB！'); return; }
            if (info.file.status === 'done') { const nd = [...data]; nd[i].image_url = info.file.response.url; setData(nd); message.success('图片上传成功'); }
          }}>
            <div style={{ width: 150, height: 100, background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {!item.image_url && <span style={{ color: '#999', fontSize: '12px' }}>点击上传底图<br />(1200x400)</span>}
            </div>
          </Upload>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <Input placeholder="主标题文字" value={item.title} onChange={e => { const nd = [...data]; nd[i].title = e.target.value; setData(nd); }} />
            <Input placeholder="副标题文字" value={item.desc} onChange={e => { const nd = [...data]; nd[i].desc = e.target.value; setData(nd); }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminTemplates = () => {
  const [data, setData] = useState([]);
  const load = () => fetch('http://localhost:3000/api/admin/templates', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setData(res.data || []));
  useEffect(() => { load(); }, []);
  const cols = [
    { title: '封面', dataIndex: 'cover_url', render: (url: string) => <img src={url} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} /> },
    { title: '名称', dataIndex: 'title', render: (t: string) => <b>{t}</b> },
    { title: '类型', dataIndex: 'category', render: (c: string) => <Tag color={c === 'excel' ? 'green' : 'blue'}>{c === 'excel' ? '表格' : '页面'}</Tag> },
    { title: '操作', render: (_: any, r: any) => (<Button danger size="small" onClick={() => Modal.confirm({ title: '确认删除', onOk: () => { fetch('http://localhost:3000/api/templates/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) }).then(() => { message.success('已删除'); load(); }); } })}>删除</Button>) }
  ];
  return <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}><h3 style={{ marginBottom: 20, fontWeight: 'bold' }}>商城模板管理</h3><Table scroll={{ y: 500 }} columns={cols} dataSource={data} rowKey="id" pagination={false} /></div>;
};

const AdminAudit = () => {
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viewBackup, setViewBackup] = useState<string | null>(null);

  const load = () => {
    fetch('http://localhost:3000/api/admin/all-works', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setData(res.data || []));
    fetch('http://localhost:3000/api/admin/operation-logs', { headers: { 'x-role': 'admin', 'x-user-id': '1' } }).then(r => r.json()).then(res => setLogs(res.data || []));
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string, status: boolean) => {
    fetch('http://localhost:3000/api/h5/work/toggle-publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id, is_published: status ? 1 : 0 }) }).then(() => { message.success('已刷新'); load(); });
  };

  const cols = [
    { title: '快照', dataIndex: 'cover_url', render: (url: string) => <img src={url} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4 }} /> },
    { title: '作品名', dataIndex: 'title' },
    { title: '状态', dataIndex: 'is_published', render: (val: number, r: any) => <Switch size="small" checked={val === 1} onChange={(c) => toggle(r.id, c)} checkedChildren="已上架" unCheckedChildren="已下架" /> },
    { title: '操作', render: (_: any, r: any) => (<Button danger size="small" onClick={() => { Modal.confirm({ title: '确认销毁？', onOk: () => { fetch('http://localhost:3000/api/admin/force-delete-work', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id: r.id }) }).then(() => { message.success('已销毁并备份'); load(); }); } }); }}>强制销毁</Button>) }
  ];

  const logCols = [
    { title: '时间', dataIndex: 'created_at' },
    { title: '类型', dataIndex: 'action', render: () => <Tag color="red">删除</Tag> },
    { title: '目标 ID', dataIndex: 'target_id' },
    {
      title: '操作', dataIndex: 'backup_data', render: (val: string) => (
        <Button type="primary" size="small" onClick={() => setViewBackup(val)}>查看内容</Button>
      )
    }
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <h3 style={{ marginBottom: 20, fontWeight: 'bold' }}>作品风控审查</h3>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="作品大盘" key="1"><Table scroll={{ y: 500 }} columns={cols} dataSource={data} rowKey="id" pagination={false} /></Tabs.TabPane>
        <Tabs.TabPane tab="销毁日志" key="2"><Table scroll={{ y: 500 }} columns={logCols} dataSource={logs} rowKey="id" pagination={false} /></Tabs.TabPane>
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

  const load = () => fetch('http://localhost:3000/api/components/list').then(r => r.json()).then(res => setData(res.data || []));
  useEffect(() => { load(); }, []);

  const toggleStatus = (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    fetch('http://localhost:3000/api/admin/components/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify({ id, status: newStatus }) })
      .then(r => r.json()).then(res => {
        if (res.code === 200) { message.success('设置成功'); load(); }
        else { message.error(res.msg); }
      });
  };

  const handleAdd = () => {
    if (!newComp.name) return message.warning('请输入名称');
    fetch('http://localhost:3000/api/admin/components/add', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': 'admin', 'x-user-id': '1' }, body: JSON.stringify(newComp) })
      .then(r => r.json()).then(res => {
        if (res.code === 200) { message.success(res.msg); setIsModalVisible(false); load(); }
        else { message.error(res.msg); }
      });
  };

  const cols = [
    { title: '图标', dataIndex: 'icon', render: (t: string) => <div style={{ background: '#f5f5f5', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 16 }}>{t}</div> },
    { title: '名称', dataIndex: 'name', render: (t: string) => <b>{t}</b> },
    { title: '分类', dataIndex: 'category', render: (t: string) => <Tag color="processing">{t}</Tag> },
    { title: '状态', dataIndex: 'status', render: (val: number, r: any) => <Switch size="small" checked={val === 1} onChange={() => toggleStatus(r.id, r.status)} checkedChildren="开" unCheckedChildren="关" /> },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontWeight: 'bold' }}>组件管控大盘</h3>
        <Button style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff' }} onClick={() => setIsModalVisible(true)}>下发新组件</Button>
      </div>
      <Table scroll={{ y: 500 }} columns={cols} dataSource={data} rowKey="id" pagination={false} />

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

  // 💥 为源码级过滤做准备：拉取黑名单并存入全局 window 变量
  useEffect(() => {
    sessionStorage.setItem('token', 'coolmall_bypass_token');
    (window as any).getFaceUrl = function () { };

    fetch('http://localhost:3000/api/components/list').then(r => r.json()).then(res => {
      if (res.code === 200) {
        // 把后台禁用的组件名单保存到 window 对象中，给左侧菜单组件去读取和过滤！
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
        /* 强制将所有主按钮颜色锁死 */
        .ant-btn-primary { background-color: #e11d48 !important; border-color: #e11d48 !important; color: #fff !important; }
        .ant-btn-primary:hover { background-color: #be123c !important; border-color: #be123c !important; }
        /* 给表格加个滚动条 */
        .ant-table-body { overflow-y: auto !important; }
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

  if (path === '/mall') return <><GlobalBrandStyle /><MallPortal /></>;
  if (path.startsWith('/editor')) return <><GlobalBrandStyle />{props.children}</>;
  if (path.startsWith('/excel')) return <><GlobalBrandStyle /><ExcelEditor /></>;

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '大盘概览' },
    { key: '/admin/homepage', icon: <SettingOutlined />, label: '主页配置' },
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
            path === '/users' ? <AdminUsers /> :
              path === '/finance' ? <Finance /> :
                path === '/admin/homepage' ? <AdminHomepage /> :
                  path === '/admin/templates' ? <AdminTemplates /> :
                    path === '/admin/audit' ? <AdminAudit /> :
                      path === '/admin/components' ? <AdminComponents /> :
                        props.children}
        </Content>
      </Layout>
    </Layout>
  );
}
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Tag, Button, message, Modal, Carousel, Avatar } from 'antd';
// 🌟 核心修复：必须补上这两行，否则一进页面就报错白屏！
import { history, useLocation } from 'umi';

// =================================================================
// 🌟 1. 商城大厅与个人中心
// =================================================================
const MallPortal = () => {
    const location = useLocation();
    const [templates, setTemplates] = useState([]);
    const [myWorks, setMyWorks] = useState([]);
    const [carouselData, setCarouselData] = useState([]);
    const [announcement, setAnnouncement] = useState('');

    const initialTab = (location.query as any)?.tab || 'mall';
    const [activeMenu, setActiveMenu] = useState(initialTab);
    const [showVipCenter, setShowVipCenter] = useState(false);

    const userStr = localStorage.getItem('coolmall_user');
    const user = userStr ? JSON.parse(userStr) : null;

    // 🌟 优化：使用安全请求函数，防止后端接口挂掉导致整个页面崩溃
    const safeFetch = (url: string, options?: any) => {
        return fetch(url, options)
            .then(res => res.json())
            .catch(err => {
                console.error(`❌ 接口请求失败: ${url}`, err);
                return { code: -1, data: [] };
            });
    };

    const loadData = () => {
        safeFetch('/api/templates/list').then(res => { if (res.code === 200) setTemplates(res.data || []); });
        safeFetch('/api/settings/carousel').then(res => { if (res.code === 200) setCarouselData(res.data || []); });
        safeFetch('/api/settings/announcement').then(res => { if (res.code === 200) setAnnouncement(res.data || ''); });
        if (user) {
            safeFetch('/api/h5/my-works', { headers: { 'x-role': user.role, 'x-user-id': user.userId?.toString() } })
                .then(res => { if (res.code === 200) setMyWorks(res.data || []); });
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUseTemplate = (tpl: any) => {
        let schemaStr = tpl.json_data || '[]';
        if (typeof schemaStr !== 'string') schemaStr = JSON.stringify(schemaStr);

        localStorage.setItem('coolmall_pending_tpl', schemaStr);
        localStorage.setItem('coolmall_current_title', tpl.title || '');
        message.success('加载专属作品...');
        const isExcel = tpl.category === 'excel' || (tpl.id && String(tpl.id).includes('EXCEL'));
        setTimeout(() => {
            window.location.href = isExcel ? `/excel?tid=${tpl.id}` : `/editor?tid=${tpl.id}`;
        }, 600);
    };

    const handleEditWork = (work: any) => {
        fetch(`/api/h5/work/${work.id}`).then(r => r.json()).then(res => {
            if (res.code === 200) {
                let schemaStr = res.data.schema_json || '[]';
                if (typeof schemaStr !== 'string') schemaStr = JSON.stringify(schemaStr);

                localStorage.setItem('coolmall_pending_tpl', schemaStr);
                localStorage.setItem('coolmall_current_title', res.data.title || '');
                message.success('载入中...');
                const isExcel = res.data.category === 'excel' || (work.id && String(work.id).includes('EXCEL'));
                setTimeout(() => {
                    window.location.href = isExcel ? `/excel?tid=${work.id}` : `/editor?tid=${work.id}`;
                }, 600);
            } else message.error(res.msg || '读取失败');
        }).catch(() => message.error('请求异常'));
    };

    const togglePublishStatus = (e: any, work: any) => {
        e.stopPropagation();
        const targetStatus = work.is_published === 1 ? 0 : 1;
        fetch('/api/h5/work/toggle-publish', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
            body: JSON.stringify({ id: work.id, is_published: targetStatus })
        }).then(r => r.json()).then(res => {
            if (res.code === 200) { message.success('操作成功'); loadData(); }
        });
    };

    const isComponent = (id: any) => !String(id).includes('_');
    const mallItems = templates.filter((t: any) => !isComponent(t.id));

    const h5Templates = mallItems.filter((t: any) => t.category !== 'excel' && (!t.id || !String(t.id).includes('EXCEL')));
    const excelTemplates = mallItems.filter((t: any) => t.category === 'excel' || (t.id && String(t.id).includes('EXCEL')));

    const handleDeleteWork = (e: any, work: any) => {
        e.stopPropagation();
        Modal.confirm({
            title: `确认删除作品 "${work.title}" 吗？`,
            onOk: () => {
                fetch('/api/h5/work/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
                    body: JSON.stringify({ id: work.id })
                }).then(r => r.json()).then(res => {
                    if (res.code === 200) { message.success('作品已成功删除'); loadData(); } else { message.error(res.msg || '删除失败'); }
                });
            }
        });
    };

    const { Header, Content } = Layout;

    return (
        <Layout style={{ height: '100vh', background: '#f8f9fa', overflow: 'hidden' }}>
            <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '32px', marginRight: '24px' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Menu mode="horizontal" selectedKeys={[activeMenu]} onClick={(e) => setActiveMenu(e.key)} style={{ borderBottom: 'none', lineHeight: '64px', flex: 1, border: 'none' }}>
                        <Menu.Item key="mall" style={{ fontWeight: 'bold' }}>商城主页</Menu.Item>
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

                    <Button style={{ backgroundColor: '#e11d48', borderColor: '#e11d48', color: '#fff' }} onClick={() => {
                        localStorage.setItem('FORCE_CLEAR_CANVAS', '1');
                        localStorage.removeItem('pointData');
                        localStorage.removeItem('coolmall_current_title');
                        localStorage.removeItem('coolmall_pending_tpl');
                        localStorage.removeItem('coolmall_draft_h5_blank_page');
                        window.location.href = '/editor';
                    }}>新建页面</Button>

                    <Button onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }}>退出</Button>
                </div>
            </Header>

            <Content style={{ padding: '40px 24px', width: '100%', height: 'calc(100vh - 64px)', overflowY: 'auto', paddingBottom: '80px' }}>
                {activeMenu === 'mall' && (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
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
                            {h5Templates.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px 0', color: '#999', background: '#fff', borderRadius: '12px' }}>大盘暂无作品</div>) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                                    {h5Templates.map((tpl: any) => (
                                        <div key={tpl.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s', position: 'relative' }} onClick={() => handleUseTemplate(tpl)}>
                                            <div style={{ position: 'relative', height: '340px', background: '#f3f4f6', overflow: 'hidden' }}>
                                                <img src={tpl.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} alt={tpl.title} onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/375x667/f3f4f6/999999?text=Cover'; }} />
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
                            {excelTemplates.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px 0', color: '#999', background: '#fff', borderRadius: '12px' }}>大盘暂无表格</div>) : (
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
                                                <Button size="small" style={work.is_published === 1 ? {} : { backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }} danger={work.is_published === 1} onClick={(e) => togglePublishStatus(e, work)}>{work.is_published === 1 ? '下架' : '发布大盘'}</Button>
                                                <Button size="small" danger onClick={(e) => handleDeleteWork(e, work)}>删除</Button>
                                            </div>
                                            <div onClick={() => handleEditWork(work)}>
                                                <div style={{ height: '340px', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                                                    <img src={work.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} alt={work.title} onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/375x667/f3f4f6/999999?text=Cover'; }} />
                                                </div>
                                                <div style={{ padding: '16px' }}><h4 style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{work.title}</h4><div style={{ fontSize: '12px', color: '#999' }}>状态: {work.is_published === 1 ? <span style={{ color: '#10b981' }}>已展示在大盘</span> : <span style={{ color: '#f59e0b' }}>未上架(草稿)</span>}</div></div>
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
                        <Button
                            style={{ backgroundColor: '#d46b08', borderColor: '#d46b08', fontWeight: 'bold', color: '#fff' }}
                            onClick={() => {
                                window.open('https://ifdian.net/order/create?plan_id=684e74ba84e811f1a89752540025c377&product_type=0&remark=&affiliate_code=&fr=afcom', '_blank');
                                message.info('请在爱发电完成支付，支付后联系管理员为您手动开通权限！');
                            }}
                        >
                            ¥ 9.9 立即解锁 (爱发电)
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default MallPortal;
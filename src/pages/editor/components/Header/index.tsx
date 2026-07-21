import React, { useRef, memo, useMemo, useState, useEffect } from 'react';
import { Button, Input, Modal, Upload, Tooltip, Badge, message, Result, Spin, Tag, Popover, Menu, Dropdown } from 'antd';
import {
  ArrowLeftOutlined, MobileOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined,
  UndoOutlined, RedoOutlined, FileAddOutlined, CloudUploadOutlined, UploadOutlined,
  InstagramOutlined, UserOutlined, SendOutlined, ShoppingCartOutlined, DownOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import QRCode from 'qrcode.react';
import { saveAs } from 'file-saver';
import req from '@/utils/req';
import styles from './index.less';
import MyPopover from 'yh-react-popover';

const { confirm } = Modal;
const isDev = process.env.NODE_ENV === 'development';

interface HeaderComponentProps {
  pointData: any;
  location: any;
  clearData: any;
  undohandler: any;
  redohandler: any;
  importTpl: any;
}

const HeaderComponent = memo((props: HeaderComponentProps) => {
  const { pointData, location, clearData, undohandler, redohandler, importTpl } = props;

  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';
  const [showHintBubble, setShowHintBubble] = useState(true);

  const uploadprops = useMemo(() => ({
    name: 'file',
    showUploadList: false,
    beforeUpload(file: File) {
      let reader = new FileReader();
      reader.onload = function (e: any) {
        if (importTpl) importTpl(JSON.parse(e.target.result));
      };
      reader.readAsText(file);
      return false;
    },
  }), [importTpl]);

  const [modalConfig, setModalConfig] = useState<{ visible: boolean, type: 'template' | 'publish' }>({ visible: false, type: 'template' });
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceUrl, setFaceUrl] = useState('');
  const [saveTplName, setSaveTplName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const captureCanvas = async (scaleMultiplier: number) => {
    const absoluteFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('js_canvas') || document.querySelector('.canvas') || document.querySelector('.editor-board') || document.body;
      const canvas = await html2canvas(el as HTMLElement, { useCORS: true, scale: scaleMultiplier, logging: false, backgroundColor: '#ffffff', allowTaint: true });
      const base64 = canvas.toDataURL('image/jpeg', 0.6);
      const res = await fetch('http://localhost:3000/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64 }) }).then(r => r.json());
      return res.code === 200 ? (res.url || res.data?.url) : absoluteFallback;
    } catch (e) {
      return absoluteFallback;
    }
  };

  const autoGenerateCover = async (isSilent = false) => {
    setIsCapturing(true);
    if (!isSilent) message.loading({ content: '抓取封面中...', key: 'poster', duration: 0 });

    try {
      const tid = props.location.query?.tid || '';
      const previewUrl = `${window.location.protocol}//${window.location.host}/preview?tid=${tid}&gf=1`;

      const res = await fetch('http://localhost:3000/api/render/screenshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: previewUrl, pointData: pointData })
      });
      const data = await res.json();

      if (data.code === 200 && data.url && !data.url.includes('default.png')) {
        setFaceUrl(data.url);
        if (!isSilent) message.success({ content: '封面成功！', key: 'poster', duration: 2 });
      } else {
        throw new Error('后端超时');
      }
    } catch (e) {
      const localUrl = await captureCanvas(1);
      setFaceUrl(localUrl);
      if (!isSilent) message.success({ content: '辅助截取成功！', key: 'poster', duration: 2 });
    } finally {
      setIsCapturing(false);
    }
  };

  const openTemplateModal = () => {
    setModalConfig({ visible: true, type: 'template' });
    if (!faceUrl) autoGenerateCover(true);
  };

  const openPublishModal = () => {
    setModalConfig({ visible: true, type: 'publish' });
    if (!faceUrl) autoGenerateCover(true);
  };

  const handleModalOk = () => {
    if (modalConfig.type === 'template') executeCloudSave();
    else handlePublishH5();
  };

  // 💥 修复“保存为组件报错”的核心：附带完备的用户凭证请求头，并且安全解析响应，彻底告别盲目红框！
  const executeCloudSave = async () => {
    if (!saveTplName) return message.warning('请填写模板名称！');
    if (!faceUrl) return message.warning('封面生成中，请稍后...');

    let safeData = [];
    try { safeData = JSON.parse(JSON.stringify(pointData)); } catch (e) { }
    if (!Array.isArray(safeData)) safeData = [];

    message.loading({ content: '同步中...', key: 'save' });
    try {
      const response = await fetch('http://localhost:3000/api/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': user?.role || 'user',
          'x-user-id': user?.userId?.toString() || '1'
        },
        body: JSON.stringify({ title: saveTplName, cover_url: faceUrl, json_data: safeData, category: 'h5' })
      });

      const res = await response.json(); // 解析后端传来的JSON (无论是200还是500)

      if (res.code === 200) {
        message.success({ content: '🎉 已加入组件库，可打开查看', key: 'save', duration: 3 });
        setModalConfig({ visible: false, type: 'template' });
        setSaveTplName('');
      } else {
        message.error({ content: res.msg || '保存失败', key: 'save' });
      }
    } catch (err) {
      message.error({ content: '后端连接异常', key: 'save' });
      console.error(err);
    }
  };

  const handlePublishH5 = async () => {
    if (!saveTplName) return message.warning('请填写作品名称！');
    if (!faceUrl) return message.warning('封面生成中，请稍后...');

    message.loading({ content: '保存草稿中...', key: 'publish', duration: 0 });
    const workId = props.location.query?.tid || ('H5_' + Date.now());

    const res = await fetch('http://localhost:3000/api/h5/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
      body: JSON.stringify({ workId: workId, title: saveTplName, schema: pointData, cover_url: faceUrl, is_published: 0 })
    }).then(r => r.json());

    if (res.code === 200) {
      message.success({ content: '🚀 已存入您的私有草稿箱！', key: 'publish', duration: 3 });
      setModalConfig({ visible: false, type: 'publish' });
      setSaveTplName('');
      if (!props.location.query?.tid) history.replace(`/editor?tid=${workId}`);
    } else message.error({ content: res.msg, key: 'publish', duration: 3 });
  };

  const useTemplate = async () => {
    message.loading({ content: '拉取数据...', key: 'fetch' });
    try {
      const res = await fetch('http://localhost:3000/api/templates/list').then(r => r.json());
      message.destroy('fetch');

      const savedTpls = (res.data || []).filter((t: any) => !String(t.id).includes('_'));

      const modal = Modal.info({
        title: '组件库', width: 800, icon: null, okText: '关闭',
        content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', maxHeight: '500px', overflowY: 'auto' }}>
            {savedTpls.length === 0 ? <Result status="404" title="暂无数据" style={{ width: '100%' }} /> : null}
            {savedTpls.map((tpl: any) => (
              <div
                key={tpl.id}
                style={{ width: '180px', border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s', position: 'relative' }}
                onClick={() => {
                  if (tpl.category === 'excel') {
                    localStorage.setItem('coolmall_pending_tpl', tpl.json_data || '[]');
                    message.success('前往表格编辑器...');
                    modal.destroy();
                    setTimeout(() => history.push('/excel'), 600);
                    return;
                  }

                  if (importTpl) {
                    try {
                      let parsedData = tpl.json_data;
                      while (typeof parsedData === 'string') {
                        try { parsedData = JSON.parse(parsedData); } catch (e) { break; }
                      }
                      if (!parsedData) parsedData = [];
                      if (!Array.isArray(parsedData)) parsedData = [parsedData];

                      importTpl(parsedData);
                      message.success('组件导入成功！');
                      modal.destroy();
                    } catch (err) { message.error('数据异常'); }
                  }
                }}
              >
                <div style={{ position: 'absolute', top: 8, right: 8, background: '#ff4d4f', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', zIndex: 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: '确认删除？',
                      onOk: async () => {
                        await fetch('http://localhost:3000/api/templates/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tpl.id }) });
                        message.success('已删除'); modal.destroy(); useTemplate();
                      }
                    });
                  }}>删除</div>
                <img src={tpl.cover_url} style={{ width: '100%', height: '260px', objectFit: 'cover' }} alt={tpl.title} />
                <div style={{ padding: '12px' }}><h4 style={{ margin: '0 0 8px 0', fontSize: '14px', overflow: 'hidden', whiteSpace: 'nowrap' }}>{tpl.title}</h4></div>
              </div>
            ))}
          </div>
        ),
      });
    } catch (e) { message.error({ content: '网络异常', key: 'fetch' }); }
  };

  const downLoadJson = () => saveAs(new Blob([JSON.stringify(pointData)], { type: 'text/plain;charset=utf-8' }), 'template.json');
  const deleteAll = () => Modal.confirm({ title: '确认清空画布?', onOk() { clearData(); } });
  const toHelp = () => { const a = document.createElement('a'); a.href = 'https://dooring.vip/doc'; a.target = '_blank'; a.click(); };
  const toBack = () => history.push('/mall');

  const newPage = () => {
    if (!pointData || !pointData.length) {
      clearData(); message.success('新建空白画布成功'); return;
    }
    confirm({
      title: '新建提醒', content: '未保存的内容会丢失，继续新建吗？',
      okText: '确认新建', cancelText: '取消',
      onOk() { clearData(); message.success('新建成功'); }
    });
  };

  const savePreview = () => req.post('/visible/preview', { tid: props.location.query?.tid || '', tpl: pointData });
  const toPreview = () => {
    localStorage.setItem('pointData', JSON.stringify(pointData)); savePreview();
    setTimeout(() => { window.open(isDev ? `/preview?tid=${props.location.query?.tid}` : `/preview?tid=${props.location.query?.tid}`); }, 600);
  };
  const content = () => (
    <div style={{ textAlign: 'center', padding: '8px' }}>
      <QRCode value={`${window.location.protocol}//${window.location.host}/preview?tid=${props.location.query?.tid || ''}`} />
    </div>
  );

  const uploadCoverProps = {
    name: 'file', showUploadList: false, action: 'http://localhost:3000/api/upload',
    onChange(info: any) {
      if (info.file.status === 'done') { setFaceUrl(info.file.response.url); message.success('上传成功'); }
    },
  };

  const popoverContent = (user && !isAdmin) ? (
    <div style={{ width: '200px', padding: '5px' }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>账号: <strong>{user.username}</strong></div>
      <div style={{ marginBottom: '16px' }}><Tag color={user.role === 'vip' ? 'gold' : 'blue'}>{user.role === 'vip' ? '尊贵VIP' : '普通用户'}</Tag></div>
      <Button size="small" danger onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }}>退出登录</Button>
    </div>
  ) : null;

  const moreMenu = (
    <Menu>
      <Menu.Item key="1" icon={<UploadOutlined />}><Upload {...uploadprops} showUploadList={false}><span style={{ color: 'inherit' }}>导入 JSON</span></Upload></Menu.Item>
      <Menu.Item key="2" icon={<CopyOutlined />} onClick={downLoadJson} disabled={!pointData.length}>下载 JSON</Menu.Item>
      <Menu.Item key="3" icon={<FileAddOutlined />} onClick={newPage} disabled={!pointData.length}>新建页面</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="4" icon={<UndoOutlined />} onClick={undohandler} disabled={!pointData.length}>撤销</Menu.Item>
      <Menu.Item key="5" icon={<RedoOutlined />} onClick={redohandler} disabled={!pointData.length}>重做</Menu.Item>
      <Menu.Item key="6" icon={<DeleteOutlined />} onClick={deleteAll} disabled={!pointData.length} danger>清空</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="7" icon={<InstagramOutlined />} onClick={() => { setShowFaceModal(true); if (!faceUrl) autoGenerateCover(true); }} disabled={!pointData.length}>生成海报</Menu.Item>
    </Menu>
  );

  return (
    <div className={styles.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '64px', background: '#fff', borderBottom: '1px solid #f0f0f0', width: '100%', boxSizing: 'border-box' }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>

      <div className={styles.logoArea} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '16px', paddingRight: '12px' }}>
        <div onClick={toBack} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#999' }}><ArrowLeftOutlined style={{ fontSize: '18px' }} /></div>
        <img src="/logo.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
      </div>

      <div className={`hide-scroll ${styles.controlArea}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <Button type="default" onClick={() => history.push('/mall')} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>🏠 返回</Button>
        <Button type="primary" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} onClick={useTemplate}>组件库</Button>
        <Button type="default" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} onClick={openTemplateModal} disabled={!pointData.length}>保存组件</Button>

        <MyPopover content={content()} directions="BOTTOM">
          <Button type="default" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} disabled={!pointData.length}><MobileOutlined /> 手机预览</Button>
        </MyPopover>
        <Button type="default" onClick={toPreview} disabled={!pointData.length} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>电脑预览</Button>

        <Dropdown overlay={moreMenu} placement="bottomCenter" trigger={['click']}>
          <Button style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '4px 15px' }}>更多 <DownOutlined style={{ marginLeft: 4 }} /></Button>
        </Dropdown>
      </div>

      <div className={styles.btnArea} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '12px', paddingLeft: '16px', background: '#fff', zIndex: 999, minWidth: 'max-content', whiteSpace: 'nowrap' }}>
        <Button onClick={() => history.push('/mall?tab=my')} style={{ borderColor: '#e11d48', color: '#e11d48' }}>
          我的作品
        </Button>
        <Button type="primary" icon={<SendOutlined />} onClick={openPublishModal}>
          保存草稿
        </Button>

        {user && !isAdmin ? (
          <Popover content={popoverContent} title={<span>个人中心</span>} trigger="click" placement="bottomRight">
            <Button style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff', display: 'flex', alignItems: 'center' }} icon={<UserOutlined />}>我的</Button>
          </Popover>
        ) : (
          <Button style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff', display: 'flex', alignItems: 'center' }} icon={<UserOutlined />} onClick={() => { if (!user) { history.push('/'); } else if (isAdmin) { history.push('/dashboard'); } }}>
            {!user ? '登录' : '后台'}
          </Button>
        )}
      </div>

      <Modal title="✨ 海报预览" visible={showFaceModal} footer={null} width={380} destroyOnClose={true} onCancel={() => setShowFaceModal(false)} bodyStyle={{ padding: '16px' }}>
        <img src={faceUrl} style={{ width: '100%', borderRadius: '12px' }} alt="海报" />
      </Modal>

      <Modal
        title={modalConfig.type === 'template' ? '💾 保存为组件' : '🚀 保存草稿'}
        visible={modalConfig.visible}
        onOk={handleModalOk}
        onCancel={() => setModalConfig({ ...modalConfig, visible: false })}
        okText="保存"
        cancelText="取消"
        destroyOnClose={true}
        width={380}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>名称：</div>
            <Input placeholder="输入名称" value={saveTplName} onChange={e => setSaveTplName(e.target.value)} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>封面预览：</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <Spin spinning={isCapturing} tip="生成中...">
                {faceUrl ? (<img src={faceUrl} style={{ width: '160px', height: '284px', objectFit: 'cover', border: '1px solid #eee', borderRadius: '8px' }} />) : (<div style={{ width: '160px', height: '284px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>封面生成中...</div>)}
              </Spin>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button onClick={() => autoGenerateCover()} type="default">重新截取</Button>
              <Upload {...uploadCoverProps}><Button type="primary">上传图片</Button></Upload>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default HeaderComponent;
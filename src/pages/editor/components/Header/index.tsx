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

  const [modalConfig, setModalConfig] = useState<{ visible: boolean }>({ visible: false });
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceUrl, setFaceUrl] = useState('');

  // 🌟 自动读取来自商城的作品原名称
  const [saveTplName, setSaveTplName] = useState(localStorage.getItem('coolmall_current_title') || '');
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

  const openPublishModal = () => {
    setModalConfig({ visible: true });
    if (!faceUrl) autoGenerateCover(true);
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
      setModalConfig({ visible: false });
      if (!props.location.query?.tid) {
        window.location.href = `/editor?tid=${workId}`;
      }
    } else message.error({ content: res.msg, key: 'publish', duration: 3 });
  };

  const downLoadJson = () => saveAs(new Blob([JSON.stringify(pointData)], { type: 'text/plain;charset=utf-8' }), 'template.json');
  const deleteAll = () => Modal.confirm({ title: '确认清空画布?', onOk() { clearData(); } });
  const toBack = () => history.push('/mall');

  // 🌟 核心修复：彻底清理旧模板的一切根源缓存
  const executeNewPage = () => {
    clearData(); // 触发底层的清空，绝对不要加 window.location.href 强刷！
    setSaveTplName('');
    localStorage.removeItem('coolmall_current_title');
    localStorage.removeItem('pointData');
    localStorage.removeItem('coolmall_pending_tpl');

    // 只清理网址上的 ?tid=xxx，不刷新浏览器
    history.replace('/editor');
  };

  const newPage = () => {
    if (!pointData || !pointData.length) {
      executeNewPage();
      return;
    }
    confirm({
      title: '新建提醒', content: '未保存的内容会丢失，继续新建吗？', okText: '确认新建', cancelText: '取消',
      onOk() {
        executeNewPage();
      }
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
      <Menu.Item key="3" icon={<FileAddOutlined />} onClick={newPage}>新建页面</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="4" icon={<UndoOutlined />} onClick={undohandler} disabled={!pointData.length}>撤销</Menu.Item>
      <Menu.Item key="5" icon={<RedoOutlined />} onClick={redohandler} disabled={!pointData.length}>重做</Menu.Item>
      <Menu.Item key="6" icon={<DeleteOutlined />} onClick={deleteAll} disabled={!pointData.length} danger>清空</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="7" icon={<InstagramOutlined />} onClick={() => { setShowFaceModal(true); if (!faceUrl) autoGenerateCover(true); }} disabled={!pointData.length}>生成海报</Menu.Item>
    </Menu>
  );

  return (
    <div className={styles.header}>
      <div className={styles.logoArea}>
        <div onClick={toBack} className={styles.backBtn}><ArrowLeftOutlined style={{ fontSize: '18px', color: '#999' }} /></div>
        <div className={styles.logo}></div>

        {/* 🌟 配合 Less，这里已完美融入，不会再挤压右侧按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #eaeaea', paddingLeft: '16px', marginLeft: '16px' }}>
          <span style={{ color: '#999', fontSize: '13px', marginRight: '8px', whiteSpace: 'nowrap' }}>当前作品:</span>
          <Input
            value={saveTplName}
            onChange={e => setSaveTplName(e.target.value)}
            bordered={false}
            placeholder="未命名作品"
            style={{ width: '160px', fontWeight: 'bold', color: '#e11d48', padding: '0 4px', borderBottom: '1px dashed #e11d48', borderRadius: 0 }}
          />
        </div>
      </div>

      <div className={styles.controlArea}>
        <Button type="default" onClick={() => history.push('/mall')}>🏠 返回</Button>
        <MyPopover content={content()} directions="BOTTOM">
          <Button type="default" disabled={!pointData.length}><MobileOutlined /> 手机预览</Button>
        </MyPopover>
        <Button type="default" onClick={toPreview} disabled={!pointData.length}>电脑预览</Button>
        <Dropdown overlay={moreMenu} placement="bottomCenter" trigger={['click']}>
          <Button>更多 <DownOutlined style={{ marginLeft: 4 }} /></Button>
        </Dropdown>
      </div>

      <div className={styles.btnArea}>
        <Button onClick={() => history.push('/mall?tab=my')} style={{ borderColor: '#e11d48', color: '#e11d48' }}>
          我的作品
        </Button>
        <Button type="primary" icon={<SendOutlined />} onClick={openPublishModal}>
          发布到我的作品
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
        title={'🚀 保存草稿'}
        visible={modalConfig.visible}
        onOk={handlePublishH5}
        onCancel={() => setModalConfig({ ...modalConfig, visible: false })}
        okText="发布到我的作品"
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
                {faceUrl ? (<img src={faceUrl} style={{ width: '160px', height: '284px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '8px' }} />) : (<div style={{ width: '160px', height: '284px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>封面生成中...</div>)}
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
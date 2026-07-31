import React, { useRef, memo, useMemo, useState, useEffect } from 'react';
import { Button, Input, Modal, Upload, Tooltip, Badge, message, Result, Spin, Tag, Popover, Menu, Dropdown } from 'antd';
import {
  ArrowLeftOutlined, MobileOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined,
  UndoOutlined, RedoOutlined, FileAddOutlined, CloudUploadOutlined, UploadOutlined,
  InstagramOutlined, UserOutlined, SendOutlined, ShoppingCartOutlined, DownOutlined, AppstoreOutlined
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
  const [saveTplName, setSaveTplName] = useState(localStorage.getItem('coolmall_current_title') || '');
  const [isCapturing, setIsCapturing] = useState(false);

  // 🌟 降维打击 · Off-screen Rendering Pattern（离屏脱流沙盒模式）
  // 彻底摆脱当前窗口滚动条与可见高度约束，100% 从头部抓取至底端组件（含汽车图标）
  const captureCanvas = async (scaleMultiplier: number = 1.5) => {
    const absoluteFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    try {
      const html2canvas = (await import('html2canvas')).default;
      const originalEl = document.getElementById('js_canvas') || document.querySelector('.canvas');
      if (!originalEl) return absoluteFallback;

      const sourceEl = originalEl as HTMLElement;
      await document.fonts.ready;

      // 测算所有子组件的真实底部坐标
      let maxBottom = sourceEl.scrollHeight || 600;
      const canvasTop = sourceEl.getBoundingClientRect().top;

      sourceEl.querySelectorAll('*').forEach((node: any) => {
        if (node.getBoundingClientRect) {
          const rect = node.getBoundingClientRect();
          const bottomDistance = (rect.bottom - canvasTop) + sourceEl.scrollTop;
          if (bottomDistance > maxBottom) maxBottom = bottomDistance;
        }
      });

      if (pointData && pointData.length) {
        pointData.forEach((item: any) => {
          const itemBottom = (Number(item.top) || Number(item.y) || 0) + (Number(item.height) || Number(item.h) || 120);
          if (itemBottom > maxBottom) maxBottom = itemBottom;
        });
      }

      // 追加缓冲底部空间，彻底包裹下方元素
      const fullRenderHeight = Math.max(sourceEl.scrollHeight, Math.min(maxBottom + 80, 6000));
      const renderWidth = sourceEl.offsetWidth || 375;

      // 1. 在屏幕看不见的左侧构建不受父级 overflow 约束的离屏沙盒
      const sandbox = document.createElement('div');
      sandbox.id = 'coolmall-offscreen-sandbox';
      sandbox.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${renderWidth}px;
        height: ${fullRenderHeight}px;
        overflow: visible;
        z-index: -9999;
        background: #ffffff;
      `;

      const cloneEl = sourceEl.cloneNode(true) as HTMLElement;
      cloneEl.style.cssText = `
        width: ${renderWidth}px !important;
        height: ${fullRenderHeight}px !important;
        min-height: ${fullRenderHeight}px !important;
        max-height: none !important;
        overflow: visible !important;
        position: relative !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
      sandbox.appendChild(cloneEl);
      document.body.appendChild(sandbox);

      // 2. 对离屏完整长图直接进行绘制
      const canvas = await html2canvas(cloneEl, {
        useCORS: true,
        allowTaint: false,
        scale: scaleMultiplier,
        logging: false,
        backgroundColor: '#ffffff',
        width: renderWidth,
        height: fullRenderHeight,
        windowWidth: renderWidth,
        windowHeight: fullRenderHeight,
        scrollY: 0,
        scrollX: 0,
      });

      document.body.removeChild(sandbox);

      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      }).then(r => r.json());

      return res.code === 200 ? (res.url || res.data?.url) : absoluteFallback;
    } catch (e) {
      console.error("Cover capture error:", e);
      const existingSandbox = document.getElementById('coolmall-offscreen-sandbox');
      if (existingSandbox) document.body.removeChild(existingSandbox);
      return absoluteFallback;
    }
  };

  const autoGenerateCover = async (isSilent = false) => {
    setIsCapturing(true);
    if (!isSilent) message.loading({ content: '抓取封面中...', key: 'poster', duration: 0 });

    try {
      const localUrl = await captureCanvas(1.5);
      setFaceUrl(localUrl);
      if (!isSilent) message.success({ content: '封面成功！', key: 'poster', duration: 2 });
    } catch (e) {
      if (!isSilent) message.error({ content: '封面生成异常，请重试', key: 'poster', duration: 2 });
    } finally {
      setIsCapturing(false);
    }
  };

  const openPublishModal = () => {
    setModalConfig({ visible: true });
    autoGenerateCover(true);
  };

  const handlePublishH5 = async () => {
    if (!saveTplName) return message.warning('请填写作品名称！');
    if (!faceUrl) {
      message.warning('封面尚未生成，请稍后...');
      return;
    }
    if (!pointData || pointData.length === 0) {
      message.warning('画布为空，请添加组件');
      return;
    }

    message.loading({ content: '正在发布到我的作品...', key: 'publish', duration: 0 });
    const workId = props.location.query?.tid || ('H5_' + Date.now());

    const res = await fetch('/api/h5/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role': user?.role || 'user',
        'x-user-id': user?.userId?.toString() || '1'
      },
      body: JSON.stringify({
        workId: workId,
        title: saveTplName,
        schema: pointData,
        cover_url: faceUrl,
        is_published: 1
      })
    }).then(r => r.json());

    if (res.code === 200) {
      message.success({ content: '🚀 已成功发布到我的作品！', key: 'publish', duration: 3 });
      setModalConfig({ visible: false });
      history.push('/mall?tab=my');
    } else {
      message.error({ content: res.msg || '发布失败', key: 'publish', duration: 3 });
    }
  };

  const downLoadJson = () => saveAs(new Blob([JSON.stringify(pointData)], { type: 'text/plain;charset=utf-8' }), 'template.json');
  const deleteAll = () => Modal.confirm({ title: '确认清空画布?', onOk() { clearData(); } });
  const toBack = () => history.push('/mall');

  const executeNewPage = () => {
    clearData();
    setSaveTplName('');
    localStorage.removeItem('coolmall_current_title');
    localStorage.removeItem('pointData');
    localStorage.removeItem('coolmall_pending_tpl');
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
    name: 'file', showUploadList: false, action: '/api/upload',
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
      <Menu.Item key="7" icon={<InstagramOutlined />} onClick={() => { setShowFaceModal(true); if (!faceUrl) autoGenerateCover(true); }} disabled={!pointData.length}>生成海报</Menu.Item>
    </Menu>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 16px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #f0f0f0',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '10px' }}>
        <div onClick={toBack} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
          <ArrowLeftOutlined style={{ fontSize: '16px', color: '#666' }} />
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#e11d48', whiteSpace: 'nowrap' }}>CoolMall 引擎</div>
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #eaeaea', paddingLeft: '8px' }}>
          <span style={{ color: '#999', fontSize: '12px', marginRight: '4px', whiteSpace: 'nowrap' }}>当前作品:</span>
          <Input
            value={saveTplName}
            onChange={e => setSaveTplName(e.target.value)}
            bordered={false}
            placeholder="未命名作品"
            style={{ width: '130px', fontWeight: 'bold', color: '#e11d48', borderBottom: '1px dashed #e11d48', borderRadius: 0 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <Button size="small" onClick={undohandler} disabled={!pointData.length} icon={<UndoOutlined />}>撤销</Button>
        <Button size="small" onClick={redohandler} disabled={!pointData.length} icon={<RedoOutlined />}>重做</Button>
        <Button size="small" onClick={deleteAll} disabled={!pointData.length} danger icon={<DeleteOutlined />}>清空</Button>

        <div style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 2px' }}></div>

        <MyPopover content={content()} directions="BOTTOM">
          <Button size="small" disabled={!pointData.length}><MobileOutlined /> 手机预览</Button>
        </MyPopover>
        <Button size="small" onClick={toPreview} disabled={!pointData.length}>电脑预览</Button>
        <Dropdown overlay={moreMenu} placement="bottomCenter" trigger={['click']}>
          <Button size="small">更多 <DownOutlined style={{ marginLeft: 2 }} /></Button>
        </Dropdown>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Button size="small" onClick={() => history.push('/mall?tab=my')} style={{ borderColor: '#e11d48', color: '#e11d48' }}>
          我的作品
        </Button>
        <Button size="small" type="primary" icon={<SendOutlined />} onClick={openPublishModal}>
          发布作品
        </Button>

        {isAdmin ? (
          <Button
            size="small"
            style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff', fontWeight: 'bold' }}
            icon={<AppstoreOutlined />}
            onClick={() => history.push('/dashboard')}
          >
            后台管理
          </Button>
        ) : user ? (
          <Popover content={popoverContent} title={<span>个人中心</span>} trigger="click" placement="bottomRight">
            <Button size="small" style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff' }} icon={<UserOutlined />}>我的</Button>
          </Popover>
        ) : (
          <Button
            size="small"
            style={{ backgroundColor: '#111827', borderColor: '#111827', color: '#fff' }}
            icon={<UserOutlined />}
            onClick={() => history.push('/')}
          >
            登录
          </Button>
        )}

        <Button size="small" onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }}>
          退出
        </Button>
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
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px 0' }}>
              <Spin spinning={isCapturing} tip="生成中...">
                {faceUrl ? (
                  <div style={{
                    width: '180px',
                    height: '280px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={faceUrl}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'top center'
                      }}
                      alt="封面预览"
                    />
                  </div>
                ) : (
                  <div style={{ width: '180px', height: '280px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    封面生成中...
                  </div>
                )}
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
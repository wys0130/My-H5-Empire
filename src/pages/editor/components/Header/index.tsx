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

// 🌟 辅助工具：将网络图片安全转换为 Base64，彻底破解跨域 CDN 导致 canvas 截图空白的问题
const urlToBase64 = async (url: string): Promise<string> => {
  if (!url || url.startsWith('data:')) return url;
  try {
    // 1. 优先尝试 fetch 转 blob -> base64
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // 2. 如果 fetch 受到严格 CORS 限制，降级使用 Image + Canvas 读取
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve(url); // 兜底：原样放行，不卡死程序
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }
};

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

  // 🌟 降维打击 · Off-screen Full-Height Sandbox Pattern（离屏无限高沙盒长画卷截屏）：
  // 彻底脱离编辑器可视区域与 overflow 限制，从坐标 Y:0 抓到 Y:maxBottom，底部图标一毫不漏！
  const captureCanvas = async (scaleMultiplier: number = 1.0) => {
    const absoluteFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    try {
      const html2canvas = (await import('html2canvas')).default;
      const targetEl = document.getElementById('js_canvas') || document.querySelector('.canvas');
      if (!targetEl) return absoluteFallback;

      const sourceEl = targetEl as HTMLElement;
      await document.fonts.ready;

      // 1. 测算画面中最底层子节点（包含汽车图标）的极限绝对底坐标
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

      // 底部追加 60px 舒适边距，确保最低端图标100%全在画框内
      const renderHeight = Math.max(sourceEl.scrollHeight, Math.min(maxBottom + 60, 6000));
      const renderWidth = sourceEl.offsetWidth || 375;

      // 🌟 2. Pattern 核心：建立不受可视窗口边界和样式裁切的绝对离屏容器
      const sandbox = document.createElement('div');
      sandbox.id = 'coolmall-offscreen-sandbox';
      sandbox.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: ${renderWidth}px;
        height: ${renderHeight}px;
        overflow: visible !important;
        z-index: -99999;
        background: #ffffff;
      `;

      const cloneEl = sourceEl.cloneNode(true) as HTMLElement;
      cloneEl.style.cssText = `
        width: ${renderWidth}px !important;
        height: ${renderHeight}px !important;
        min-height: ${renderHeight}px !important;
        max-height: none !important;
        overflow: visible !important;
        position: relative !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
      sandbox.appendChild(cloneEl);
      document.body.appendChild(sandbox);

      // 🌟 3. 在克隆树中递归向上解开每个包装节点的 clip，对长卷一击抓取
      const canvas = await html2canvas(cloneEl, {
        useCORS: true,
        allowTaint: false,
        scale: scaleMultiplier,
        logging: false,
        backgroundColor: '#ffffff',
        width: renderWidth,
        height: renderHeight,
        windowWidth: 1440,
        windowHeight: renderHeight + 1000,
        scrollY: 0,
        scrollX: 0,
        onclone: (clonedDoc: Document) => {
          const clonedTarget = clonedDoc.getElementById('coolmall-offscreen-sandbox');
          if (!clonedTarget) return;
          let curr: HTMLElement | null = clonedTarget as HTMLElement;
          while (curr && curr !== clonedDoc.body) {
            curr.style.overflow = 'visible';
            curr.style.height = 'auto';
            curr.style.maxHeight = 'none';
            curr = curr.parentElement;
          }
        }
      });

      document.body.removeChild(sandbox);

      // 🌟 4. 将全高长图进行 200px 宽度等比超高压缩！将旧封面的 150KB 暴力压平到 ~5KB！
      const thumbCanvas = document.createElement('canvas');
      const thumbWidth = 200;
      const thumbHeight = Math.round((renderHeight / renderWidth) * thumbWidth);
      thumbCanvas.width = thumbWidth;
      thumbCanvas.height = thumbHeight;
      const ctx = thumbCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, thumbWidth, thumbHeight);
        ctx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
      }

      const compressedBase64 = thumbCanvas.toDataURL('image/jpeg', 0.6);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedBase64 })
      }).then(r => r.json());

      return res.code === 200 ? (res.url || res.data?.url) : absoluteFallback;
    } catch (e) {
      console.error("Cover capture error:", e);
      const existingSandbox = document.getElementById('coolmall-offscreen-sandbox');
      if (existingSandbox) document.body.removeChild(existingSandbox);
      return absoluteFallback;
    }
  };

  // 🌟 2. 纯前端渲染截图，去掉超时卡顿的远端请求
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

  // 🌟 3. 每次点“发布作品”，无条件把刚修改过的内容重新截一遍！
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

    // 🌟 核心修正：is_published 设为 1，直接存入“我的作品”，由你自主掌控上下架、编辑、删除！
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
        is_published: 1 // 1 代表正式发布至“我的作品”大盘
      })
    }).then(r => r.json());

    if (res.code === 200) {
      message.success({ content: '🚀 已成功发布到我的作品！', key: 'publish', duration: 3 });
      setModalConfig({ visible: false });
      history.push('/mall?tab=my'); // 自动跳转至我的作品页
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
    // 🌟 100% 紧凑布局：去掉旧版 minWidth，改为 width: 100% 与合适间距，保证所有按钮单行展平不换行！
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
      {/* 🔴 左侧区：返回按钮 + 品牌 + 作品名称设置 */}
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

      {/* 🟡 中央操作区：撤销/重做/清空/预览 */}
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

      {/* 🟢 右侧收尾区：只保留唯一的一颗登录/我的/后台管理按钮，彻底解决重复显出两颗“后台” */}
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

      {/* 封面海报模态框与草稿弹窗 */}
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
                  /* 🌟 改为 contain + 灰底：不裁减长图的一分一毫，完整呈现整页画布 */
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
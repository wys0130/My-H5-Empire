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

  // 🌟 1. 精准抓取真正画布白纸，强制设置白色背景，杜绝灰底与裁剪不全！
  const captureCanvas = async (scaleMultiplier: number) => {
    const absoluteFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    try {
      const html2canvas = (await import('html2canvas')).default;
      // 优先抓取真实的画布容器，绝不抓取带有灰色背景的外部容器
      const el = document.getElementById('js_canvas') || document.querySelector('.canvas') || document.body;
      const canvas = await html2canvas(el as HTMLElement, {
        useCORS: true,
        scale: scaleMultiplier,
        logging: false,
        backgroundColor: '#ffffff', // 强制指定纯白底，绝不留灰！
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      });
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      }).then(r => r.json());
      return res.code === 200 ? (res.url || res.data?.url) : absoluteFallback;
    } catch (e) {
      return absoluteFallback;
    }
  };

  // 🌟 2. 去除不稳定的远程API截图，内外网一致走高效前端渲染
  const autoGenerateCover = async (isSilent = false) => {
    setIsCapturing(true);
    if (!isSilent) message.loading({ content: '正在更新真实封面...', key: 'poster', duration: 0 });

    try {
      const localUrl = await captureCanvas(1.5);
      setFaceUrl(localUrl);
      if (!isSilent) message.success({ content: '封面截图已更新！', key: 'poster', duration: 2 });
    } catch (e) {
      if (!isSilent) message.error({ content: '封面生成异常，请重试', key: 'poster', duration: 2 });
    } finally {
      setIsCapturing(false);
    }
  };

  // 🌟 3. 核心修改：无论是否有旧封面，只要用户点击发布，强制根据画布最新内容重新截图！
  const openPublishModal = () => {
    setModalConfig({ visible: true });
    autoGenerateCover(true); // <--- 去掉了 if (!faceUrl) 判断，永远生成最新稿！
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

    message.loading({ content: '保存草稿中...', key: 'publish', duration: 0 });
    const workId = props.location.query?.tid || ('H5_' + Date.now());

    const res = await fetch('/api/h5/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
      body: JSON.stringify({ workId: workId, title: saveTplName, schema: pointData, cover_url: faceUrl, is_published: 0 })
    }).then(r => r.json());

    if (res.code === 200) {
      message.success({ content: '🚀 已存入您的私有草稿箱！', key: 'publish', duration: 3 });
      setModalConfig({ visible: false });
      history.push('/mall?tab=my');
    } else message.error({ content: res.msg, key: 'publish', duration: 3 });
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
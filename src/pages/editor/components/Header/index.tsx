import React, { useRef, memo, useMemo, useState, useEffect } from 'react';
import { Button, Input, Modal, Upload, Tooltip, Badge, message, Result, Spin, Tag, Popover } from 'antd';
import {
  ArrowLeftOutlined, MobileOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined,
  UndoOutlined, RedoOutlined, FileAddOutlined, CloudUploadOutlined, UploadOutlined,
  InstagramOutlined, UserOutlined, SendOutlined, ShoppingCartOutlined
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

  // 🌟 解析当前用户信息，用于判断是显示后台还是显示沙箱
  const userStr = localStorage.getItem('coolmall_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';
  // 🌟 新增：控制气泡提示的开关
  const [showHintBubble, setShowHintBubble] = useState(true);

  // 定义导入按钮的配置
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

  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceUrl, setFaceUrl] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTplName, setSaveTplName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // ==========================================
  // 🚀 终极性能优化版截图引擎
  // ==========================================
  const captureCanvas = async (scaleMultiplier: number) => {
    const el = document.getElementById('js_canvas') || document.querySelector('.canvas');
    if (!el) {
      message.warning('⚠️ 未找到画布！');
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      setIsCapturing(true);
      const canvas = await html2canvas(el as HTMLElement, {
        useCORS: true,
        scale: scaleMultiplier,
        logging: false,
        backgroundColor: '#ffffff',
        // 关键点：加上这两个参数，让截图引擎遇到加载失败的图片时直接跳过，而不是报错停止
        allowTaint: true,
        ignoreElements: (element) => {
          // 如果这不仅仅是普通的 HTML 元素，你可以加逻辑忽略某些特定的报错元素
          return false;
        }
      });

      const base64 = canvas.toDataURL('image/jpeg', 0.6);

      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      }).then(r => r.json());

      setIsCapturing(false);
      return res.code === 200 ? (res.url || res.data?.url) : null;
    } catch (e) {
      setIsCapturing(false);
      // 报错了也不要弹窗提示，避免干扰
      console.error('截图时遇到部分资源加载失败，已自动跳过:', e);
      return null;
    }
  };

  // ==========================================
  // 🛡️ 核心优化 2：保存模板 (精准捕获你的图4保存报错)
  // ==========================================
  const executeCloudSave = async () => {
    if (!saveTplName) return message.warning('请填写模板名称！');
    if (!faceUrl) return message.warning('请先截取画布封面！');

    message.loading({ content: '正在同步至云端...', key: 'save' });

    try {
      const response = await fetch('http://localhost:3000/api/templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: saveTplName,
          cover_url: faceUrl,
          json_data: pointData,
          category: 'h5'
        })
      });

      // 如果后端崩溃返回 HTML(如500错误)，这里会拦截，避免抛出“网络错误”的假象
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const res = await response.json();
      if (res.code === 200) {
        message.success({ content: '🎉 模板已安全保存至酷猫云端！', key: 'save' });
        setIsSaveModalOpen(false);
        setSaveTplName('');
      } else {
        message.error({ content: res.msg, key: 'save' });
      }
    } catch (err: any) {
      // 💡 真正的报错原因会在这里打印出来！
      console.error("保存失败底层原因:", err);
      message.error({ content: '无法连接后端或接口报错，请检查后端运行状态', key: 'save' });
    }
  };

  // 🌟 修复位置：覆盖原有的 useTemplate 函数
  // 🌟 修复位置：覆盖原有的 useTemplate 函数 (带删除功能与终极解析防崩)
  const useTemplate = async () => {
    message.loading({ content: '正在拉取大厅数据...', key: 'fetch' });
    try {
      const res = await fetch('http://localhost:3000/api/templates/list').then(r => r.json());
      message.destroy('fetch');
      const savedTpls = res.data || [];

      const modal = Modal.info({
        title: '📚 酷猫云端模板资产库 (支持增删改查)',
        width: 800,
        icon: null,
        okText: '关闭',
        content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', maxHeight: '500px', overflowY: 'auto' }}>
            {savedTpls.length === 0 ? <Result status="404" title="空空如也" subTitle="还没有模板，快去制作一个吧！" style={{ width: '100%' }} /> : null}
            {savedTpls.map((tpl: any) => (
              <div
                key={tpl.id}
                // 🌟 必须加 position: 'relative'，否则删除按钮没法定位在右上角
                style={{ width: '180px', border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s', position: 'relative' }}
                // 🌟 找到这个 onClick，全量替换里面的内容
                onClick={() => {
                  if (importTpl) {
                    try {
                      // 1. 尝试解开数据的伪装
                      let parsedData = tpl.json_data;
                      if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
                      if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);

                      // 🌟 2. 极客降维打击：数据边界清洗护盾！
                      // 如果解开后发现它根本不是数组（脏数据），直接拦截，绝不放行给画布！
                      if (!Array.isArray(parsedData)) {
                        message.error('⚠️ 警告：该模板底层数据已损坏或为空，系统已拦截崩溃！请点击右上角删除它。');
                        return; // 强行切断，不执行导入
                      }

                      // 3. 只有真正干净的数组数据，才允许导入
                      importTpl(parsedData);
                      message.success('模板应用成功！');
                      modal.destroy();
                    } catch (err) {
                      message.error('模板数据解析失败，可能是旧的脏数据');
                    }
                  }
                }}
              >
                {/* 🌟 核心修复：右上角悬浮删除按钮 */}
                <div
                  style={{ position: 'absolute', top: 8, right: 8, background: '#ff4d4f', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', zIndex: 10, fontWeight: 'bold' }}
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止冒泡：点删除时，不会触发背后的“应用模板”
                    Modal.confirm({
                      title: '危险操作',
                      content: '确认永久删除此模板吗？删除后不可恢复！',
                      onOk: async () => {
                        await fetch('http://localhost:3000/api/templates/delete', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tpl.id })
                        });
                        message.success('删除成功');
                        modal.destroy(); // 先关掉旧弹窗
                        useTemplate();   // 重新拉取并打开最新数据弹窗
                      }
                    });
                  }}
                >
                  删除
                </div>

                <img src={tpl.cover_url} style={{ width: '100%', height: '260px', objectFit: 'cover' }} alt={tpl.title} />
                <div style={{ padding: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.title}</h4>
                  <div style={{ color: '#999', fontSize: '12px' }}>{tpl.date}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      });
    } catch (e) {
      message.error({ content: '无法连接到后端服务器', key: 'fetch' });
    }
  };

  // ==========================================
  // ⚡ 核心优化 3：一键发布 (对接你后端的真实 H5 发布逻辑)
  // ==========================================
  // 直接发 JSON 给后端，前端再也不管截图这回事了
  const handlePublish = async () => {
    message.loading('正在发布，后台渲染中...');
    const res = await fetch('http://localhost:3000/api/h5/publish', {
      method: 'POST',
      body: JSON.stringify({
        data: pointData, // 传 JSON
        title: '我的作品'
      })
    });
    // 后端直接返回渲染好的封面 URL，前端只管展示
    const result = await res.json();
    message.success('发布成功！');
  };

  // 其他控件...
  const downLoadJson = () => saveAs(new Blob([JSON.stringify(pointData)], { type: 'text/plain;charset=utf-8' }), 'template.json');
  const deleteAll = () => Modal.confirm({ title: '确认清空画布?', onOk() { clearData(); } });
  // 🌟 修复位置：覆盖原有的 toHelp 函数，绕过浏览器的弹窗拦截
  const toHelp = () => {
    const a = document.createElement('a');
    a.href = 'https://dooring.vip/doc';
    a.target = '_blank';
    a.click();
  };
  const toBack = () => history.push('/');

  // 🌟 换成这个新版本的 newPage 函数
  const newPage = () => {
    if (!pointData || !pointData.length) {
      // 如果画布本来就是空的，直接放行
      clearData();
      message.success('已为您生成干净的全新画布');
      return;
    }

    // 如果画布有东西，拦截并警告，必须起名字存盘，防止资产丢失！
    confirm({
      title: '⚠️ 正在新建画布',
      content: '新建画布会清空当前内容。为了防止您的旧网页丢失，请先点击“保存模板”将当前网页存入【模板库】，再点击新建。是否确认直接清空？',
      okText: '强制新建(不保存)',
      cancelText: '去保存旧网页',
      onOk() {
        clearData();
        message.success('已清空并新建画布');
      },
      onCancel() {
        // 自动帮用户唤起保存云端模板的弹窗
        setIsSaveModalOpen(true);
      }
    });
  };

  const savePreview = () => req.post('/visible/preview', { tid: props.location.query?.tid || '', tpl: pointData });
  const toPreview = () => {
    localStorage.setItem('pointData', JSON.stringify(pointData));
    savePreview();
    setTimeout(() => { window.open(isDev ? `/preview?tid=${props.location.query?.tid}` : `/preview?tid=${props.location.query?.tid}`); }, 600);
  };
  const content = () => <QRCode value={`${window.location.protocol}//${window.location.host}/preview?tid=${props.location.query?.tid || ''}`} />;

  // 替换成这个上传逻辑，后端 API 依然用你已有的 /api/upload
  const uploadCoverProps = {
    name: 'file',
    showUploadList: false,
    action: 'http://localhost:3000/api/upload',
    onChange(info: any) {
      if (info.file.status === 'done') {
        setFaceUrl(info.file.response.url);
        message.success('封面上传成功');
      }
    },
  };

  // 1. 补上缺失的 generatePoster 函数
  // 🌟 修复位置：覆盖原有的 generatePoster 函数
  // 🌟 修复位置：覆盖原有的 generatePoster 函数
  const generatePoster = async () => {
    message.loading({ content: '正在调用后端引擎渲染，请稍候...', key: 'poster', duration: 0 });

    try {
      // 🌟 核心修复 1：在网址末尾加上 &gf=1，这会触发咱们之前写好的“隐藏返回按钮”逻辑！
      const tid = props.location.query?.tid || '';
      const previewUrl = `${window.location.protocol}//${window.location.host}/preview?tid=${tid}&gf=1`;

      const res = await fetch('http://localhost:3000/api/render/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: previewUrl, pointData: pointData })
      }).then(r => r.json());

      if (res.code === 200) {
        setFaceUrl(res.url);
        setShowFaceModal(true);
        message.success({ content: '海报生成成功', key: 'poster', duration: 2 });
      } else {
        message.error({ content: '后端截图失败: ' + res.msg, key: 'poster', duration: 3 });
      }
    } catch (e) {
      message.error({ content: '无法连接后端截图服务，请检查后端是否开启', key: 'poster', duration: 3 });
    }
  };

  // 2. 补上缺失的 handlePublishH5 函数
  const handlePublishH5 = async () => {
    message.loading('发布中...');
    const res = await fetch('http://localhost:3000/api/h5/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
      body: JSON.stringify({ workId: 'H5_' + Date.now(), title: '作品', schema: pointData })
    }).then(r => r.json());
    if (res.code === 200) message.success('发布成功');
    else message.error(res.msg);
  };

  // 🌟 核心：构造悬浮个人中心的内容面板，完美解决遮挡问题
  const popoverContent = (user && !isAdmin) ? (
    <div style={{ width: '240px', padding: '5px' }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>当前账号: <strong>{user.username}</strong></div>
      <div style={{ marginBottom: '16px' }}>
        <Tag color={user.role === 'vip' ? 'gold' : 'blue'}>
          {user.role === 'vip' ? '尊贵付费 VIP' : '免费普通创作者'}
        </Tag>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Button
          size="small"
          icon={<ShoppingCartOutlined />}
          onClick={() => message.info('发起模拟支付请求...')}
          disabled={user.role === 'vip'}
          style={user.role === 'vip' ? { background: '#f5f5f5', color: '#d46b08', borderColor: '#d9d9d9', pointerEvents: 'none' } : { background: '#d46b08', color: '#fff', borderColor: '#d46b08' }}
        >
          {user.role === 'vip' ? '您已成功订购VIP' : '模拟购买商品 (支付¥99)'}
        </Button>
        <Button type="primary" size="small" icon={<CloudUploadOutlined />} onClick={handlePublishH5}>
          模拟保存并发布资产
        </Button>
        <Button size="small" type="dashed" danger onClick={() => { localStorage.removeItem('coolmall_user'); history.push('/'); }}>
          安全退出，换账号登录
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.header}>
      <div className={styles.logoArea}>
        <div className={styles.backBtn} onClick={toBack}><ArrowLeftOutlined /></div>
        <div className={styles.logo}></div>
      </div>
      <div className={styles.controlArea}>
        <Button type="primary" style={{ marginRight: '9px' }} onClick={useTemplate}>模版库</Button>
        <Button type="link" style={{ marginRight: '9px' }} onClick={() => setIsSaveModalOpen(true)} disabled={!pointData.length}>保存模版</Button>
        <Upload {...uploadprops}>
          <Button type="link" style={{ marginRight: '8px' }} title="导入数据"><UploadOutlined /></Button>
        </Upload>
        <Button type="link" style={{ marginRight: '9px' }} title="下载json文件" onClick={downLoadJson} disabled={!pointData.length}><CopyOutlined /></Button>
        <Button type="link" style={{ marginRight: '9px' }} title="新建页面" onClick={newPage} disabled={!pointData.length}><FileAddOutlined /></Button>
        <MyPopover content={content()} directions="BOTTOM">
          <Button type="link" style={{ marginRight: '9px' }} onClick={savePreview} disabled={!pointData.length} title="手机扫码预览"><MobileOutlined /></Button>
        </MyPopover>
        <Button type="link" style={{ marginRight: '9px' }} title="清空画布" onClick={deleteAll} disabled={!pointData.length}><DeleteOutlined /></Button>
        <Button type="link" style={{ marginRight: '9px' }} title="撤销" onClick={undohandler} disabled={!pointData.length}><UndoOutlined /></Button>
        <Button type="link" style={{ marginRight: '9px' }} title="重做" onClick={redohandler}><RedoOutlined /></Button>
        <Tooltip placement="bottom" title="一键生成超清海报">
          <Badge dot offset={[-18, 10]}>
            <Button type="link" style={{ marginRight: '6px' }} onClick={generatePoster} disabled={!pointData.length}><InstagramOutlined /></Button>
          </Badge>
        </Tooltip>
        <Button type="link" onClick={toPreview} disabled={!pointData.length}>预览</Button>
        <Button type="link" style={{ marginRight: '9px' }} onClick={toHelp} title="使用帮助">帮助</Button>
      </div>

      <div className={styles.btnArea} style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handlePublishH5}
          style={{ background: '#10b981', borderColor: '#10b981', borderRadius: '6px', marginRight: '12px', fontWeight: 'bold' }}
        >
          一键发布
        </Button>

        {/* 🌟 核心修复：使用 Antd 气泡卡片弹出个人中心，绝不遮挡画布！ */}
        {user && !isAdmin ? (
          <Popover content={popoverContent} title={<span style={{ fontWeight: 'bold' }}>个人中心</span>} trigger="click" placement="bottomRight">
            <Button
              type="primary"
              icon={<UserOutlined />}
              style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', border: 'none', color: '#F6D365', fontWeight: 'bold', borderRadius: '6px' }}
            >
              个人中心
            </Button>
          </Popover>
        ) : (
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => {
              if (!user) {
                history.push('/');
              } else if (isAdmin) {
                history.push('/dashboard');
              }
            }}
            style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', border: 'none', color: '#F6D365', fontWeight: 'bold', borderRadius: '6px' }}
          >
            {!user ? '会员登录' : '总控后台'}
          </Button>
        )}
      </div>

      {/* 🌟 新增：气泡一戳就破的温馨提示 */}
      {showHintBubble && (
        <div
          onClick={() => setShowHintBubble(false)}
          style={{ position: 'fixed', bottom: 120, right: 30, background: '#fff', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 8px 20px rgba(225,29,72,0.2)', border: '1px solid #ffe4e6', zIndex: 99999, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', animation: 'bounce 2s infinite' }}
        >
          <span style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>💡 如何加长页面？</span>
          <span style={{ color: '#666', fontSize: '12px' }}>无需手动拉伸！请从左侧持续向下拖入新组件，画布会自动延伸。(点击关闭)</span>
          <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
        </div>
      )}
      
      {/* 海报预览弹窗 */}
      <Modal title="✨ 您的专属海报 (请右键图片另存为)" visible={showFaceModal} footer={null} width={380} destroyOnClose={true} onCancel={() => setShowFaceModal(false)} bodyStyle={{ padding: '16px', background: '#f9fafb' }}>
        <img src={faceUrl} style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} alt="高清海报" />
      </Modal>

      {/* 保存云端模板弹窗 (竖屏优化比例) */}
      <Modal
        title="💾 存入酷猫云端模板大厅"
        visible={isSaveModalOpen}
        onOk={executeCloudSave}
        onCancel={() => setIsSaveModalOpen(false)}
        okText="确认上云"
        cancelText="取消"
        destroyOnClose={true}
        width={380}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>模板名称：</div>
            <Input placeholder="例如：新春拉新促销H5" size="large" value={saveTplName} onChange={e => setSaveTplName(e.target.value)} />
          </div>

          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>封面图预览：</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <Spin spinning={isCapturing} tip="截取中...">
                <img src={faceUrl || 'https://via.placeholder.com/160x284?text=暂无封面'} style={{ width: '160px', height: '284px', objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: '8px' }} />
              </Spin>
            </div>

            {/* 按钮区：这里加上了缺失的“点击截取”按钮 */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button onClick={generatePoster} type="default">点击截取当前画布</Button>
              <Upload {...uploadCoverProps}>
                <Button type="primary">手动上传封面</Button>
              </Upload>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default HeaderComponent;
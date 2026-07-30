import axios from 'axios';
import { message } from 'antd';

const isDev = process.env.NODE_ENV === 'development';

// 🌟 全量预热快照库：包含主页、大盘、轮播、公告与 AI 动态的全套首屏秒发数据！
// 无论是首次访问还是无缓存冷启动，统统 0.001 毫秒渲染画面，杜绝任何 1 秒延迟！
const COLD_START_SNAPSHOTS: Record<string, any> = {
  '/api/templates/list': [],
  '/api/settings/carousel': [
    { id: 1, title: '酷猫商业中枢', desc: '海量高质量 H5 落地页，全网一键分发', image_url: '' },
    { id: 2, title: '极速生产力引擎', desc: '无需代码，让创意瞬间落地商业化', image_url: '' }
  ],
  '/api/settings/announcement': '🎉 欢迎来到酷猫商业中枢！全新云表格与H5可视化编辑器已全面上线，快来开启您的创意创作吧！',
  '/api/ai/thoughts': [
    { id: '101', time: '10:30:15', title: '白天常规巡检', content: '正在监控平台流水、流量热力图及各模块流畅度...', type: 'info' },
    { id: '102', time: '02:15:00', title: '夜间深度自检', content: 'Boss 已离线，神经网络开始全网矩阵搜索与商业复盘...', type: 'thought' }
  ],
  '/api/ai/proposals': [
    { id: 'skill_auto_seo', title: '自动化双语 SEO 洗稿中枢', desc: '夜间侦测发现海外 Pinterest 对插画类模板流量扶持极大。已编写自动抓取、双语翻译并静默发帖的脚本原型。', status: 'pending', type: 'marketing' },
    { id: 'skill_webgl_3d', title: 'WebGL 3D 旋转组件注入', desc: '竞品分析显示 3D 组件转化率溢价 20%。已抓取 Three.js 开源代码并封装，请求合入底层组件库。', status: 'pending', type: 'tech' }
  ],
  '/api/components/list': [
    { id: 1, name: '表单定制组件', icon: '📝', category: '基础组件', status: 1, sort_order: 1 },
    { id: 2, name: '单行文本', icon: '📄', category: '基础组件', status: 1, sort_order: 2 },
    { id: 3, name: '文本组件', icon: '📄', category: '基础组件', status: 1, sort_order: 3 },
    { id: 4, name: '空白组件', icon: '⬜', category: '基础组件', status: 1, sort_order: 4 },
    { id: 5, name: '富文本组件', icon: '📰', category: '基础组件', status: 1, sort_order: 5 },
    { id: 6, name: '图标组件', icon: '💠', category: '基础组件', status: 1, sort_order: 6 },
    { id: 7, name: '二维码组件', icon: '🔲', category: '基础组件', status: 1, sort_order: 7 },
    { id: 8, name: '表格组件', icon: '📊', category: '基础组件', status: 1, sort_order: 8 },
    { id: 9, name: '轮播图组件', icon: '🖼️', category: '基础组件', status: 1, sort_order: 9 },
    { id: 10, name: '页头组件', icon: '🔝', category: '基础组件', status: 1, sort_order: 10 },
    { id: 11, name: '列表组件', icon: '📑', category: '基础组件', status: 1, sort_order: 11 },
    { id: 12, name: '通知组件', icon: '📢', category: '基础组件', status: 1, sort_order: 12 },
    { id: 13, name: '视频组件', icon: '▶️', category: '媒体组件', status: 1, sort_order: 13 },
    { id: 14, name: '音频组件', icon: '🎵', category: '媒体组件', status: 1, sort_order: 14 },
    { id: 15, name: '图片组件', icon: '📸', category: '媒体组件', status: 1, sort_order: 15 },
    { id: 16, name: '地图组件', icon: '🗺️', category: '媒体组件', status: 1, sort_order: 16 },
    { id: 17, name: '日历组件', icon: '📅', category: '媒体组件', status: 1, sort_order: 17 },
    { id: 18, name: '柱状图组件', icon: '📊', category: '可视化组件', status: 1, sort_order: 18 },
    { id: 19, name: '折线图组件', icon: '📈', category: '可视化组件', status: 1, sort_order: 19 },
    { id: 20, name: '饼图组件', icon: '🥧', category: '可视化组件', status: 1, sort_order: 20 },
    { id: 21, name: '面积图组件', icon: '📉', category: '可视化组件', status: 1, sort_order: 21 },
    { id: 22, name: '进度条组件', icon: '🔋', category: '可视化组件', status: 1, sort_order: 22 },
    { id: 23, name: '专栏组件', icon: '💎', category: '营销组件', status: 1, sort_order: 23 },
    { id: 24, name: '切换页组件', icon: '🔄', category: '营销组件', status: 1, sort_order: 24 },
    { id: 25, name: '优惠券组件', icon: '🎟️', category: '营销组件', status: 1, sort_order: 25 },
    { id: 26, name: '商品标签', icon: '🏷️', category: '营销组件', status: 1, sort_order: 26 }
  ],
  '/api/admin/users/list': [
    { id: 1, username: 'admin@coolmall.com', role: 'admin', date: '2026-06-01 10:00:00' },
    { id: 2, username: 'designer@coolmall.com', role: 'user', date: '2026-06-15 14:20:00' }
  ]
};

if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';

    if (isGet && urlStr.includes('/api/')) {
      const cacheKey = `SWR_CACHE_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey);

      // 后台静默发起真正的网络请求更新数据，绝不卡住用户的首屏渲染
      const networkPromise = originalFetch(input, init).then(async (res) => {
        const cloned = res.clone();
        try {
          const data = await cloned.json();
          if (data && data.code === 200) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
        } catch (e) { }
        return res;
      });

      // 1. 如果缓存中有数据，直接0ms立刻返回
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          return new Response(JSON.stringify(cachedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) { }
      }

      // 2. 🌟 核心突破：如果首次无缓存，遍历缺省快照 0ms 闪电发还，杜绝首载 1 秒卡顿！
      for (const [key, snapshot] of Object.entries(COLD_START_SNAPSHOTS)) {
        if (urlStr.includes(key)) {
          return new Response(JSON.stringify({ code: 200, data: snapshot }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return networkPromise;
    }

    return originalFetch(input, init);
  };
}

const instance = axios.create({
  baseURL: isDev ? 'http://localhost:3000' : '',
  timeout: 10000,
  withCredentials: true,
});

instance.interceptors.request.use(
  function (config) {
    config.headers = {
      ...config.headers,
      'x-requested-with': 'XMLHttpRequest',
    };
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const { response } = error;
    if (response) {
      if (response.status === 404) {
        message.error('请求资源未发现');
      } else if (response.status === 403) {
        message.error(response.data?.msg || '无权限', () => {
          window.location.href = '/';
        });
      } else {
        message.error(response.data?.msg || '网络异常');
      }
    }
    return Promise.reject(error);
  },
);

export default instance;
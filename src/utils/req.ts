import axios from 'axios';
import { message } from 'antd';

const isDev = process.env.NODE_ENV === 'development';

// 🌟 100% 完整无删减初始快照，复原完整公告、轮播图与示例大盘！
const COLD_START_SNAPSHOTS: Record<string, any> = {
  '/api/templates/list': [],
  '/api/h5/my-works': [],
  '/api/works': [],
  '/all-works': [],
  '/operation-logs': [],
  '/overview': [],
  '/thoughts': [],
  '/api/settings/carousel': [
    { id: 1, title: '酷猫商业中枢', desc: '海量高质量 H5 落地页，全网一键分发', image_url: '' },
    { id: 2, title: '极速生产力引擎', desc: '无需代码，让创意瞬间落地商业化', image_url: '' }
  ],
  '/api/settings/announcement': '🎉 欢迎来到酷猫商业中枢！全新云表格与H5可视化编辑器已全面上线，快来开启您的创意创作吧！'
};

const isTargetUrl = (url: string) => {
  if (!url) return false;
  return url.includes('/api/') || url.includes('works') || url.includes('list') || url.includes('logs') || url.includes('audit') || url.includes('announcement') || url.includes('carousel');
};

// 🌟 1. window.fetch 原生 SWR 秒开拦截
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';

    if (isGet && isTargetUrl(urlStr)) {
      const cacheKey = `COOL_SWR_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);

      // 后台异步静默拉取更新，绝不挂起当前屏幕展示
      originalFetch(input, init).then(async (res) => {
        try {
          const cloned = res.clone();
          const data = await cloned.json();
          if (data && (data.code === 200 || Array.isArray(data))) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheKey, JSON.stringify(data));
          }
        } catch (e) { }
      });

      // 🌟 第0毫秒直接返回缓存或初始快照！
      if (cached) {
        try {
          return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (e) { }
      }

      for (const [key, snapshot] of Object.entries(COLD_START_SNAPSHOTS)) {
        if (urlStr.includes(key)) {
          return new Response(JSON.stringify({ code: 200, data: snapshot, list: snapshot, rows: snapshot, total: snapshot.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }
    return originalFetch(input, init);
  };
}

const instance = axios.create({
  baseURL: isDev ? 'http://localhost:3000' : '',
  timeout: 10000,
  withCredentials: true,
});

// 🌟 2. Axios 0ms SWR 拦截，进入后台工作台直接画表！
instance.interceptors.request.use(
  async function (config) {
    config.headers = { ...config.headers, 'x-requested-with': 'XMLHttpRequest' };
    const isGet = !config.method || config.method.toUpperCase() === 'GET';
    const urlStr = config.url || '';

    if (isGet && isTargetUrl(urlStr)) {
      const cacheKey = `COOL_SWR_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);
      if (cached) {
        config.adapter = async () => ({
          data: JSON.parse(cached),
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
        return config;
      }
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default instance;
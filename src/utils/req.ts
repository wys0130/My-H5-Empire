import axios from 'axios';
import { message } from 'antd';

const isDev = process.env.NODE_ENV === 'development';

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
  '/api/settings/announcement': '🎉 欢迎来到酷猫商业中枢！全新云表格与H5可视化编辑器已全面上线！'
};

const isTargetUrl = (url: string) => {
  if (!url) return false;
  return url.includes('/api/') || url.includes('works') || url.includes('list') || url.includes('logs') || url.includes('audit');
};

// 1. window.fetch 0ms 拦截：有缓存马上弹回页面！
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';

    if (isGet && isTargetUrl(urlStr)) {
      const cacheKey = `FAST_CACHE_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (e) { }
      }

      const res = await originalFetch(input, init);
      try {
        const cloned = res.clone();
        const data = await cloned.json();
        if (data && (data.code === 200 || Array.isArray(data))) {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (e) { }
      return res;
    }
    return originalFetch(input, init);
  };
}

const instance = axios.create({
  baseURL: isDev ? 'http://localhost:3000' : '',
  timeout: 15000,
  withCredentials: true,
});

// 2. Axios 0ms 拦截：进入后台管理立刻从缓存读取作品卡片
instance.interceptors.request.use(
  async function (config) {
    config.headers = { ...config.headers, 'x-requested-with': 'XMLHttpRequest' };
    const isGet = !config.method || config.method.toUpperCase() === 'GET';
    const urlStr = config.url || '';

    if (isGet && isTargetUrl(urlStr)) {
      const cacheKey = `FAST_CACHE_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey);
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
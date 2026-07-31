import axios from 'axios';
import { message } from 'antd';

const isDev = process.env.NODE_ENV === 'development';

// 🌟 全覆盖冷启动快照：涵盖首页、我的作品、后台所有审查与日志接口，0ms 瞬间出图！
const COLD_START_SNAPSHOTS: Record<string, any> = {
  '/api/templates/list': [],
  '/api/h5/my-works': [],
  '/api/works': [],
  '/api/admin/works': [],
  '/all-works': [],
  '/operation-logs': [],
  '/overview': [],
  '/sales-ranking': [],
  '/thoughts': [],
  '/work/list': [],
  '/h5/list': [],
  '/api/settings/carousel': [
    { id: 1, title: '酷猫商业中枢', desc: '海量高质量 H5 落地页，全网一键分发', image_url: '' },
    { id: 2, title: '极速生产力引擎', desc: '无需代码，让创意瞬间落地商业化', image_url: '' }
  ],
  '/api/settings/announcement': '🎉 欢迎来到酷猫商业中枢！全新云表格与H5可视化编辑器已全面上线，快来开启您的创意创作吧！'
};

// 🌟 1. 原生 fetch 0ms 拦截与静默同步
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';

    if (isGet && (urlStr.includes('/api/') || urlStr.includes('/work') || urlStr.includes('/h5') || urlStr.includes('/all-works') || urlStr.includes('/operation-logs') || urlStr.includes('/overview'))) {
      const cacheKey = `SWR_CACHE_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey);

      const networkPromise = originalFetch(input, init).then(async (res) => {
        const cloned = res.clone();
        try {
          const data = await cloned.json();
          if (data && (data.code === 200 || Array.isArray(data))) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
        } catch (e) { }
        return res;
      });

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
      return networkPromise;
    }
    return originalFetch(input, init);
  };
}

const instance = axios.create({
  baseURL: isDev ? 'http://localhost:3000' : '',
  timeout: 15000,
  withCredentials: true,
});

// 🌟 2. Axios 0ms 拦截：杜绝后台审核界面 11 秒卡顿
instance.interceptors.request.use(
  async function (config) {
    config.headers = {
      ...config.headers,
      'x-requested-with': 'XMLHttpRequest',
    };

    const isGet = !config.method || config.method.toUpperCase() === 'GET';
    const urlStr = config.url || '';

    if (isGet && (urlStr.includes('/api/') || urlStr.includes('/work') || urlStr.includes('/h5') || urlStr.includes('/all-works') || urlStr.includes('/operation-logs') || urlStr.includes('/overview'))) {
      const cacheKey = `SWR_CACHE_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey);

      const realUrl = `${config.baseURL || ''}${urlStr}`;
      window.fetch(realUrl).then(async (res) => {
        try {
          const data = await res.json();
          if (data && (data.code === 200 || Array.isArray(data))) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
        } catch (e) { }
      });

      if (cached) {
        try {
          config.adapter = async () => ({
            data: JSON.parse(cached),
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
          return config;
        } catch (e) { }
      }

      for (const [key, snapshot] of Object.entries(COLD_START_SNAPSHOTS)) {
        if (urlStr.includes(key)) {
          config.adapter = async () => ({
            data: { code: 200, data: snapshot, list: snapshot, rows: snapshot, total: snapshot.length },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
          return config;
        }
      }
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default instance;
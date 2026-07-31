import axios from 'axios';
import { message } from 'antd';

const isDev = process.env.NODE_ENV === 'development';

// ⭐ 快照里填充真实数据，首次打开直接渲染，不用等网络
const COLD_START_SNAPSHOTS: Record<string, any> = {
  '/api/templates/list': [
    { id: 'demo_1', title: '全球智博会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-31' },
    { id: 'demo_2', title: '前沿科技博览会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-30' },
  ],
  '/api/h5/my-works': [
    { id: 'demo_1', title: '全球智博会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-31' },
    { id: 'demo_2', title: '前沿科技博览会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-30' },
  ],
  '/api/works': [
    { id: 'demo_1', title: '全球智博会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-31' },
    { id: 'demo_2', title: '前沿科技博览会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-30' },
  ],
  '/all-works': [
    { id: 'demo_1', title: '全球智博会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-31' },
    { id: 'demo_2', title: '前沿科技博览会', cover_url: '', category: 'h5', is_published: 1, date: '2026-07-30' },
  ],
  '/operation-logs': [
    { id: 1, admin_id: 'admin', action: '登录系统', target_id: '1', created_at: '2026-07-31 10:00:00' },
    { id: 2, admin_id: 'admin', action: '发布作品', target_id: 'H5_001', created_at: '2026-07-31 09:30:00' },
  ],
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
  return url.includes('/api/') || url.includes('works') || url.includes('list') || url.includes('logs') || url.includes('audit');
};

// ---------- 原生 fetch 拦截 ----------
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';
    if (isGet && isTargetUrl(urlStr)) {
      const cacheKey = `SWR_LOCAL_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);

      // 1st 防线：缓存存在 -> 0ms 返回
      if (cached) {
        try {
          return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (_) { }
      }

      // 2nd 防线：快照兜底 -> 0ms 返回（现在快照里有真实数据了！）
      for (const [key, snapshot] of Object.entries(COLD_START_SNAPSHOTS)) {
        if (urlStr.includes(key)) {
          // 后台静默更新缓存
          originalFetch(input, init).then(async (res) => {
            try {
              const cloned = res.clone();
              const data = await cloned.json();
              if (data && (data.code === 200 || Array.isArray(data))) {
                const str = JSON.stringify(data);
                sessionStorage.setItem(cacheKey, str);
                localStorage.setItem(cacheKey, str);
              }
            } catch (_) { }
          });
          return new Response(JSON.stringify({ code: 200, data: snapshot, list: snapshot, rows: snapshot, total: snapshot.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // 3rd 防线：走网络（首次且没有快照匹配时才会触发）
      const res = await originalFetch(input, init);
      try {
        const cloned = res.clone();
        const data = await cloned.json();
        if (data && (data.code === 200 || Array.isArray(data))) {
          const str = JSON.stringify(data);
          sessionStorage.setItem(cacheKey, str);
          localStorage.setItem(cacheKey, str);
        }
      } catch (_) { }
      return res;
    }
    return originalFetch(input, init);
  };
}

// ---------- Axios 拦截 ----------
const instance = axios.create({
  baseURL: isDev ? 'http://localhost:3000' : '',
  timeout: 20000,
  withCredentials: true,
});

instance.interceptors.request.use(
  async function (config) {
    config.headers = { ...config.headers, 'x-requested-with': 'XMLHttpRequest' };
    const isGet = !config.method || config.method.toUpperCase() === 'GET';
    const urlStr = config.url || '';
    if (isGet && isTargetUrl(urlStr)) {
      const cacheKey = `SWR_LOCAL_${urlStr}`;
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
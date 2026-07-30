import axios from 'axios';
import { message } from 'antd';

const isDev = process.env.NODE_ENV === 'development';

// 🌟 1. 核心黑科技：对全局原生 fetch 进行无感 SWR 缓冲拦截
// 让你项目里写的 fetch('/api/components/list') 等查询类接口全部变成 0ms 瞬间打开！
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';

    // 如果是查询列表或配置，先检查浏览器 session 内存
    if (isGet && (urlStr.includes('/api/components/list') || urlStr.includes('/api/admin/users/list') || urlStr.includes('/api/settings/'))) {
      const cacheKey = `SWR_CACHE_${urlStr}`;
      const cached = sessionStorage.getItem(cacheKey);

      // 后台静默发起真正的网络请求更新数据
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

      // 如果内存里有上次加载的内容，伪造一个 0 延迟请求立刻返回给前端界面！
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          return new Response(JSON.stringify(cachedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) { }
      }
      return networkPromise;
    }

    return originalFetch(input, init);
  };
}

const instance = axios.create({
  // 🌟 2. 修复路由请求：生产环境使用相对路径 ''，直接请求 Cloudflare 云端 API
  baseURL: isDev ? 'http://localhost:3000' : '',
  timeout: 10000,
  withCredentials: true,
});

// 添加请求拦截器
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

// 添加响应拦截器
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
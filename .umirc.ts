import path from 'path';
import { defineConfig } from 'umi';

export default defineConfig({
  dynamicImport: {
    loading: '@/components/LoadingCp',
  },
  dva: {
    immer: true,
  },
  devtool: 'source-map',
  antd: {},
  title: 'CoolMall Workspace - 酷猫办公',

  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
  base: '/',
  publicPath: '/',
  outputPath: 'dist',
  esbuild: {},
  routes: [
    {
      exact: false,
      path: '/',
      component: '@/layouts/index',
      routes: [
        { path: '/', component: '../pages/home' },
        { path: '/editor', component: '../pages/editor' },
        { path: '/ide', component: '../pages/ide' },
        { path: '/help', component: '../pages/help' },
        { path: '/login', component: '../pages/login' },
        { path: '/mobileTip', component: '../pages/mobileTip' },
        { path: '/preview', component: '../pages/editor/preview' },
      ],
    },
  ],
  theme: {
    'primary-color': '#E1251B',
  },

  // 🚀 核心变化：删除了所有针对 zarm 的插件配置，不准系统再去多管闲事！

  alias: {
    components: path.resolve(__dirname, 'src/components/'),
    utils: path.resolve(__dirname, 'src/utils/'),
    assets: path.resolve(__dirname, 'src/assets/'),
  },
});
import { baseConfig, baseDefault } from '../../common';

const Header = {
  editData: [
    ...baseConfig,
    { key: 'logoText', name: '标题文字', type: 'Text' },
    { key: 'fontSize', name: '字号', type: 'Number' },
    { key: 'color', name: '文字颜色', type: 'Color' },
    { key: 'bgColor', name: '背景颜色', type: 'Color' },
    { key: 'textAlign', name: '对齐方式', type: 'Radio', range: [{ key: 'left', text: '左' }, { key: 'center', text: '中' }, { key: 'right', text: '右' }] },
    { key: 'fontWeight', name: '文字粗细', type: 'Radio', range: [{ key: 'normal', text: '常规' }, { key: 'bold', text: '加粗' }] },
    { key: 'fontStyle', name: '文字斜体', type: 'Radio', range: [{ key: 'normal', text: '常规' }, { key: 'italic', text: '斜体' }] },
    { key: 'bgUrl', name: '背景图片', type: 'Upload', isCrop: false },
  ],
  config: {
    // 🎯 必须使用框架标准的 rgba 格式，取色器才能正常渲染预览块
    bgColor: 'rgba(255,255,255,1)',
    color: 'rgba(51,51,51,1)',
    logoText: '页头Header',
    fontSize: 18,
    height: 50,
    logo: [],
    textAlign: 'center',
    fontWeight: 'normal',
    fontStyle: 'normal',
    bgUrl: [],
    ...baseDefault,
  },
};

export default Header;
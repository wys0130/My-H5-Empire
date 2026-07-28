import { baseConfig, baseDefault } from '../../common';

const Header = {
  editData: [
    ...baseConfig,
    { key: 'logoText', name: '标题文字', type: 'Text' },
    { key: 'fontSize', name: '字号', type: 'Number' },
    { key: 'color', name: '文字颜色', type: 'Color' },
    { key: 'bgColor', name: '背景颜色', type: 'Color' },
    { key: 'textAlign', name: '对齐方式', type: 'Select', range: [{ key: 'left', text: '居左' }, { key: 'center', text: '居中' }, { key: 'right', text: '居右' }] },
    { key: 'fontWeight', name: '文字粗细', type: 'Select', range: [{ key: 'normal', text: '常规' }, { key: 'bold', text: '加粗' }] },
    { key: 'bgUrl', name: '背景图片', type: 'Upload', isCrop: false },
  ],
  config: {
    // 🎯 必须这样写：全小写、无空格、透明度必须是整数(1或0)！专治底层奇葩正则！
    bgColor: 'rgba(255,255,255,1)',
    color: 'rgba(51,51,51,1)',
    logoText: '页头Header',
    fontSize: 18,
    height: 50,
    logo: [],
    textAlign: 'center',
    fontWeight: 'normal',
    bgUrl: [],
    ...baseDefault,
  },
};

export default Header;
import { baseConfig, baseDefault } from '../../common';

const Text = {
  editData: [
    ...baseConfig,
    { key: 'text', name: '文字内容', type: 'Text' }, // 👈 只保留这一个纯粹的文字内容输入框
    { key: 'fontSize', name: '字号', type: 'Number' },
    { key: 'color', name: '文字颜色', type: 'Color' },
    { key: 'bgColor', name: '背景颜色', type: 'Color' },
    { key: 'textAlign', name: '对齐方式', type: 'Radio', range: [{ key: 'left', text: '左' }, { key: 'center', text: '中' }, { key: 'right', text: '右' }] },
    { key: 'fontWeight', name: '文字粗细', type: 'Radio', range: [{ key: 'normal', text: '常规' }, { key: 'bold', text: '加粗' }] },
    { key: 'fontStyle', name: '文字斜体', type: 'Radio', range: [{ key: 'normal', text: '常规' }, { key: 'italic', text: '斜体' }] },
    { key: 'bgUrl', name: '背景图片', type: 'Upload', isCrop: false },
  ],
  config: {
    bgColor: 'rgba(255,255,255,0)',
    color: 'rgba(51,51,51,1)',
    text: '普通文本组件', // 默认文字
    fontSize: 18,
    height: 50,
    textAlign: 'center',
    fontWeight: 'normal',
    fontStyle: 'normal',
    bgUrl: [],
    ...baseDefault,
  },
};

export default Text;
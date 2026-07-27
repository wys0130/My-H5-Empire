import { baseConfig, baseDefault } from '../../common';

const Text = {
  editData: [
    ...baseConfig,
    { key: 'text', name: '文字', type: 'Text' },
    { key: 'color', name: '标题颜色', type: 'Color' },
    { key: 'fontSize', name: '字体大小', type: 'Number' },
    { key: 'textAlign', name: '对齐方式', type: 'Radio', range: [{ key: 'left', text: '左' }, { key: 'center', text: '中' }, { key: 'right', text: '右' }] },
    { key: 'fontWeight', name: '文字粗细', type: 'Radio', range: [{ key: 'normal', text: '常规' }, { key: 'bold', text: '加粗' }] },
    { key: 'fontStyle', name: '文字斜体', type: 'Radio', range: [{ key: 'normal', text: '常规' }, { key: 'italic', text: '斜体' }] },
    { key: 'lineHeight', name: '行高', type: 'Number' },
  ],

  config: {
    text: '我是神装文本',
    color: '#333333',
    fontSize: 18,
    lineHeight: 2,
    textAlign: 'center',
    fontWeight: 'normal',
    fontStyle: 'normal',
    ...baseDefault,
  },
};

export default Text;
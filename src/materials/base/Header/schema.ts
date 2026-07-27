import { baseConfig, baseDefault, ICommonBaseType } from '../../common';

export interface IHeaderConfig extends ICommonBaseType {
  bgColor: any;
  logo: any;
  logoText: string;
  fontSize: number;
  color: any;
  height: number;
  textAlign?: string;
  fontWeight?: string;
  fontStyle?: string;
  bgUrl?: any;
  bgUrlText?: string;
}

export interface IHeaderSchema {
  editData: any[];
  config: IHeaderConfig;
}

const Header: IHeaderSchema = {
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
    { key: 'bgUrlText', name: '网络背景图', type: 'Text' }
  ],
  config: {
    bgColor: '#ffffff',
    logo: [],
    logoText: '页头Header',
    fontSize: 18,
    color: '#333333',
    height: 50,
    textAlign: 'center',
    fontWeight: 'normal',
    fontStyle: 'normal',
    bgUrl: [],
    bgUrlText: '',
    ...baseDefault,
  },
};

export default Header;
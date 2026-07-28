import React from 'react';
import styles from './index.less';
import logos from '@/assets/header.png';

const Header = (props: any) => {
  const {
    bgColor, logoText, fontSize, color,
    textAlign, fontWeight, bgUrl, isTpl
  } = props;

  // 1. 万能颜色解析：不论框架抛过来什么，都能转化成安全的 CSS 格式
  const parseColor = (c: any, defaultColor: string) => {
    if (!c) return defaultColor;
    if (typeof c === 'string') {
      if (c.includes('NaN')) return defaultColor;
      // 修复透明度为0导致的隐身问题
      if (c.includes(',0)') || c.includes(', 0)')) return c.replace(/,\s*0\)/, ', 1)');
      return c;
    }
    if (typeof c === 'object') {
      if (c.value) return parseColor(c.value, defaultColor);
      if ('r' in c && 'g' in c && 'b' in c) {
        const alpha = (c.a === undefined || Number(c.a) === 0) ? 1 : c.a;
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
      }
      if (c.hex) return c.hex;
    }
    return defaultColor;
  };

  const finalBgColor = parseColor(bgColor, 'rgba(255,255,255,1)');
  const finalTextColor = parseColor(color, 'rgba(51,51,51,1)');

  // 2. 深度背景图解析：完美接住 Ant Design Upload 的嵌套数据
  let backgroundImage = '';
  if (bgUrl) {
    if (typeof bgUrl === 'string') {
      backgroundImage = bgUrl;
    } else if (Array.isArray(bgUrl) && bgUrl.length > 0) {
      const file = bgUrl[0]; // 取第一张图
      if (typeof file === 'string') {
        backgroundImage = file;
      } else if (typeof file === 'object') {
        // 依次尝试提取真正的图片 URL，涵盖了各种后端的返回格式
        backgroundImage = file.url || file.thumbUrl || file.response?.url || file.response?.data?.url || '';
      }
    } else if (typeof bgUrl === 'object') {
      backgroundImage = bgUrl.url || bgUrl.thumbUrl || bgUrl.response?.url || '';
    }
  }

  let justifyContent = 'center';
  if (textAlign === 'left') justifyContent = 'flex-start';
  if (textAlign === 'right') justifyContent = 'flex-end';

  return (
    <>
      {isTpl ? (
        <div>
          <img src={logos} alt="" />
        </div>
      ) : (
        <div
          className={styles.header}
          style={{
            backgroundColor: finalBgColor,
            // 🎯 将解析出来的图片应用到 CSS backgroundImage 属性上
            backgroundImage: backgroundImage ? `url("${backgroundImage}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: justifyContent,
            boxSizing: 'border-box'
          }}
        >
          <div
            className={styles.title}
            style={{
              fontSize: fontSize ? `${fontSize}px` : '18px',
              color: finalTextColor,
              textAlign: textAlign || 'center',
              fontWeight: fontWeight === 'bold' ? 'bold' : 'normal',
              width: '100%',
              wordBreak: 'break-all'
            }}
          >
            {logoText || '页头标题'}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
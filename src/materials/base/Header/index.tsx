import React from 'react';
import styles from './index.less';
import logos from '@/assets/header.png';

const Header = (props: any) => {
  const {
    bgColor, logoText, fontSize, color,
    textAlign, fontWeight, bgUrl, isTpl
  } = props;

  // 🛡️ 终极色彩净化器：强制将任何带透明度为0的陷阱转为不透明色
  const parseColor = (c: any, defaultColor: string) => {
    if (!c) return defaultColor;
    if (typeof c === 'string') {
      if (c.includes('NaN')) return defaultColor;
      if (c.includes(',0)') || c.includes(', 0)')) {
        return c.replace(/,\s*0\)/, ', 1)');
      }
      return c;
    }
    if (typeof c === 'object') {
      if (c.value) return parseColor(c.value, defaultColor);
      if (c.hex) return c.hex;
      if ('r' in c && 'g' in c && 'b' in c) {
        const alpha = (c.a === undefined || Number(c.a) === 0) ? 1 : c.a;
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
      }
    }
    return defaultColor;
  };

  const finalBgColor = parseColor(bgColor, '#ffffff');
  const finalTextColor = parseColor(color, '#333333');

  // 背景图解析
  let backgroundImage = '';
  if (bgUrl) {
    if (typeof bgUrl === 'string') {
      backgroundImage = bgUrl;
    } else if (Array.isArray(bgUrl) && bgUrl.length > 0) {
      const first = bgUrl[0];
      if (typeof first === 'string') backgroundImage = first;
      else if (typeof first === 'object') {
        backgroundImage = first.url || first.thumbUrl || first.response?.url || first.response?.data?.url || '';
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
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
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
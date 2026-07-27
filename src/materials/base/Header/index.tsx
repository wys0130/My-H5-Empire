import { memo } from 'react';
import styles from './index.less';
import React from 'react';
import logos from '@/assets/header.png';

const Header = memo((props: any) => {
  const {
    bgColor, logo, logoText, fontSize, color,
    textAlign, fontWeight, fontStyle, bgUrl,
    baseWidth, baseHeight, baseRadius, baseLeft, baseTop, baseScale, baseRotate, isTpl
  } = props;

  const parseColor = (c: any, defaultColor: string) => {
    if (!c) return defaultColor;
    if (typeof c === 'string') return c;
    if (typeof c === 'object') return `rgba(${c.r || 0}, ${c.g || 0}, ${c.b || 0}, ${c.a !== undefined ? c.a : 1})`;
    return defaultColor;
  };

  const finalBgColor = parseColor(bgColor, 'transparent');
  const finalTextColor = parseColor(color, '#333333');

  const backgroundImage = bgUrl && bgUrl.length > 0 ? bgUrl[0]?.url : '';
  const logoUrl = logo && logo.length > 0 ? logo[0]?.url : '';
  const showLogo = logoUrl && !logoUrl.includes('49.234.61.19') && !logoUrl.includes('R0lGODlh');

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
        <header
          className={styles.header}
          style={{
            backgroundColor: finalBgColor,
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
            position: 'absolute',
            width: `${baseWidth}%`,
            height: `${baseHeight}%`,
            borderRadius: baseRadius,
            transform: `translate(${baseLeft}px,${baseTop}px) scale(${baseScale / 100}) rotate(${baseRotate}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: justifyContent,
            padding: '0 12px'
          }}
        >
          {showLogo && (
            <div className={styles.logo} style={{ flexShrink: 0, marginRight: '8px' }}>
              <img src={logoUrl} alt="" style={{ maxHeight: '100%', maxWidth: '40px' }} />
            </div>
          )}

          <div
            className={styles.title}
            style={{
              fontSize: fontSize ? `${fontSize}px` : '18px',
              color: finalTextColor,
              textAlign: textAlign || 'center',
              fontWeight: fontWeight === 'bold' ? 'bold' : 'normal',
              fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
              flex: 1,
              width: '100%',
              wordBreak: 'break-all'
            }}
          >
            {logoText}
          </div>
        </header>
      )}
    </>
  );
});

export default Header;
import { memo } from 'react';
import React from 'react';
import styles from './index.less';

const Text = memo((props: any) => {
  const {
    text, logoText, color, bgColor, bgUrl, fontSize, lineHeight,  // 👈 新增引入 bgColor, bgUrl 和 logoText
    textAlign, fontWeight, fontStyle,
    baseWidth, baseHeight, baseRadius, baseLeft, baseTop, baseScale, baseRotate
  } = props;

  // 颜色解析器（保留你的，修复透明度BUG）
  const parseColor = (c: any, defaultColor: string) => {
    if (!c) return defaultColor;
    if (typeof c === 'string') {
      if (c.includes('NaN')) return defaultColor;
      if (c.includes(',0)') || c.includes(', 0)')) return c.replace(/,\s*0\)/, ', 1)');
      return c;
    }
    if (typeof c === 'object') return `rgba(${c.r || 0}, ${c.g || 0}, ${c.b || 0}, ${c.a !== undefined ? c.a : 1})`;
    return defaultColor;
  };

  // 🖼️ 背景图片解析器
  const extractUrl = (target: any): string => {
    if (!target) return '';
    if (typeof target === 'string') return target;
    if (Array.isArray(target) && target.length > 0) return extractUrl(target[0]);
    if (typeof target === 'object') {
      return target.url || target.thumbUrl || target.response?.url || target.response?.data?.url || target.response?.result?.url || '';
    }
    return '';
  };

  const finalBgColor = parseColor(bgColor, 'transparent');
  const finalTextColor = parseColor(color, '#333333');
  const backgroundImage = extractUrl(bgUrl);

  let justifyContent = 'center';
  if (textAlign === 'left') justifyContent = 'flex-start';
  if (textAlign === 'right') justifyContent = 'flex-end';

  return (
    <div
      style={{
        position: 'absolute',
        width: `${baseWidth}%`,
        height: `${baseHeight}%`,
        borderRadius: baseRadius,
        transform: `translate(${baseLeft}px,${baseTop}px) scale(${baseScale / 100}) rotate(${baseRotate}deg)`,

        // 🎯 把解析好的背景颜色和背景图挂载上去！
        backgroundColor: finalBgColor,
        backgroundImage: backgroundImage ? `url("${backgroundImage}")` : 'none',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',

        color: finalTextColor,
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        textAlign: textAlign || 'center',
        fontWeight: fontWeight === 'bold' ? 'bold' : 'normal',
        fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',

        display: 'flex',
        alignItems: 'center',
        justifyContent: justifyContent,
        wordBreak: 'break-all'
      }}
    >
      {/* 兼容以前的 text 字段和新拷过来的 logoText 字段 */}
      {text || logoText || '请输入文本内容'}
    </div>
  );
});

export default Text;
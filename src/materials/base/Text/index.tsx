import { memo } from 'react';
import React from 'react';
import styles from './index.less';

const Text = memo((props: any) => {
  const {
    text, color, fontSize, lineHeight,
    textAlign, fontWeight, fontStyle,
    baseWidth, baseHeight, baseRadius, baseLeft, baseTop, baseScale, baseRotate
  } = props;

  const parseColor = (c: any, defaultColor: string) => {
    if (!c) return defaultColor;
    if (typeof c === 'string') return c;
    if (typeof c === 'object') return `rgba(${c.r || 0}, ${c.g || 0}, ${c.b || 0}, ${c.a !== undefined ? c.a : 1})`;
    return defaultColor;
  };

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

        color: parseColor(color, '#333333'),
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
      {text}
    </div>
  );
});

export default Text;
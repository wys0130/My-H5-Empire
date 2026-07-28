import React, { memo } from 'react';
import { IImageConfig } from './schema';
import logo from '@/assets/img.png';

const Image = memo((props: IImageConfig & { isTpl?: boolean }) => {
  const {
    imgUrl,
    round = 0,
    translate,
    align,
    titText,
    titFontSize,
    titColor,
    titFontWeight,
    subTitText,
    subTitFontSize,
    subTitColor,
    subTitFontWeight,
  } = props;

  // 🛡️ 绝对安全的字重解析函数（彻底消灭 NaN 报错，支持 bold / normal / 900 等）
  const getFontWeight = (w: any) => {
    if (w === 'bold' || w === 'normal' || w === 'italic') return w;
    if (w && !isNaN(Number(w))) return Number(w);
    return 'normal';
  };

  // 🛡️ 安全获取图片链接，防止空数组崩溃
  const imageUrl = Array.isArray(imgUrl) && imgUrl.length > 0 ? imgUrl[0]?.url : '';

  return (
    <>
      {props.isTpl && (
        <div>
          <img src={logo} alt="" />
        </div>
      )}
      {!props.isTpl && (
        <div
          style={{
            overflow: 'hidden',
            position: 'absolute',
            width: `${props.baseWidth}%`,
            height: `${props.baseHeight}%`,
            borderRadius: props.baseRadius,
            transform: `translate(${props.baseLeft}px,${props.baseTop}px) 
              scale(${props.baseScale / 100}) 
              rotate(${props.baseRotate}deg)`,
          }}
        >
          <div
            style={{
              borderRadius: round,
              width: '100%',
              textAlign: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                marginLeft: translate && translate[0],
                marginTop: translate && translate[1],
                textAlign: align,
              }}
            >
              <div style={{ fontSize: titFontSize, color: titColor, fontWeight: getFontWeight(titFontWeight) }}>
                {titText}
              </div>
              <div
                style={{
                  fontSize: subTitFontSize,
                  color: subTitColor,
                  fontWeight: getFontWeight(subTitFontWeight),
                  lineHeight: 2.6,
                }}
              >
                {subTitText}
              </div>
            </div>
            {imageUrl ? (
              <img src={imageUrl} alt="" style={{ width: '100%' }} />
            ) : (
              <div style={{ width: '100%', height: '150px', background: '#f3f4f6' }} />
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default Image;
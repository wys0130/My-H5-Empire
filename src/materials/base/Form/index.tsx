import React, { memo, useCallback } from 'react';
import { Button } from 'zarm';
import BaseForm from './BaseForm';
import styles from './index.less';
import { IFormConfig } from './schema';
import logo from '@/assets/form.png';

const FormComponent = (props: IFormConfig & { isTpl: boolean }) => {
  const {
    title,
    bgColor,
    fontSize,
    titColor,
    btnColor,
    titWeight,
    btnTextColor,
    api,
    formControls,
  } = props;

  // 🛡️ 完美的颜色防爆解析器
  const parseColor = (c: any, defaultColor: string) => {
    if (!c) return defaultColor;
    if (typeof c === 'string') return c;
    if (typeof c === 'object') {
      const { r = 0, g = 0, b = 0, a = 1 } = c;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return defaultColor;
  };

  const finalBgColor = parseColor(bgColor, '#ffffff');
  const finalTitColor = parseColor(titColor, '#333333');
  const finalBtnColor = parseColor(btnColor, '#e11d48');
  const finalBtnTextColor = parseColor(btnTextColor, '#ffffff');

  // 🛡️ 绝对安全的字重解析，彻底消灭 NaN 报错
  const getFontWeight = (w: any) => {
    if (w === 'bold' || w === 'normal') return w;
    if (!isNaN(Number(w))) return Number(w);
    return 'normal';
  };

  const formData: Record<string, any> = {};
  const handleChange = useCallback(
    (item, v) => {
      formData[item.label] = v;
    },
    [formData],
  );

  const handleSubmit = () => {
    if (api) {
      fetch(api, {
        body: JSON.stringify(formData),
        cache: 'no-cache',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        mode: 'cors',
      });
    }
  };

  const isEditorPage = window.location.pathname.indexOf('editor') > -1;
  return (
    <>
      {props.isTpl && (
        <div>
          <img src={logo} alt="" />
        </div>
      )}
      {!props.isTpl && (
        <div
          className={styles.formWrap}
          style={{
            backgroundColor: finalBgColor,
            overflow: 'hidden',
            position: 'absolute',
            pointerEvents: isEditorPage ? 'none' : 'initial',
          }}
        >
          {title && (
            <div
              className={styles.title}
              style={{
                fontSize: fontSize ? `${fontSize}px` : '18px',
                fontWeight: getFontWeight(titWeight), // 👈 彻底修复 NaN 错误，安全输出字重
                color: finalTitColor
              }}
            >
              {title}
            </div>
          )}
          <div className={styles.formContent}>
            {Array.isArray(formControls) && formControls.map(item => {
              const FormItem = BaseForm[item.type];
              if (!FormItem) return null;
              return (
                <FormItem onChange={(v: string) => handleChange(item, v)} {...item} key={item.id} />
              );
            })}
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Button
                theme="primary"
                size="sm"
                block
                onClick={handleSubmit}
                style={{ backgroundColor: finalBtnColor, borderColor: finalBtnColor, color: finalBtnTextColor }}
              >
                提交
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(FormComponent);
import React, { memo } from 'react';

interface FormControlItem {
  id: string;
  type: 'Text' | 'Number' | 'TextArea' | 'MySelect' | string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

const BaseForm = memo((props: any) => {
  // 🌟 核心兼容机制：同时兼容 Dooring 引擎直接传参 props 或 props.config 嵌套
  const cfg = props.config || props || {};

  const title = cfg.title || '表单定制组件';
  const fontSize = cfg.fontSize || 18;
  const titColor = cfg.titColor || '#1f2937';
  const bgColor = cfg.bgColor || '#ffffff';
  const btnColor = cfg.btnColor || '#2563eb';
  const btnTextColor = cfg.btnTextColor || '#ffffff';

  // 🌟 安全兜底：如果控件数组为空或不存在，默认展示两行经典输入框，保证画布100%有内容绝不白屏！
  const formControls: FormControlItem[] =
    Array.isArray(cfg.formControls) && cfg.formControls.length > 0
      ? cfg.formControls
      : [
        { id: '1', type: 'Text', label: '姓名', placeholder: '请输入您的完整姓名' },
        { id: '2', type: 'Number', label: '手机号', placeholder: '请输入联系电话' },
      ];

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: '18px 16px',
        borderRadius: '10px',
        boxSizing: 'border-box',
        width: '100%',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: `${fontSize}px`,
            color: titColor,
            fontWeight: 600,
            marginBottom: '14px',
            textAlign: 'center',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {formControls.map((item, index) => (
          <div
            key={item.id || String(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '8px',
            }}
          >
            <label
              style={{
                width: '72px',
                fontSize: '14px',
                color: '#374151',
                flexShrink: 0,
                textAlign: 'left',
                fontWeight: 500,
              }}
            >
              {item.label}
            </label>

            {item.type === 'MySelect' || item.type === 'Select' ? (
              <select
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: '#4b5563',
                  padding: '4px 0',
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  {item.placeholder || '请选择'}
                </option>
                {item.options?.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : item.type === 'TextArea' ? (
              <textarea
                placeholder={item.placeholder || `请输入${item.label}`}
                rows={2}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '14px',
                  color: '#1f2937',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <input
                type={item.type === 'Number' ? 'number' : 'text'}
                placeholder={item.placeholder || `请输入${item.label}`}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1f2937',
                  background: 'transparent',
                }}
              />
            )}
          </div>
        ))}

        <button
          type="button"
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '11px 0',
            backgroundColor: btnColor,
            color: btnTextColor,
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
          }}
        >
          提交
        </button>
      </div>
    </div>
  );
});

export default BaseForm;
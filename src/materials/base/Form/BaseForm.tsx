import React, { memo } from 'react';

interface FormControlItem {
  id: string;
  type: 'Text' | 'Number' | 'TextArea' | 'MySelect' | string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

interface BaseFormProps {
  config: {
    title?: string;
    fontSize?: number;
    titColor?: string;
    titWeight?: string | number;
    bgColor?: string;
    btnColor?: string;
    btnTextColor?: string;
    formControls?: FormControlItem[];
  };
}

const BaseForm = memo((props: BaseFormProps) => {
  const {
    title = '表单定制组件',
    fontSize = 18,
    titColor = 'rgba(60,60,60,1)',
    titWeight = 400,
    bgColor = 'rgba(255,255,255,1)',
    btnColor = '#1890ff',
    btnTextColor = '#ffffff',
    formControls = [],
  } = props.config || {};

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: '16px',
        borderRadius: '8px',
        boxSizing: 'border-box',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: `${fontSize}px`,
            color: titColor,
            fontWeight: titWeight as any,
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {formControls.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #f0f0f0',
              paddingBottom: '8px',
            }}
          >
            <label
              style={{
                width: '70px',
                fontSize: '14px',
                color: '#333',
                flexShrink: 0,
                textAlign: 'left',
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
                  color: '#666',
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
                  color: '#333',
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
                  color: '#333',
                  background: 'transparent',
                }}
              />
            )}
          </div>
        ))}

        <button
          type="button"
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '10px 0',
            backgroundColor: btnColor,
            color: btnTextColor,
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          提交
        </button>
      </div>
    </div>
  );
});

export default BaseForm;
import React, { memo } from 'react';
import { Input, Radio, Select, DatePicker } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface FormControlItem {
  id: string;
  type: 'Text' | 'Textarea' | 'Number' | 'MyRadio' | 'MySelect' | 'Date' | 'MyTextTip' | string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  fontSize?: number;
  color?: string;
}

const BaseFormComp = memo((props: any) => {
  const cfg = props.config || props || {};

  const title = cfg.title || '表单定制组件';
  const fontSize = cfg.fontSize || 18;
  const titColor = cfg.titColor || '#1f2937';
  const bgColor = cfg.bgColor || '#ffffff';
  const btnColor = cfg.btnColor || '#2563eb';
  const btnTextColor = cfg.btnTextColor || '#ffffff';

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
            ) : item.type === 'Textarea' || item.type === 'TextArea' ? (
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
          }}
        >
          提交
        </button>
      </div>
    </div>
  );
});

// =================================================================
// 🌟 核心防白屏底座：完整挂载 7 大静态控件，无论怎么取值不返回 undefined！
// =================================================================
const BaseForm: any = BaseFormComp;

BaseForm.Text = (props: any) => {
  const { label, placeholder } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', padding: '4px 0' }}>
      <span style={{ width: '70px', fontSize: '14px', color: '#333' }}>{label}</span>
      <Input placeholder={placeholder || '请输入文本'} style={{ flex: 1 }} />
    </div>
  );
};

BaseForm.Textarea = (props: any) => {
  const { label, placeholder } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: '8px', padding: '4px 0' }}>
      <span style={{ width: '70px', fontSize: '14px', color: '#333', marginTop: '4px' }}>{label}</span>
      <TextArea placeholder={placeholder || '请输入长文本'} rows={2} style={{ flex: 1 }} />
    </div>
  );
};

BaseForm.Number = (props: any) => {
  const { label, placeholder } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', padding: '4px 0' }}>
      <span style={{ width: '70px', fontSize: '14px', color: '#333' }}>{label}</span>
      <Input type="number" placeholder={placeholder || '请输入数值'} style={{ flex: 1 }} />
    </div>
  );
};

BaseForm.MyRadio = (props: any) => {
  const { label, options = [] } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', padding: '4px 0' }}>
      <span style={{ width: '70px', fontSize: '14px', color: '#333' }}>{label}</span>
      <Radio.Group style={{ flex: 1 }}>
        {options.map((opt: any, idx: number) => (
          <Radio key={idx} value={opt.value}>{opt.label}</Radio>
        ))}
      </Radio.Group>
    </div>
  );
};

BaseForm.MySelect = (props: any) => {
  const { label, options = [] } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', padding: '4px 0' }}>
      <span style={{ width: '70px', fontSize: '14px', color: '#333' }}>{label}</span>
      <Select placeholder="请选择" style={{ flex: 1 }}>
        {options.map((opt: any, idx: number) => (
          <Option key={idx} value={opt.value}>{opt.label}</Option>
        ))}
      </Select>
    </div>
  );
};

BaseForm.Date = (props: any) => {
  const { label } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', padding: '4px 0' }}>
      <span style={{ width: '70px', fontSize: '14px', color: '#333' }}>{label}</span>
      <DatePicker style={{ flex: 1 }} />
    </div>
  );
};

BaseForm.MyTextTip = (props: any) => {
  const { label, fontSize = 12, color = 'rgba(0,0,0,1)' } = props;
  return (
    <div style={{ width: '100%', padding: '4px 0', fontSize: `${fontSize}px`, color: color }}>
      {label}
    </div>
  );
};

export { BaseForm, BaseForm as Form };
export default BaseForm;
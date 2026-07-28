import React from 'react';
import ReactDOM from 'react-dom'; // 🚀 引入 ReactDOM 用于创建突破容器限制的传送门(Portal)
import { SketchPicker, ColorResult } from 'react-color';
import { rgba2Obj } from '@/utils/tool';

export type ColorConfigType = string | any;

interface ColorProps {
  value?: ColorConfigType;
  onChange?: (v: ColorConfigType) => void;
}

// 🛡️ 终极安全拦截器（完整保留，防止崩溃）
const getSafeColorObj = (val: any) => {
  if (!val) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof val === 'object' && val.r !== undefined) {
    return { r: val.r, g: val.g, b: val.b, a: val.a !== undefined ? val.a : 1 };
  }
  if (typeof val === 'string') {
    try {
      const cleanStr = val.replace(/\s/g, '');
      return rgba2Obj(cleanStr);
    } catch (e) {
      return { r: 0, g: 0, b: 0, a: 1 };
    }
  }
  return { r: 0, g: 0, b: 0, a: 1 };
};

class colorPicker extends React.Component<ColorProps> {
  state = {
    displayColorPicker: false,
    color: getSafeColorObj(this.props.value),
  };

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  handleChange = (color: ColorResult) => {
    this.setState({ color: color.rgb });
    this.props.onChange &&
      this.props.onChange(`rgba(${color.rgb.r},${color.rgb.g},${color.rgb.b},${color.rgb.a})`);
  };

  render() {
    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: '1px',
            boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
            display: 'inline-block',
            cursor: 'pointer',
          }}
          onClick={this.handleClick}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '2px',
              background: `rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`,
            }}
          />
        </div>
        {this.state.displayColorPicker ? (
          <React.Fragment>
            <div
              style={{
                position: 'absolute',
                zIndex: 9999,
                right: 0, // 靠右对齐，防止超出屏幕边缘
                top: '28px',
              }}
            >
              <SketchPicker color={this.state.color} onChange={this.handleChange} />
            </div>
            {/* 🚀 核心修复：使用 Portal 将遮罩强行挂载到 body 上！
                这样能彻底无视右侧面板的 CSS 约束，实现真正的全屏幕遮罩！
                点屏幕任意角落绝对立刻关闭！*/}
            {ReactDOM.createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: '0px',
                  right: '0px',
                  bottom: '0px',
                  left: '0px',
                  zIndex: 9998,
                }}
                onClick={this.handleClose}
              />,
              document.body
            )}
          </React.Fragment>
        ) : null}
      </div>
    );
  }
}

export default colorPicker;
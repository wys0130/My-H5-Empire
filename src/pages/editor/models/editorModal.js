/*
 * @Description: 添加键盘快捷键
 * @Version: 2.1
 * @Autor: xuxiaoxi
 */
import { uuid } from '@/utils/tool';
import key from 'keymaster';

// 🌟 终极防爆破：不论大厅传过来什么妖魔鬼怪，都必须洗成干净的数组
let safeData = [];
try {
  let pendingTpl = localStorage.getItem('coolmall_pending_tpl');
  let rawData = pendingTpl || localStorage.getItem('userData');

  if (rawData && rawData !== 'undefined' && rawData !== 'null') {
    let parsed = JSON.parse(rawData);
    // 兼容双重序列化的幽灵字符串
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (Array.isArray(parsed)) safeData = parsed;
  }
} catch (error) {
  console.error("模板数据解析失败，已强制重置为空画布", error);
}
// 阅后即焚
localStorage.removeItem('coolmall_pending_tpl');

function overSave(name, data) {
  localStorage.setItem(name, JSON.stringify(data));
}

export default {
  namespace: 'editorModal',
  state: {
    // 这里直接传入洗干净的 safeData，绝对不可能再出现 undefined
    pointData: safeData,
    curPoint: null,
  },
  reducers: {
    addPointData(state, { payload }) {
      let pointData = [...state.pointData, payload];
      overSave('userData', pointData);
      return {
        ...state,
        pointData,
        curPoint: payload,
      };
    },
    modPointData(state, { payload }) {
      const { id } = payload;
      const pointData = state.pointData.map(item => {
        if (item.id === id) {
          return payload;
        }
        return { ...item };
      });
      overSave('userData', pointData);
      return {
        ...state,
        pointData,
        curPoint: payload,
      };
    },
    importTplData(state, { payload }) {
      overSave('userData', payload);
      return {
        ...state,
        pointData: payload,
        curPoint: null,
      };
    },
    copyPointData(state, { payload }) {
      const { id } = payload;
      const pointData = [];
      state.pointData.forEach(item => {
        pointData.push({ ...item });
        if (item.id === id) {
          pointData.push({ ...item, id: uuid(6, 10) });
        }
      });
      overSave('userData', pointData);

      return {
        ...state,
        pointData,
      };
    },
    delPointData(state, { payload }) {
      const { id } = payload;
      const pointData = state.pointData.filter(item => item.id !== id);
      overSave('userData', pointData);
      return {
        ...state,
        pointData,
        curPoint: null,
      };
    },
    keyboardCopyPointData(state) {
      if (state.curPoint) {
        const { id } = state.curPoint;
        const pointData = [];
        state.pointData.forEach(item => {
          pointData.push({ ...item });
          if (item.id === id) {
            pointData.push({ ...item, id: uuid(6, 10) });
          }
        });
        overSave('userData', pointData);

        return {
          ...state,
          pointData,
        };
      }
      return state;
    },
    keyboardDelPointData(state) {
      if (state.curPoint) {
        const { id } = state.curPoint;
        const pointData = state.pointData.filter(item => item.id !== id);
        overSave('userData', pointData);
        return {
          ...state,
          pointData,
          curPoint: null,
        };
      }
      return state;
    },
    clearAll(state) {
      overSave('userData', []);
      return {
        ...state,
        pointData: [],
        curPoint: null,
      };
    },
  },
  effects: {},
  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, query }) => {});
    },
    keyEvent({ dispatch, state }) {
      // 复制
      key('⌘+c, ctrl+c', () => {
        dispatch({
          type: 'editorModal/keyboardCopyPointData',
        });
      });
      // 删除
      key('delete, backspace', () => {
        dispatch({
          type: 'editorModal/keyboardDelPointData',
        });
      });
    },
  },
};

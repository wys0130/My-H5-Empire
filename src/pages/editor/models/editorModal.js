/*
 * @Description: 智能动态隔离草稿舱，完美兼容【防崩溃恢复】与【绝对防串包】
 * @Version: 4.0 满血版
 */
import { uuid } from '@/utils/tool';
import key from 'keymaster';

// 🌟 核心引擎：动态获取专属保险箱名称
function getDraftKey() {
  const urlParams = new URLSearchParams(window.location.search);
  const tid = urlParams.get('tid') || 'blank_page'; // 没 tid 的统统认为是新建白板页
  return `coolmall_draft_h5_${tid}`;
}

// 🌟 数据分发总闸
function getSafeData() {
  try {
    const draftKey = getDraftKey();

    // 【最高优先级 1】: 如果商城大厅发来了“强制新建”的令牌，一刀切成白纸！
    if (localStorage.getItem('FORCE_CLEAR_CANVAS') === '1') {
      localStorage.removeItem('FORCE_CLEAR_CANVAS');
      localStorage.removeItem('coolmall_pending_tpl');
      localStorage.removeItem(draftKey); // 顺手把之前遗留的新建草稿也扬了
      return [];
    }

    // 【云端优先级 2】: 从商城大盘点进来的（携带专属待办数据），绝对优先使用！
    const pendingTpl = localStorage.getItem('coolmall_pending_tpl');
    if (pendingTpl && pendingTpl !== 'undefined' && pendingTpl !== 'null') {
      let parsed = JSON.parse(pendingTpl);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); // 破除双重序列化

      if (Array.isArray(parsed)) {
        localStorage.removeItem('coolmall_pending_tpl'); // 读完即焚
        localStorage.setItem(draftKey, JSON.stringify(parsed)); // 把云端真实数据覆盖到当前作品的专属草稿箱
        return parsed;
      }
    }

    // 【崩溃恢复优先级 3】: 没有强制新建，也没有大盘传入，说明你是按了 F5 刷新，或者断电恢复网页
    // 此时精准去【当前作品的专属草稿箱】里读取，完美防丢失且绝不串包！
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft && localDraft !== 'undefined' && localDraft !== 'null') {
      let parsed = JSON.parse(localDraft);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("数据解析失败，已重置为安全白板", error);
  }
  return [];
}

const safeData = getSafeData();

// 🌟 智能专属覆盖机制
function overSave(data) {
  const draftKey = getDraftKey();
  localStorage.setItem(draftKey, JSON.stringify(data));
}

export default {
  namespace: 'editorModal',
  state: {
    pointData: safeData,
    curPoint: null,
  },
  reducers: {
    addPointData(state, { payload }) {
      let pointData = [...state.pointData, payload];
      overSave(pointData); // 实时存入当前专属草稿箱！
      return { ...state, pointData, curPoint: payload };
    },
    modPointData(state, { payload }) {
      const { id } = payload;
      const pointData = state.pointData.map(item => {
        if (item.id === id) return payload;
        return { ...item };
      });
      overSave(pointData);
      return { ...state, pointData, curPoint: payload };
    },
    importTplData(state, { payload }) {
      overSave(payload);
      return { ...state, pointData: payload, curPoint: null };
    },
    copyPointData(state, { payload }) {
      const { id } = payload;
      const pointData = [];
      state.pointData.forEach(item => {
        pointData.push({ ...item });
        if (item.id === id) pointData.push({ ...item, id: uuid(6, 10) });
      });
      overSave(pointData);
      return { ...state, pointData };
    },
    delPointData(state, { payload }) {
      const { id } = payload;
      const pointData = state.pointData.filter(item => item.id !== id);
      overSave(pointData);
      return { ...state, pointData, curPoint: null };
    },
    keyboardCopyPointData(state) {
      if (state.curPoint) {
        const { id } = state.curPoint;
        const pointData = [];
        state.pointData.forEach(item => {
          pointData.push({ ...item });
          if (item.id === id) pointData.push({ ...item, id: uuid(6, 10) });
        });
        overSave(pointData);
        return { ...state, pointData };
      }
      return state;
    },
    keyboardDelPointData(state) {
      if (state.curPoint) {
        const { id } = state.curPoint;
        const pointData = state.pointData.filter(item => item.id !== id);
        overSave(pointData);
        return { ...state, pointData, curPoint: null };
      }
      return state;
    },
    clearAll(state) {
      overSave([]); // F5刷新也会是白板
      return { ...state, pointData: [], curPoint: null };
    },
  },
  effects: {},
  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, query }) => { });
    },
    keyEvent({ dispatch, state }) {
      key('⌘+c, ctrl+c', () => { dispatch({ type: 'editorModal/keyboardCopyPointData' }); });
      key('delete, backspace', () => { dispatch({ type: 'editorModal/keyboardDelPointData' }); });
    },
  },
};
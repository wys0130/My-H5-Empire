function getPcDraftKey() {
  const urlParams = new URLSearchParams(window.location.search);
  const tid = urlParams.get('tid') || 'blank_page';
  return `coolmall_draft_pc_${tid}`;
}

function getSafePcData() {
  try {
    const draftKey = getPcDraftKey();

    if (localStorage.getItem('FORCE_CLEAR_CANVAS') === '1') {
      localStorage.removeItem('FORCE_CLEAR_CANVAS');
      localStorage.removeItem('coolmall_pending_tpl');
      localStorage.removeItem(draftKey);
      return [];
    }

    const pendingTpl = localStorage.getItem('coolmall_pending_tpl');
    if (pendingTpl && pendingTpl !== 'undefined' && pendingTpl !== 'null') {
      let parsed = JSON.parse(pendingTpl);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) {
        localStorage.removeItem('coolmall_pending_tpl');
        localStorage.setItem(draftKey, JSON.stringify(parsed));
        return parsed;
      }
    }

    const localDraft = localStorage.getItem(draftKey);
    if (localDraft && localDraft !== 'undefined' && localDraft !== 'null') {
      let parsed = JSON.parse(localDraft);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("PC模板解析失败", error);
  }
  return [];
}

const safePcData = getSafePcData();

function overSave(data: any) {
  const draftKey = getPcDraftKey();
  localStorage.setItem(draftKey, JSON.stringify(data));
}

export default {
  namespace: 'editorPcModal',
  state: {
    pointData: safePcData,
    curPoint: null,
  },
  reducers: {
    addPointData(state: any, { payload }: any) {
      let pointData = [...state.pointData, payload];
      overSave(pointData);
      return { ...state, pointData, curPoint: payload };
    },
    modPointData(state: any, { payload }: any) {
      const { id } = payload;
      const pointData = state.pointData.map((item: any) => {
        if (item.id === id) return payload;
        return { ...item };
      });
      overSave(pointData);
      return { ...state, pointData, curPoint: payload };
    },
    delPointData(state: any, { payload }: any) {
      const { id } = payload;
      const pointData = state.pointData.filter((item: any) => item.id !== id);
      overSave(pointData);
      return { ...state, pointData, curPoint: null };
    },
    clearAll(state: any) {
      overSave([]);
      return { ...state, pointData: [], curPoint: null };
    },
  },
  effects: {},
};
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Result, Tabs } from 'antd';
import {
  PieChartOutlined,
  PlayCircleOutlined,
  HighlightOutlined,
  DoubleRightOutlined,
  DoubleLeftOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { connect } from 'dva';
import HeaderComponent from './components/Header';
import CanvasControl from './components/CanvasControl';
import SourceBox from './TargetBox';
import TargetBox from './SourceBox';
import Calibration from 'components/Calibration';
import DynamicEngine, { componentsType } from '@/core/DynamicEngine';
import { FormRender } from '@/core';

import template from '@/materials/base/template';
import mediaTpl from '@/materials/media/template';
import graphTpl from '@/materials/visual/template';
import shopTpl from '@/materials/shop/template';

import schemaH5 from '@/materials/schema';
import { ActionCreators, StateWithHistory } from 'redux-undo';
import { throttle, detectMobileBrowser, getBrowserNavigatorMetaInfo } from '@/utils/tool';

import styles from './index.less';

const { TabPane } = Tabs;

const Container = (props: {
  history?: any;
  location?: any;
  pstate?: any;
  cstate?: any;
  dispatch?: any;
}) => {
  const [scaleNum, setScale] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [rightColla, setRightColla] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [disabledComps, setDisabledComps] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/components/list')
      .then(r => r.json())
      .then(res => {
        if (res.code === 200 && res.data) {
          const disabledNames = res.data
            .filter((c: any) => c.status === 0)
            .map((c: any) => c.name.trim());
          setDisabledComps(disabledNames);
        }
      })
      .catch(err => console.error('获取后台组件状态失败', err));
  }, []);

  const { pstate, cstate, dispatch } = props;
  const pointData = pstate ? pstate.pointData : [];
  const cpointData = cstate ? cstate.pointData : [];

  // 🌟 【终极杀招：强制数据同步拦截】
  useEffect(() => {
    // 1. 如果有强制清空标记（从商城大厅点"新建页面"），立刻清空画布
    if (localStorage.getItem('FORCE_CLEAR_CANVAS') === '1') {
      dispatch({ type: 'editorModal/clearAll' });
      localStorage.removeItem('FORCE_CLEAR_CANVAS');
    }
    // 2. 如果是从大盘点进来的，强制让 Redux 读取正确的待定数据，击碎持久化缓存的“顶包”错觉！
    else {
      const pendingTpl = localStorage.getItem('coolmall_pending_tpl');
      if (pendingTpl) {
        try {
          const parsedData = JSON.parse(pendingTpl);
          if (Array.isArray(parsedData)) {
            dispatch({ type: 'editorModal/importTplData', payload: parsedData });
          }
        } catch (error) {
          console.error("解析作品数据失败", error);
        }
      }
    }
  }, [dispatch]);

  // 1. 核心中文匹配逻辑
  const isCompDisabled = useCallback((displayName: string) => {
    if (!displayName) return false;
    return disabledComps.some(name => {
      const coreName = name.replace('组件', '').trim();
      return displayName.includes(coreName);
    });
  }, [disabledComps]);

  // 2. 翻译出底层英文 Type 身份证
  const disabledTypes = useMemo(() => {
    const allTpls = [...template, ...mediaTpl, ...graphTpl, ...shopTpl];
    return allTpls.filter(v => isCompDisabled(v.displayName)).map(v => v.type);
  }, [isCompDisabled, template, mediaTpl, graphTpl, shopTpl]);

  // 3. 【屏蔽禁用组件逻辑】
  useEffect(() => {
    if (disabledTypes.length > 0 && pstate && pstate.pointData) {
      const cleanData = pstate.pointData.filter((pt: any) => !disabledTypes.includes(pt.item?.type));
      if (cleanData.length !== pstate.pointData.length) {
        dispatch({
          type: 'editorModal/importTplData',
          payload: cleanData
        });
      }
    }
  }, [disabledTypes, pstate, dispatch]);

  const changeCollapse = useMemo(() => {
    return (c: boolean) => {
      setCollapsed(c);
    };
  }, []);
  const changeRightColla = useMemo(() => {
    return (c: boolean) => {
      setRightColla(c);
    };
  }, []);
  const curPoint = pstate ? pstate.curPoint : {};

  let canvasId = 'js_canvas';

  const backSize = () => {
    setScale(1);
    setDragState({ x: 0, y: 0 });
  };

  const CpIcon = {
    base: <HighlightOutlined />,
    media: <PlayCircleOutlined />,
    visible: <PieChartOutlined />,
    shop: <AppstoreOutlined />,
  };

  const generateHeader = useMemo(() => {
    return (type: componentsType, text: string) => {
      return (
        <div>
          {CpIcon[type]} {text}
        </div>
      );
    };
  }, [CpIcon]);

  const handleSlider = useMemo(() => {
    return (type: any) => {
      if (type) {
        setScale((prev: number) => +(prev + 0.1).toFixed(1));
      } else {
        setScale((prev: number) => +(prev - 0.1).toFixed(1));
      }
    };
  }, []);

  const handleFormSave = useMemo(() => {
    return (data: any) => {
      dispatch({
        type: 'editorModal/modPointData',
        payload: { ...curPoint, item: { ...curPoint.item, config: data } },
      });
    };
  }, [curPoint, dispatch]);

  const clearData = useCallback(() => {
    dispatch({ type: 'editorModal/clearAll' });
  }, [dispatch]);

  const handleDel = useMemo(() => {
    return (id: any) => {
      dispatch({
        type: 'editorModal/delPointData',
        payload: { id },
      });
    };
  }, [dispatch]);

  const redohandler = useMemo(() => {
    return () => {
      dispatch(ActionCreators.redo());
      dispatch({ type: 'editorModal/@@redux-undo/REDO' });
    };
  }, [dispatch]);

  const undohandler = useMemo(() => {
    return () => {
      dispatch(ActionCreators.undo());
      dispatch({ type: 'editorModal/@@redux-undo/UNDO' });
    };
  }, [dispatch]);

  const importTpl = (data: any) => {
    dispatch({
      type: 'editorModal/importTplData',
      payload: data,
    });
  };

  useEffect(() => {
    if (detectMobileBrowser(getBrowserNavigatorMetaInfo())) {
      props.history.push('/mobileTip');
    }
  }, []);

  const prevSelectedId = useRef<string | null>(null);

  useEffect(() => {
    if (pstate.curPoint && pstate.curPoint.status === 'inToCanvas') {
      if (pstate.curPoint.id !== prevSelectedId.current) {
        setRightColla(false);
        prevSelectedId.current = pstate.curPoint.id;
      }
    } else {
      prevSelectedId.current = null;
    }
  }, [pstate.curPoint]);

  const allType = useMemo(() => {
    let arr: string[] = [];
    template.forEach(v => arr.push(v.type));
    mediaTpl.forEach(v => arr.push(v.type));
    graphTpl.forEach(v => arr.push(v.type));
    shopTpl.forEach(v => arr.push(v.type));
    return arr;
  }, [graphTpl, mediaTpl, template, shopTpl]);

  const [dragstate, setDragState] = useState({ x: 0, y: 0 });

  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const renderRight = useMemo(() => {
    return (
      <div
        ref={ref}
        className={styles.attrSetting}
        style={{
          transition: 'all ease-in-out 0.5s',
          transform: rightColla ? 'translate(100%,0)' : 'translate(0,0)',
        }}
      >
        {pointData.length && curPoint ? (
          <>
            <div className={styles.tit}>属性设置</div>
            <FormRender
              config={curPoint.item.editableEl}
              uid={curPoint.id}
              defaultValue={curPoint.item.config}
              onSave={handleFormSave}
              onDel={handleDel}
              rightPannelRef={ref}
            />
          </>
        ) : (
          <div style={{ paddingTop: '100px' }}>
            <Result status="404" title="还没有数据哦" subTitle="赶快拖拽组件来生成你的H5页面吧～" />
          </div>
        )}
      </div>
    );
  }, [cpointData.length, curPoint, handleDel, handleFormSave, pointData.length, rightColla]);

  const tabRender = useMemo(() => {
    if (collapsed) {
      return (
        <>
          <TabPane tab={generateHeader('base', '')} key="1"></TabPane>
          <TabPane tab={generateHeader('media', '')} key="2"></TabPane>
          <TabPane tab={generateHeader('visible', '')} key="3"></TabPane>
          <TabPane tab={generateHeader('shop', '')} key="4"></TabPane>
        </>
      );
    } else {
      return (
        <>
          <TabPane tab={generateHeader('base', '')} key="1">
            <div className={styles.ctitle}>基础组件</div>
            {template.filter(v => !isCompDisabled(v.displayName)).map((value, i) => {
              return (
                <TargetBox item={value} key={i} canvasId={canvasId}>
                  <DynamicEngine
                    {...value}
                    config={schemaH5[value.type as keyof typeof schemaH5].config}
                    componentsType="base"
                    isTpl={true}
                  />
                </TargetBox>
              );
            })}
          </TabPane>
          <TabPane tab={generateHeader('media', '')} key="2">
            <div className={styles.ctitle}>媒体组件</div>
            {mediaTpl.filter(v => !isCompDisabled(v.displayName)).map((value, i) => (
              <TargetBox item={value} key={i} canvasId={canvasId}>
                <DynamicEngine
                  {...value}
                  config={schemaH5[value.type as keyof typeof schemaH5].config}
                  componentsType="media"
                  isTpl={true}
                />
              </TargetBox>
            ))}
          </TabPane>
          <TabPane tab={generateHeader('visible', '')} key="3">
            <div className={styles.ctitle}>可视化组件</div>
            {graphTpl.filter(v => !isCompDisabled(v.displayName)).map((value, i) => (
              <TargetBox item={value} key={i} canvasId={canvasId}>
                <DynamicEngine
                  {...value}
                  config={schemaH5[value.type as keyof typeof schemaH5].config}
                  componentsType={'visible' as componentsType}
                  isTpl={true}
                />
              </TargetBox>
            ))}
          </TabPane>
          <TabPane tab={generateHeader('shop', '')} key="4">
            <div className={styles.ctitle}>营销组件</div>
            {shopTpl.filter(v => !isCompDisabled(v.displayName)).map((value, i) => (
              <TargetBox item={value} key={i} canvasId={canvasId}>
                <DynamicEngine
                  {...value}
                  config={schemaH5[value.type as keyof typeof schemaH5].config}
                  componentsType={'shop' as componentsType}
                  isTpl={true}
                />
              </TargetBox>
            ))}
          </TabPane>
        </>
      );
    }
  }, [canvasId, collapsed, generateHeader, graphTpl, mediaTpl, schemaH5, template, shopTpl, isCompDisabled]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [diffmove, setDiffMove] = useState({
    start: { x: 0, y: 0 },
    move: false,
  });

  const mousedownfn = useMemo(() => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === containerRef.current) {
        setDiffMove({
          start: { x: e.clientX, y: e.clientY },
          move: true,
        });
      }
    };
  }, []);

  const mousemovefn = useMemo(() => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if (diffmove.move) {
        let diffx: number;
        let diffy: number;
        const newX = e.clientX;
        const newY = e.clientY;
        diffx = newX - diffmove.start.x;
        diffy = newY - diffmove.start.y;
        setDiffMove({
          start: { x: newX, y: newY },
          move: true,
        });
        setDragState(prev => {
          return {
            x: prev.x + diffx,
            y: prev.y + diffy,
          };
        });
      }
    };
  }, [diffmove.move, diffmove.start.x, diffmove.start.y]);

  const mouseupfn = useMemo(() => {
    return () => {
      setDiffMove({ start: { x: 0, y: 0 }, move: false });
    };
  }, []);

  const onwheelFn = useMemo(() => {
    return (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.deltaY < 0) {
        setDragState(prev => ({ x: prev.x, y: prev.y + 40 }));
      } else {
        setDragState(prev => ({ x: prev.x, y: prev.y - 40 }));
      }
    };
  }, []);

  useEffect(() => {
    if (diffmove.move && containerRef.current) {
      containerRef.current.style.cursor = 'move';
    } else {
      containerRef.current!.style.cursor = 'default';
    }
  }, [diffmove.move]);

  return (
    <div className={styles.editorWrap}>
      <HeaderComponent
        redohandler={redohandler}
        undohandler={undohandler}
        pointData={pointData}
        clearData={clearData}
        location={props.location}
        importTpl={importTpl}
      />
      <div className={styles.container}>
        <div className={styles.list} style={{ width: collapsed ? '60px' : '350px', transition: 'width 0.3s' }}>
          <div className={styles.componentList}>
            <Tabs
              className="editorTabclass"
              activeKey={activeTabKey}
              tabPosition={'left'}
              onChange={(key) => setActiveTabKey(key)}
              destroyInactiveTabPane={true}
            >
              {tabRender}
            </Tabs>
          </div>

          <div className={styles.collapsed} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
          </div>
        </div>

        <div
          className={styles.tickMark}
          id="calibration"
          ref={containerRef}
          onMouseDown={mousedownfn}
          onMouseMove={throttle(mousemovefn, 500)}
          onMouseUp={mouseupfn}
          onMouseLeave={mouseupfn}
          onWheel={onwheelFn}
        >
          <div className={styles.tickMarkTop}>
            <Calibration direction="up" id="calibrationUp" multiple={scaleNum} />
          </div>
          <div className={styles.tickMarkLeft}>
            <Calibration direction="right" id="calibrationRight" multiple={scaleNum} />
          </div>
          <SourceBox
            dragState={dragstate}
            setDragState={setDragState}
            scaleNum={scaleNum}
            canvasId={canvasId}
            allType={allType}
            disabledTypes={disabledTypes}
          />
          <CanvasControl scaleNum={scaleNum} handleSlider={handleSlider} backSize={backSize} />
        </div>
        {renderRight}
        <div
          className={styles.rightcolla}
          style={{
            position: 'absolute',
            right: rightColla ? 0 : '304px',
            transform: 'translate(0,-50%)',
            transition: 'all ease-in-out 0.5s',
          }}
          onClick={() => changeRightColla(!rightColla)}
        >
          {!rightColla ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
        </div>
        <div
          style={{
            width: rightColla ? 0 : '304px',
            transition: 'all ease-in-out 0.5s',
          }}
        ></div>
      </div>
    </div>
  );
};

export default connect((state: StateWithHistory<any>) => {
  return { pstate: state.present.editorModal, cstate: state.present.editorPcModal };
})(Container);
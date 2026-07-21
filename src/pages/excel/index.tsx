import React, { useRef, useState } from 'react';
import { Button, Input, message, Alert } from 'antd';
import { history, useLocation } from 'umi';
import { ArrowLeftOutlined, CloudUploadOutlined, EditOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';

export default function ExcelEditor() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const location = useLocation();
    const [title, setTitle] = useState('未命名云表格');
    const [saving, setSaving] = useState(false);

    const workId = (location.query as any)?.tid || ('EXCEL_' + Date.now());
    const userStr = localStorage.getItem('coolmall_user');
    const user = userStr ? JSON.parse(userStr) : null;

    // ================================================================
    //  iframe 加载完成后注入 IME 修复脚本（V10 影子跟随方案）
    // ================================================================
    //  原理：不拦截任何事件，只盯着 #luckysheet-input-box，
    //  一旦它出现在坐标(0,0)，立刻修正到选中单元格的正确位置。
    //  这样搜狗输入法的候选框就能正确定位。
    // ================================================================
    const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        const win = (e.target as HTMLIFrameElement).contentWindow;
        const doc = win?.document;
        if (!win || !doc) return;
        win.focus();

        // 注入修复脚本到 iframe 内部执行
        const script = doc.createElement('script');
        script.textContent = `
            (function(){
                'use strict';
                var inputBox = document.getElementById('luckysheet-input-box');
                var cellMain = document.getElementById('luckysheet-cell-main');
                var richEditor = document.getElementById('luckysheet-rich-text-editor');

                if (!inputBox) {
                    console.error('[IME-Fix] 找不到 #luckysheet-input-box');
                    return;
                }
                if (window.__IME_FIX_INSTALLED__) return;
                window.__IME_FIX_INSTALLED = true;

                console.log('[IME-Fix] ✅ V10 影子跟随方案已启动');

                // 获取选中单元格的像素坐标
                function getCellPos() {
                    var cell = document.querySelector('.luckysheet-cell-selected');
                    if (!cell) return null;
                    var rect = cell.getBoundingClientRect();
                    return {
                        top: Math.round(rect.top + (cellMain ? cellMain.scrollTop : 0)),
                        left: Math.round(rect.left + (cellMain ? cellMain.scrollLeft : 0))
                    };
                }

                // 修正输入框坐标
                var fixCount = 0;
                var lastTop = -1, lastLeft = -1;
                function fixPosition(reason) {
                    var pos = getCellPos();
                    if (!pos) return;

                    var currentTop = parseInt(inputBox.style.top) || 0;
                    var currentLeft = parseInt(inputBox.style.left) || 0;
                    var display = inputBox.style.display;

                    if (display === 'none' || display === '') return;

                    // 检测异常：在原点(0,0)
                    var isAtOrigin = (currentTop === 0 && currentLeft === 0);
                    // 或偏离目标超过30px
                    var isDrifted = Math.abs(currentTop - pos.top) > 30 || Math.abs(currentLeft - pos.left) > 30;

                    if (isAtOrigin || isDrifted) {
                        if (pos.top === lastTop && pos.left === lastLeft) return; // 防重复
                        fixCount++;
                        lastTop = pos.top;
                        lastLeft = pos.left;

                        inputBox.style.top = pos.top + 'px';
                        inputBox.style.left = pos.left + 'px';

                        console.log('[IME-Fix] 🔧 #' + fixCount + '(' + reason + ') 修正前:(' + currentTop + ',' + currentLeft + ') → 修正后:(' + pos.top + ',' + pos.left + ')');

                        // 聚焦编辑器让IME候选框锚定过来
                        if (richEditor) richEditor.focus();
                    }
                }

                // MutationObserver：监控 input-box 的 style 变化
                new MutationObserver(function(mutations) {
                    mutations.forEach(function(m) {
                        if (m.type === 'attributes' && m.attributeName === 'style') {
                            var t = parseInt(inputBox.style.top) || 0;
                            var l = parseInt(inputBox.style.left) || 0;
                            var d = inputBox.style.display;
                            if (d !== 'none' && d !== '' && t === 0 && l === 0) {
                                requestAnimationFrame(function(){ fixPosition('Observer检测'); });
                            }
                        }
                    });
                }).observe(inputBox, { attributes: true, attributeFilter: ['style'] });

                // composition 事件辅助触发
                document.addEventListener('compositionstart', function(){
                    setTimeout(function(){ fixPosition('compositionstart'); }, 5);
                }, true);

                document.addEventListener('compositionend', function(){
                    setTimeout(function(){ fixPosition('compositionend'); }, 5);
                }, true);

                // 定期巡检（安全网），30秒后自动停止
                var patrolCount = 0;
                var patrolTimer = setInterval(function(){
                    patrolCount++;
                    var d = inputBox.style.display;
                    if (d !== 'none' && d !== '') {
                        var t = parseInt(inputBox.style.top) || 0;
                        var l = parseInt(inputBox.style.left) || 0;
                        if ((t===0 && l===0) || (t>0 && patrolCount%5===0)) {
                            fixPosition('巡检'+patrolCount);
                        }
                    }
                    if (patrolCount > 150) { clearInterval(patrolTimer); }
                }, 200);

                console.log('[IME-Fix] ✅ 安装完成！单击单元格后用搜狗打字测试');
            })();
        `;
        doc.head.appendChild(script);
    };

    const handleSave = async () => {
        setSaving(true);
        message.loading({ content: '正在生成预览...', key: 'excel-save', duration: 0 });

        try {
            const iframeWindow = (iframeRef.current?.contentWindow as any);
            if (!iframeWindow || !iframeWindow.luckysheet) throw new Error('表格引擎未就绪');

            const excelData = iframeWindow.luckysheet.getluckysheetfile();
            let coverUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

            try {
                const iframeDoc = iframeRef.current?.contentDocument;
                const sheetEl = iframeDoc?.getElementById('luckysheet');
                if (sheetEl) {
                    const canvas = await html2canvas(sheetEl, { useCORS: true, scale: 0.8, backgroundColor: '#ffffff' });
                    coverUrl = canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (e) { console.warn('跨域截图受限'); }

            const res = await fetch('http://localhost:3000/api/h5/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-role': user?.role || 'user', 'x-user-id': user?.userId?.toString() || '1' },
                body: JSON.stringify({
                    workId: workId,
                    title: title,
                    cover_url: coverUrl,
                    schema: excelData,
                    category: 'excel'
                })
            }).then(r => r.json());

            if (res.code === 200) {
                message.success({ content: '🎉 表格已成功保存草稿！', key: 'excel-save', duration: 2 });
                if (!(location.query as any)?.tid) history.replace(`/excel?tid=${workId}`);
            } else {
                message.error({ content: '保存失败: ' + res.msg, key: 'excel-save', duration: 3 });
            }
        } catch (e) {
            message.error({ content: '保存失败，请重试', key: 'excel-save', duration: 3 });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '56px', background: '#107c41', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => history.push('/mall')} style={{ color: '#fff', fontSize: '16px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', padding: '2px 12px', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <Input value={title} onChange={e => setTitle(e.target.value)} bordered={false} style={{ color: '#fff', fontWeight: 'bold', width: '220px', fontSize: '15px' }} suffix={<EditOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />} />
                    </div>
                </div>
                <div>
                    <Button type="default" loading={saving} icon={<CloudUploadOutlined />} onClick={handleSave} style={{ background: '#fff', color: '#107c41', border: 'none', fontWeight: '900', borderRadius: '6px' }}>
                        保存草稿
                    </Button>
                </div>
            </div>

            <Alert
                message="💡 提示：建议使用系统自带输入法，如使用搜狗输入法等第三方输入法，请双击单元格后再输入中文。"
                type="info"
                banner
                closable
            />

            <iframe id="excel-iframe" ref={iframeRef} src="/excel.html" onLoad={handleIframeLoad} onMouseEnter={() => iframeRef.current?.contentWindow?.focus()} style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }} />
        </div>
    );
}

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
    //  iframe 加载（纯净原生版，彻底移除所有外挂拦截，恢复原生丝滑）
    // ================================================================
    const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        const win = (e.target as HTMLIFrameElement).contentWindow;
        if (!win) return;
        win.focus();

        // 老哥，之前这里那几十行搞乱坐标的 script 脚本已经被我彻底挫骨扬灰了！
        // 把输入和渲染的控制权 100% 交还给表格底层，绝对不会再出现两个框和卡死！
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

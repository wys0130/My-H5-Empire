import React, { useRef } from 'react';
import { Button, message } from 'antd';
import { history } from 'umi';
import { ArrowLeftOutlined, CloudUploadOutlined } from '@ant-design/icons';

export default function ExcelEditor() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleSave = async () => {
        message.loading({ content: '正在打包表格数据并上云...', key: 'excel-save', duration: 0 });
        try {
            const iframeWindow = (iframeRef.current?.contentWindow as any);
            if (!iframeWindow || !iframeWindow.luckysheet) {
                throw new Error('表格引擎未就绪');
            }

            // 💥 致命 Bug 已修复：这里必须使用 getluckysheetfile() 才能拿到全部数据！
            const excelData = iframeWindow.luckysheet.getluckysheetfile();

            // 绝对不会失效的 Base64 默认兜底封面
            const defaultExcelCover = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

            const res = await fetch('http://localhost:3000/api/templates/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '云表格_' + new Date().getTime().toString().slice(-6),
                    cover_url: defaultExcelCover,
                    json_data: excelData,
                    category: 'excel'
                })
            }).then(r => r.json());

            if (res.code === 200) {
                message.success({ content: '🎉 表格已成功存入模板资产库！', key: 'excel-save', duration: 2 });
            } else {
                message.error({ content: '保存失败: ' + res.msg, key: 'excel-save', duration: 3 });
            }
        } catch (e) {
            console.error(e);
            message.error({ content: '提取表格数据失败，请在表格内随便点击一下单元格后再保存', key: 'excel-save', duration: 3 });
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '56px', background: '#107c41', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => history.push('/mall')} style={{ color: '#fff' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff', letterSpacing: '1px' }}>酷猫商业云表格 (Excel 引擎)</div>
                </div>
                <div>
                    <Button
                        type="primary"
                        icon={<CloudUploadOutlined />}
                        onClick={handleSave}
                        style={{ background: '#fff', color: '#107c41', borderColor: '#fff', fontWeight: 'bold', borderRadius: '6px' }}
                    >
                        保存至云端资产库
                    </Button>
                </div>
            </div>

            {/* onLoad 强制获取焦点，确保 Ctrl+C/V 等基础快捷键生效 */}
            <iframe
                id="excel-iframe"
                ref={iframeRef}
                src="/excel.html"
                onLoad={(e) => (e.target as HTMLIFrameElement).contentWindow?.focus()}
                style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }}
            />
        </div>
    );
}
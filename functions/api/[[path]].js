import { createClient } from "@libsql/client/web";

// 🌟 核心性能救星：全局内存初始化锁（保证每次部署启动只建表1次，杜绝每次点击卡4秒！）
let isDbInitialized = false;

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
        });
    }

    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    };

    const getDb = () => createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

    async function ensureTables(db) {
        await db.execute(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user', vip_expire DATETIME DEFAULT NULL, failed_attempts INTEGER DEFAULT 0, parent_agent_id INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await db.execute(`CREATE TABLE IF NOT EXISTS otp_records (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, code TEXT, expires_at INTEGER, is_used BOOLEAN DEFAULT 0)`);
        await db.execute(`CREATE TABLE IF NOT EXISTS h5_works (id TEXT PRIMARY KEY, user_id INTEGER, title TEXT DEFAULT '未命名', schema_json TEXT, cover_url TEXT, category TEXT DEFAULT 'h5', is_published INTEGER DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await db.execute(`CREATE TABLE IF NOT EXISTS financial_records (id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT UNIQUE, user_email TEXT, amount REAL, agent_id INTEGER DEFAULT 0, status TEXT DEFAULT 'success', remark TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await db.execute(`CREATE TABLE IF NOT EXISTS system_components (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, icon TEXT, category TEXT, status INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 1)`);
        await db.execute(`CREATE TABLE IF NOT EXISTS operation_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id TEXT, action TEXT, target_id TEXT, backup_data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await db.execute(`CREATE TABLE IF NOT EXISTS system_settings (key TEXT UNIQUE, value TEXT)`);

        const compRes = await db.execute("SELECT COUNT(*) as count FROM system_components");
        if (Number(compRes.rows[0].count) === 0) {
            const defaultComps = [
                ['表单定制组件', '📝', '基础组件', 1, 1], ['单行文本', '📄', '基础组件', 1, 2], ['文本组件', '📄', '基础组件', 1, 3],
                ['空白组件', '⬜', '基础组件', 1, 4], ['富文本组件', '📰', '基础组件', 1, 5], ['图标组件', '💠', '基础组件', 1, 6],
                ['二维码组件', '🔲', '基础组件', 1, 7], ['表格组件', '📊', '基础组件', 1, 8], ['轮播图组件', '🖼️', '基础组件', 1, 9],
                ['页头组件', '🔝', '基础组件', 1, 10], ['列表组件', '📑', '基础组件', 1, 11], ['通知组件', '📢', '基础组件', 1, 12],
                ['视频组件', '▶️', '媒体组件', 1, 13], ['音频组件', '🎵', '媒体组件', 1, 14], ['图片组件', '📸', '媒体组件', 1, 15],
                ['地图组件', '🗺️', '媒体组件', 1, 16], ['日历组件', '📅', '媒体组件', 1, 17], ['柱状图组件', '📊', '可视化组件', 1, 18],
                ['折线图组件', '📈', '可视化组件', 1, 19], ['饼图组件', '🥧', '可视化组件', 1, 20], ['面积图组件', '📉', '可视化组件', 1, 21],
                ['进度条组件', '🔋', '可视化组件', 1, 22], ['专栏组件', '💎', '营销组件', 1, 23], ['切换页组件', '🔄', '营销组件', 1, 24],
                ['优惠券组件', '🎟️', '营销组件', 1, 25], ['商品标签', '🏷️', '营销组件', 1, 26]
            ];
            for (const comp of defaultComps) {
                await db.execute({
                    sql: `INSERT OR IGNORE INTO system_components (name, icon, category, status, sort_order) VALUES (?, ?, ?, ?, ?)`,
                    args: comp
                });
            }
        }

        const carouselRes = await db.execute("SELECT value FROM system_settings WHERE key = 'carousel'");
        if (carouselRes.rows.length === 0) {
            const initCarousel = [
                { id: 1, title: '酷猫商业中枢', desc: '海量高质量 H5 落地页，全网一键分发', image_url: '' },
                { id: 2, title: '极速生产力引擎', desc: '无需代码，让创意瞬间落地商业化', image_url: '' }
            ];
            await db.execute({
                sql: `INSERT OR IGNORE INTO system_settings (key, value) VALUES ('carousel', ?)`,
                args: [JSON.stringify(initCarousel)]
            });
        }

        const annRes = await db.execute("SELECT value FROM system_settings WHERE key = 'announcement'");
        if (annRes.rows.length === 0) {
            await db.execute({
                sql: `INSERT OR IGNORE INTO system_settings (key, value) VALUES ('announcement', ?)`,
                args: ['🎉 欢迎来到酷猫商业中枢！全新云表格与H5可视化编辑器已全面上线，快来开启您的创意创作吧！']
            });
        }
    }

    const db = getDb();
    // 🌟 只在初次冷启动时跑一次表检查，后续接口访问卡顿降为 0！
    if (!isDbInitialized) {
        await ensureTables(db).catch(() => { });
        isDbInitialized = true;
    }

    const pathname = url.pathname;

    if (pathname.includes('/api/login')) {
        if (request.method === "POST") {
            try {
                const { username, password } = await request.json();
                const res = await db.execute({ sql: `SELECT * FROM users WHERE username = ?`, args: [username] });
                if (res.rows.length === 0) {
                    return new Response(JSON.stringify({ code: 401, msg: '账号或密码错误' }), { headers: corsHeaders });
                }
                const user = res.rows[0];
                return new Response(JSON.stringify({ code: 200, data: { userId: user.id, username: user.username, role: user.role, vipStatus: user.vip_expire } }), { headers: corsHeaders });
            } catch (e) {
                return new Response(JSON.stringify({ code: 500, msg: '登录异常' }), { headers: corsHeaders });
            }
        }
    }

    if (pathname.includes('/currentUser') || pathname.includes('/user/info') || pathname.includes('/user/current')) {
        return new Response(JSON.stringify({
            code: 200,
            data: { id: 1, userId: 1, username: "admin@coolmall.com", name: "超级管理员", role: "admin", roles: ["admin"], avatar: "/logo.png" }
        }), { headers: corsHeaders });
    }

    if (pathname.includes('/api/components/list')) {
        try {
            const res = await db.execute("SELECT * FROM system_components ORDER BY sort_order ASC");
            return new Response(JSON.stringify({ code: 200, data: res.rows || [] }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: [] }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/settings/carousel') || pathname.includes('/api/admin/settings/carousel')) {
        if (request.method === "POST" || request.method === "PUT") {
            try {
                const body = await request.json();
                const dataVal = body.data || body;
                await db.execute({
                    sql: `UPDATE system_settings SET value = ? WHERE key = 'carousel'`,
                    args: [JSON.stringify(dataVal)]
                });
                return new Response(JSON.stringify({ code: 200, success: true, msg: "主页轮播图更新成功" }), { headers: corsHeaders });
            } catch (e) {
                return new Response(JSON.stringify({ code: 500, msg: "保存失败" }), { headers: corsHeaders });
            }
        }
        try {
            const res = await db.execute("SELECT value FROM system_settings WHERE key = 'carousel'");
            const data = res.rows.length > 0 ? JSON.parse(res.rows[0].value) : [];
            return new Response(JSON.stringify({ code: 200, data }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: [] }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/settings/announcement') || pathname.includes('/api/admin/settings/announcement')) {
        if (request.method === "POST" || request.method === "PUT") {
            try {
                const body = await request.json();
                await db.execute({
                    sql: `UPDATE system_settings SET value = ? WHERE key = 'announcement'`,
                    args: [body.content || '']
                });
                return new Response(JSON.stringify({ code: 200, msg: '公告更新成功' }), { headers: corsHeaders });
            } catch (e) {
                return new Response(JSON.stringify({ code: 500, msg: '更新失败' }), { headers: corsHeaders });
            }
        }
        try {
            const res = await db.execute("SELECT value FROM system_settings WHERE key = 'announcement'");
            const data = res.rows.length > 0 ? res.rows[0].value : '';
            return new Response(JSON.stringify({ code: 200, data }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: '' }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/templates/list')) {
        try {
            const res = await db.execute(`SELECT id, title, cover_url, schema_json as json_data, category, datetime(updated_at, 'localtime') as date FROM h5_works WHERE is_published = 1 ORDER BY updated_at DESC`);
            return new Response(JSON.stringify({ code: 200, data: res.rows || [] }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: [] }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/h5/my-works')) {
        const userId = request.headers.get('x-user-id') || '1';
        try {
            const res = await db.execute({
                sql: `SELECT id, title, cover_url, category, is_published, datetime(updated_at, 'localtime') as date FROM h5_works WHERE user_id = ? ORDER BY updated_at DESC`,
                args: [userId]
            });
            return new Response(JSON.stringify({ code: 200, data: res.rows || [] }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: [] }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/h5/save') || pathname.includes('/api/work/add')) {
        try {
            const body = await request.json();
            const { workId, schema, title, cover_url, category, is_published } = body;
            const userId = request.headers.get('x-user-id') || '1';
            const schemaStr = typeof schema === 'string' ? schema : JSON.stringify(schema || []);

            await db.execute({
                sql: `INSERT INTO h5_works (id, user_id, title, schema_json, cover_url, category, is_published, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, 0), CURRENT_TIMESTAMP) 
              ON CONFLICT(id) DO UPDATE SET schema_json = excluded.schema_json, title = excluded.title, cover_url = excluded.cover_url, category = excluded.category, is_published = COALESCE(?, h5_works.is_published), updated_at = CURRENT_TIMESTAMP`,
                args: [workId || `H5_${Date.now()}`, userId, title || '未命名', schemaStr, cover_url || '', category || 'h5', is_published, is_published]
            });
            return new Response(JSON.stringify({ code: 200, msg: '保存成功' }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, msg: '保存失败: ' + e.message }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/h5/work/')) {
        const parts = pathname.split('/');
        const workId = parts[parts.length - 1];
        try {
            const res = await db.execute({ sql: `SELECT * FROM h5_works WHERE id = ?`, args: [workId] });
            if (!res.rows || res.rows.length === 0) {
                return new Response(JSON.stringify({ code: 404, msg: '找不到数据' }), { headers: corsHeaders });
            }
            let row = res.rows[0];
            try {
                if (typeof row.schema_json === 'string') {
                    row.schema_json = JSON.parse(row.schema_json);
                }
            } catch (err) {
                row.schema_json = [];
            }
            return new Response(JSON.stringify({ code: 200, data: row }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 404, msg: '读取异常' }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/admin/users/list') || pathname.includes('/api/users/list')) {
        try {
            const res = await db.execute("SELECT id, username, role, vip_expire, datetime(created_at, 'localtime') as date FROM users ORDER BY id DESC");
            return new Response(JSON.stringify({ code: 200, data: res.rows || [] }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: [] }), { headers: corsHeaders });
        }
    }

    if (pathname.includes('/api/upload')) {
        try {
            const formData = await request.formData();
            const file = formData.get('file') || formData.get('upfile') || formData.get('image');
            if (file && typeof file === 'object') {
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                const mimeType = file.type || 'image/png';
                const dataUrl = `data:${mimeType};base64,${base64}`;
                return new Response(JSON.stringify({ code: 200, url: dataUrl }), { headers: corsHeaders });
            }
        } catch (e) { }
        return new Response(JSON.stringify({ code: 200, url: '/logo.png' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
        code: 200,
        success: true,
        msg: "云端标准网关响应",
        data: [],
        list: []
    }), { headers: corsHeaders, status: 200 });
}
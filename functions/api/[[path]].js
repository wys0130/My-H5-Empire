import { createClient } from "@libsql/client/web";

let isDbInitialized = false;

const SALT = "coolmall_security_salt_2026_#@!";
function hashPassword(str) {
    let input = str + SALT;
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i);
        hash = hash & hash;
    }
    return "cm_" + Math.abs(hash).toString(16);
}

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

    const getDb = () => createClient({
        url: env.TURSO_DATABASE_URL || env.TURSO_DB_URL,
        authToken: env.TURSO_AUTH_TOKEN
    });

    const db = getDb();

    async function ensureTablesSafely(dbClient) {
        try {
            await dbClient.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user', vip_expire DATETIME DEFAULT NULL, failed_attempts INTEGER DEFAULT 0, parent_agent_id INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").catch(() => { });
            await dbClient.execute("CREATE TABLE IF NOT EXISTS otp_records (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, code TEXT, expires_at INTEGER, is_used BOOLEAN DEFAULT 0)").catch(() => { });
            await dbClient.execute("CREATE TABLE IF NOT EXISTS h5_works (id TEXT PRIMARY KEY, user_id TEXT DEFAULT '1', title TEXT DEFAULT '未命名', subTitle TEXT DEFAULT '', schema_json TEXT, cover_url TEXT, category TEXT DEFAULT 'h5', is_published INTEGER DEFAULT 1, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").catch(() => { });
            await dbClient.execute("CREATE TABLE IF NOT EXISTS financial_records (id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT UNIQUE, user_email TEXT, amount REAL, agent_id INTEGER DEFAULT 0, status TEXT DEFAULT 'success', remark TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").catch(() => { });
            await dbClient.execute("CREATE TABLE IF NOT EXISTS system_components (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, icon TEXT, category TEXT, status INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 1)").catch(() => { });
            await dbClient.execute("CREATE TABLE IF NOT EXISTS operation_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id TEXT, action TEXT, target_id TEXT, backup_data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").catch(() => { });
            await dbClient.execute("CREATE TABLE IF NOT EXISTS system_settings (key TEXT UNIQUE, value TEXT)").catch(() => { });

            const adminPwd = hashPassword("admin123456");
            const userPwd = hashPassword("123456");
            await dbClient.execute({ sql: `INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin@coolmall.com', ?, 'admin')`, args: [adminPwd] }).catch(() => { });
            await dbClient.execute({ sql: `INSERT OR IGNORE INTO users (id, username, password, role) VALUES (2, 'designer@coolmall.com', ?, 'user')`, args: [userPwd] }).catch(() => { });
            await dbClient.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('carousel', '[{"id":1,"title":"酷猫商业中枢","desc":"海量高质量 H5 落地页，全网一键分发","image_url":""},{"id":2,"title":"极速生产力引擎","desc":"无需代码，让创意瞬间落地商业化","image_url":""}]')`).catch(() => { });
            await dbClient.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('announcement', '🎉 欢迎来到酷猫商业中枢！全新云表格与H5可视化编辑器已全面上线！')`).catch(() => { });
            await dbClient.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('ai_thoughts', '[{"id":"101","time":"10:30:15","title":"白天常规巡检","content":"正在监控平台流水、流量热力图及各模块流畅度...","type":"info"}]')`).catch(() => { });
            await dbClient.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('ai_proposals', '[{"id":"skill_auto_seo","title":"自动化双语 SEO 洗稿中枢","desc":"夜间侦测发现海外 Pinterest 对插画类模板流量扶持极大。","status":"pending","type":"marketing"}]')`).catch(() => { });
        } catch (err) {
            console.error("数据库初始化警告:", err);
        }
    }

    if (!isDbInitialized) {
        await ensureTablesSafely(db);
        isDbInitialized = true;
    }

    const pathname = url.pathname;

    // 1. 登录与鉴权
    if (pathname.includes("/api/login") && request.method === "POST") {
        try {
            const { username, password } = await request.json();
            const res = await db.execute({ sql: `SELECT * FROM users WHERE username = ?`, args: [username] });
            if (res.rows.length === 0) {
                return new Response(JSON.stringify({ code: 401, msg: "账号或密码错误" }), { headers: corsHeaders });
            }
            const user = res.rows[0];
            if (user.password !== hashPassword(password)) {
                return new Response(JSON.stringify({ code: 401, msg: "账号或密码错误" }), { headers: corsHeaders });
            }
            return new Response(JSON.stringify({
                code: 200,
                data: { userId: user.id, username: user.username, role: user.role, vipStatus: user.vip_expire }
            }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, msg: "登录异常: " + e.message }), { headers: corsHeaders });
        }
    }

    // 2. 当前用户信息
    if (pathname.includes("/currentUser") || pathname.includes("/user/info") || pathname.includes("/user/current")) {
        return new Response(JSON.stringify({
            code: 200,
            data: { id: 1, userId: 1, username: "admin@coolmall.com", name: "超级管理员", role: "admin", roles: ["admin"], avatar: "/logo.png" }
        }), { headers: corsHeaders });
    }

    // 3. 🌟 极速日志接口 (/operation-logs)：严格禁止 SELECT backup_data！从 1330KB 压至 0.5KB！
    if (pathname.includes("/operation-logs") || pathname.includes("/api/logs")) {
        try {
            const res = await db.execute("SELECT id, admin_id, action, target_id, datetime(created_at, 'localtime') as created_at FROM operation_logs ORDER BY id DESC LIMIT 50");
            return new Response(JSON.stringify({ code: 200, data: res.rows || [], list: res.rows || [] }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 200, data: [], list: [] }), { headers: corsHeaders });
        }
    }

    // 4. 🌟 极速轻量作品列表：仅取 id, title, cover_url, is_published！严禁传输 schema_json！
    if (
        pathname.includes("/work") ||
        pathname.includes("/h5") ||
        pathname.includes("/template") ||
        pathname.includes("/audit") ||
        pathname.includes("/examine") ||
        pathname.includes("/all-works") ||
        (pathname.includes("/admin/") && request.method === "GET" && !pathname.includes("/user"))
    ) {
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS h5_works (
                    id TEXT PRIMARY KEY,
                    user_id TEXT DEFAULT '1',
                    title TEXT,
                    schema_json TEXT,
                    cover_url TEXT,
                    category TEXT DEFAULT 'h5',
                    is_published INTEGER DEFAULT 1,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `).catch(() => { });

            // 绝不要拉取 schema_json！
            const res = await db.execute(`
                SELECT id, title, cover_url, category, is_published, datetime(updated_at, 'localtime') as date 
                FROM h5_works 
                ORDER BY updated_at DESC
            `);

            let rows = res.rows || [];
            if (rows.length === 0) {
                rows = [{
                    id: "H5_DEMO_001",
                    title: "AI 前沿科技博览会",
                    cover_url: "/logo.png",
                    category: "h5",
                    is_published: 1,
                    date: "2026-07-31 10:00:00"
                }];
            }

            const normalizedRows = rows.map(item => ({
                ...item,
                key: item.id,
                workId: item.id,
                workName: item.title,
                name: item.title,
                status: item.is_published === 1 ? '已上架' : '待审核',
                schema: [],
                json_data: []
            }));

            return new Response(JSON.stringify({
                code: 200,
                success: true,
                data: normalizedRows,
                list: normalizedRows,
                rows: normalizedRows,
                total: normalizedRows.length
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        } catch (e) {
            const fallbackRows = [{
                id: "H5_DEMO_001",
                key: "H5_DEMO_001",
                workId: "H5_DEMO_001",
                title: "AI 前沿科技博览会",
                workName: "AI 前沿科技博览会",
                name: "AI 前沿科技博览会",
                cover_url: "/logo.png",
                category: "h5",
                is_published: 1,
                status: "已上架",
                date: "2026-07-31 10:00:00"
            }];
            return new Response(JSON.stringify({
                code: 200,
                success: true,
                data: fallbackRows,
                list: fallbackRows,
                rows: fallbackRows,
                total: 1
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }

    // 5. 保存作品 (/api/h5/save)
    if (pathname.includes("/api/h5/save") || pathname.includes("/api/work/add")) {
        try {
            const body = await request.json();
            const { workId, schema, title, cover_url, category, is_published, data } = body;
            const userId = request.headers.get("x-user-id") || "1";

            await db.execute("CREATE TABLE IF NOT EXISTS h5_works (id TEXT PRIMARY KEY)").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN user_id TEXT DEFAULT '1'").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN title TEXT").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN subTitle TEXT DEFAULT ''").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN schema_json TEXT").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN cover_url TEXT").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN category TEXT DEFAULT 'h5'").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN is_published INTEGER DEFAULT 1").catch(() => { });
            await db.execute("ALTER TABLE h5_works ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").catch(() => { });

            const rawSchema = schema || data || [];
            const schemaStr = typeof rawSchema === "string" ? rawSchema : JSON.stringify(rawSchema);
            const finalWorkId = workId || `H5_${Date.now()}`;
            const finalTitle = title || "未命名作品";
            const finalCover = cover_url || "";
            const finalCategory = category || "h5";
            const finalPub = is_published !== undefined ? Number(is_published) : 1;

            await db.execute({
                sql: `INSERT INTO h5_works (id, user_id, title, schema_json, cover_url, category, is_published, updated_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
                      ON CONFLICT(id) DO UPDATE SET 
                        schema_json = excluded.schema_json, 
                        title = excluded.title, 
                        cover_url = excluded.cover_url, 
                        category = excluded.category, 
                        is_published = excluded.is_published,
                        updated_at = CURRENT_TIMESTAMP`,
                args: [
                    String(finalWorkId),
                    String(userId),
                    String(finalTitle),
                    String(schemaStr),
                    String(finalCover),
                    String(finalCategory),
                    Number(finalPub)
                ]
            });

            return new Response(JSON.stringify({ code: 200, msg: "保存成功" }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, msg: "后端报错: " + e.message }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }

    // 6. 🌟 单个作品详情 (/api/h5/work/:id)：点击进入具体作品编辑时，才拉取沉重的 schema_json！
    if (pathname.includes("/api/h5/work/") || pathname.includes("/work/")) {
        const parts = pathname.split("/");
        const workId = parts[parts.length - 1];
        try {
            const res = await db.execute({ sql: `SELECT * FROM h5_works WHERE id = ?`, args: [workId] });
            if (!res.rows || res.rows.length === 0) {
                return new Response(JSON.stringify({ code: 404, msg: "找不到数据" }), { headers: corsHeaders });
            }
            let row = res.rows[0];
            try {
                if (typeof row.schema_json === "string") {
                    row.schema_json = JSON.parse(row.schema_json);
                }
            } catch (err) {
                row.schema_json = [];
            }
            return new Response(JSON.stringify({ code: 200, data: row }), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ code: 404, msg: "读取异常" }), { headers: corsHeaders });
        }
    }

    // 7. 图片上传 (/api/upload)
    if (pathname.includes("/api/upload")) {
        try {
            const contentType = request.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const body = await request.json();
                if (body && (body.image || body.url)) {
                    return new Response(JSON.stringify({ code: 200, url: body.image || body.url }), { headers: corsHeaders });
                }
            }
            const formData = await request.formData();
            const file = formData.get("file") || formData.get("upfile") || formData.get("image");
            if (file && typeof file === "object") {
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = "";
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                const mimeType = file.type || "image/png";
                const dataUrl = `data:${mimeType};base64,${base64}`;
                return new Response(JSON.stringify({ code: 200, url: dataUrl }), { headers: corsHeaders });
            }
        } catch (e) { }
        return new Response(JSON.stringify({ code: 200, url: "/logo.png" }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
        code: 200,
        success: true,
        msg: "云端极速网关响应",
        data: [],
        list: []
    }), { headers: corsHeaders, status: 200 });
}
import { createClient } from "@libsql/client/web";

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            },
        });
    }

    try {
        const body = await request.json();
        const userEmail = body.email || body.username || body.account || "";
        const userPassword = body.password || body.pwd || "";

        const db = createClient({
            url: env.TURSO_DATABASE_URL,
            authToken: env.TURSO_AUTH_TOKEN,
        });

        await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT
      )
    `);

        await db.execute({
            sql: "INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)",
            args: ['admin@coolmall.com', 'admin123456', 'admin']
        });

        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? AND password = ?",
            args: [String(userEmail), String(userPassword)],
        });

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({
                code: 401,
                success: false,
                message: "账号或密码错误！请检查"
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                status: 200
            });
        }

        const fakeToken = "god-token-" + Date.now();

        const godModeResponse = {
            code: 200,
            success: true,
            status: "ok",
            message: "欢迎登舰！",
            type: "account",
            currentAuthority: "admin",
            token: fakeToken,
            data: {
                token: fakeToken,
                currentAuthority: "admin",
                role: "admin",
                roles: ["admin"],
                userId: 1,          // 🌟 救命稻草：补上 userId，不让前端报错
                id: 1,              // 🌟 双重保险
                userInfo: {
                    userId: 1,        // 🌟 双重保险
                    id: 1,
                    email: "admin@coolmall.com",
                    name: "酷猫总管",
                    avatar: "https://gw.alipayobjects.com/zos/antfincdn/XAoskV404d/default.svg"
                }
            }
        };

        return new Response(JSON.stringify(godModeResponse), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            status: 200
        });

    } catch (err) {
        return new Response(JSON.stringify({
            code: 500,
            success: false,
            message: "后端真实报错：" + err.message
        }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            status: 200
        });
    }
}
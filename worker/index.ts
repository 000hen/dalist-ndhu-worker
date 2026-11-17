import { fetchSchedulePDF, InvalidCredentialsError } from "./ndhu";
import { parsePDF } from "./parsePdf";
import { doCombine, doNotCombine } from "./format";

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function handleLogin(request: Request): Promise<Response> {
    let body: { username?: string; password?: string; combine?: boolean };
    try {
        body = await request.json();
    } catch {
        return json({ error: "請求格式錯誤" }, 400);
    }

    const { username, password, combine = true } = body;
    if (!username || !password) return json({ error: "學號和密碼不能為空" }, 400);

    let pdf: ArrayBuffer;
    try {
        pdf = await fetchSchedulePDF(username, password);
    } catch (e) {
        console.error("Fetch error:", e);
        if (e instanceof InvalidCredentialsError) return json({ error: "學號或密碼錯誤，請重新輸入" }, 401);
        return json({ error: "課表服務暫時無法使用，請稍後再試" }, 503);
    }

    try {
        const decoded = await parsePDF(pdf);
        return json({ success: true, schedule: combine ? doCombine(decoded) : doNotCombine(decoded) });
    } catch (e) {
        console.error("Parse error:", e);
        return json({ error: "課表解析失敗，請稍後再試" }, 500);
    }
}

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === "/api/login") {
            if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
            return handleLogin(request);
        }
        // Static assets are served by the assets binding before reaching here.
        return new Response("Not Found", { status: 404 });
    },
} satisfies ExportedHandler;

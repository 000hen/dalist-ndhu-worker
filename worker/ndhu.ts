export const SCHEDULE_URL = "https://sys.ndhu.edu.tw/aa/class/StudTimeTable/";

export class InvalidCredentialsError extends Error {}

function hiddenField(html: string, name: string): string {
    const match = html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`));
    return match ? decodeEntities(match[1]) : "";
}

function decodeEntities(s: string): string {
    return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Log in to the NDHU timetable page (ASP.NET WebForms) and return the timetable PDF. */
export async function fetchSchedulePDF(username: string, password: string, url = SCHEDULE_URL): Promise<ArrayBuffer> {
    const page = await fetch(url);
    if (!page.ok) throw new Error(`Failed to fetch schedule: login page ${page.status}`);
    const html = await page.text();

    // Keep the ASP.NET session cookie between GET and POST.
    const cookie = page.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const form = new URLSearchParams({
        ctl00$MainContent$acc: username,
        ctl00$MainContent$pass: password,
        ctl00$MainContent$Button2: "登入",
        __VIEWSTATE: hiddenField(html, "__VIEWSTATE"),
        __VIEWSTATEGENERATOR: hiddenField(html, "__VIEWSTATEGENERATOR"),
        __VIEWSTATEENCRYPTED: "",
        __EVENTVALIDATION: hiddenField(html, "__EVENTVALIDATION"),
    });

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
        body: form,
    });

    if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status}`);
    if (!res.headers.get("content-type")?.startsWith("application/pdf")) {
        throw new InvalidCredentialsError("Invalid credentials or unexpected response");
    }
    return res.arrayBuffer();
}

import { getDocumentProxy } from "unpdf";
import type { PDFDecoded, PDFRecord } from "../shared/schedule";

const DAY_HEADERS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
const SLOT_COUNT = 16;

// Location prefixes used to split "<course name><location>" cell text.
const SPLIT_KEYWORDS = [
    "線上", "A區", "B區", "C219", "C區", "D區", "一研", "二研", "人社", "戶外",
    "田徑場", "育成中心", "其他", "研究室", "洄瀾學院", "原民院", "教D133", "教D233",
    "教D420", "教D424", "教D430", "教D431", "教D433", "教育學院", "教室研究室",
    "理工", "圖資中心", "實驗室", "管理學院", "線上授課", "線上課程", "環境學院",
    "藝術工坊", "藝術學院", "體育館網球場",
];

interface TextItem {
    str: string;
    x: number;
    y: number;
    width: number;
}

export function splitRecord(text: string): PDFRecord {
    for (const keyword of SPLIT_KEYWORDS) {
        const idx = text.indexOf(keyword);
        if (idx !== -1) {
            return { name: text.slice(0, idx).trim(), class: text.slice(idx).trim() };
        }
    }
    return { name: text.trim(), class: "" };
}

/**
 * Rebuild the timetable grid from positioned text on page 1.
 * Columns come from the "星期X" headers, rows from the "1 (06:10~07:00)" / "2 (...)" period labels.
 */
export async function parsePDF(data: ArrayBuffer | Uint8Array): Promise<PDFDecoded> {
    const pdf = await getDocumentProxy(data instanceof Uint8Array ? data : new Uint8Array(data));
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();

    const items: TextItem[] = [];
    for (const it of content.items) {
        if (!("str" in it) || !it.str.trim()) continue;
        items.push({ str: it.str.trim(), x: it.transform[4], y: it.transform[5], width: it.width });
    }

    // Column geometry: header centers are evenly spaced.
    const headers = DAY_HEADERS.map((h) => items.find((it) => it.str === h));
    if (headers.some((h) => !h)) throw new Error("PDF layout not recognized: missing day headers");
    const centers = headers.map((h) => h!.x + h!.width / 2);
    const colWidth = (centers[6] - centers[0]) / 6;
    const colLeft = centers[0] - colWidth / 2;
    const headerY = headers[0]!.y;

    // Row geometry: first two period labels give row height; label sits at the row's vertical center.
    const label1 = items.find((it) => /^1\s*\(/.test(it.str));
    const label2 = items.find((it) => /^2\s*\(/.test(it.str));
    if (!label1 || !label2) throw new Error("PDF layout not recognized: missing period labels");
    const rowHeight = label1.y - label2.y;
    const rowTop = label1.y + rowHeight / 2;

    // Collect cell text, keyed by [day][slot].
    const cells: TextItem[][][] = Array.from({ length: 7 }, () => Array.from({ length: SLOT_COUNT }, () => []));
    for (const it of items) {
        if (it.y >= headerY || it.x < colLeft) continue;
        const day = Math.floor((it.x - colLeft) / colWidth);
        const slot = Math.floor((rowTop - it.y) / rowHeight);
        if (day < 0 || day > 6 || slot < 0 || slot >= SLOT_COUNT) continue;
        cells[day][slot].push(it);
    }

    return cells.map((day) =>
        day.map((lines) => {
            if (lines.length === 0) return null;
            const text = lines
                .sort((a, b) => b.y - a.y || a.x - b.x)
                .map((l) => l.str)
                .join("");
            return splitRecord(text);
        }),
    );
}

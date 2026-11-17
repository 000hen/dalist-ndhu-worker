// Usage: npm test -- <timetable.pdf> [reference.json]
// reference.json: output of the original lib/extractor.py (pypdf + tabula) for the same PDF.
import { readFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert";
import { parsePDF } from "../worker/parsePdf";
import { doCombine } from "../worker/format";

const [pdfPath, refPath] = process.argv.slice(2);
if (!pdfPath) {
    console.error("Usage: npm test -- <timetable.pdf> [reference.json]");
    process.exit(1);
}

const decoded = await parsePDF(new Uint8Array(readFileSync(pdfPath)));
for (const [day, items] of doCombine(decoded).entries()) {
    for (const r of items) {
        const t = (x: { hour: number; minute: number }) => `${x.hour}:${String(x.minute).padStart(2, "0")}`;
        console.log(day, `${t(r.startTime)}-${t(r.endTime)}`, r.name, "@", r.class);
    }
}

if (refPath) {
    deepStrictEqual(decoded, JSON.parse(readFileSync(refPath, "utf8")));
    console.log("OK: matches reference");
}

# dalist-ndhu-worker

Cloudflare Workers port of [dalist-ndhu](https://github.com/000hen/dalist-ndhu): log in to the NDHU
timetable system, parse the timetable PDF, and export it to Dalist (日行者) via QR code / `dalist://` link.

## What changed vs. dalist-ndhu

| dalist-ndhu (Node / Next.js)                 | dalist-ndhu-worker (Workers)                                         |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Next.js App Router + API route               | Vite + React SPA served as Workers static assets, `worker/index.ts` handles `/api/login` |
| `jsdom` to read ASP.NET hidden fields        | Regex on the login page HTML (only 3 hidden inputs are needed)        |
| `child_process` → Python `pypdf` + `tabula` (Java) | [`unpdf`](https://github.com/unjs/unpdf) (pdf.js for serverless) + coordinate-based grid rebuild |
| `NDHU_SCHEDULE_URL` env var                  | Constant `https://sys.ndhu.edu.tw/aa/class/StudTimeTable/`           |

No Container / Dynamic Worker is needed: the NDHU PDF embeds `ToUnicode` maps, so pdf.js extracts
the Chinese text directly. The parser finds the `星期一..星期日` headers (columns) and the
`1 (06:10~07:00)` / `2 (...)` period labels (rows), drops every text item into its cell, joins the
lines, then splits `<course><location>` with the same keyword list as the original `extractor.py`.
Output is identical to the original Python extractor on a real timetable.

## Layout

```
shared/schedule.ts   types + period times (used by worker and frontend)
worker/index.ts      Worker entry: POST /api/login
worker/ndhu.ts       NDHU login + PDF download
worker/parsePdf.ts   PDF → 7×16 grid
worker/format.ts     merged / split output
src/                 React frontend (same UI as dalist-ndhu)
test/                parser check against a real PDF
```

## Develop

```bash
npm install
npm run dev        # Vite dev server running the Worker in workerd
npm run typecheck
npm test -- path/to/timetable.pdf [reference.json]   # reference.json = output of the old extractor.py
npm run deploy     # build + wrangler deploy
```

## Notes

- Parsing takes ~15–20 ms CPU. The Workers Free plan has a 10 ms CPU limit per request, so the
  Paid plan is recommended for reliable operation.
- Credentials are only forwarded to NDHU; nothing is stored.

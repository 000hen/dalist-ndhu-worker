import { RECORD_TIME, type FormatedPDFDecoded, type PDFDecoded, type PDFRecord } from "../shared/schedule";

const emptyWeek = (): FormatedPDFDecoded => [[], [], [], [], [], [], []];

/** Merge consecutive slots of the same course into one record. */
export function doCombine(decoded: PDFDecoded): FormatedPDFDecoded {
    const formatted = emptyWeek();

    decoded.forEach((slots, day) => {
        let current: PDFRecord | null = null;
        let start = 0;

        slots.forEach((record, slot) => {
            if (record && current && record.name === current.name && record.class === current.class) return;
            if (current) {
                formatted[day].push({ ...current, startTime: RECORD_TIME[start][0], endTime: RECORD_TIME[slot - 1][1], week: day });
            }
            current = record;
            start = slot;
        });

        if (current) {
            formatted[day].push({ ...(current as PDFRecord), startTime: RECORD_TIME[start][0], endTime: RECORD_TIME[slots.length - 1][1], week: day });
        }
    });

    return formatted;
}

/** One record per slot; slots of the same course share a series id. */
export function doNotCombine(decoded: PDFDecoded): FormatedPDFDecoded {
    const formatted = emptyWeek();
    const seriesMap = new Map<string, string>();

    decoded.forEach((slots, day) => {
        slots.forEach((record, slot) => {
            if (!record) return;
            const key = `${record.name}_${record.class}`;
            let series = seriesMap.get(key);
            if (!series) {
                series = crypto.randomUUID();
                seriesMap.set(key, series);
            }
            formatted[day].push({ ...record, startTime: RECORD_TIME[slot][0], endTime: RECORD_TIME[slot][1], week: day, series });
        });
    });

    return formatted;
}

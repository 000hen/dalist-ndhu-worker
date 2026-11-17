/** Plain time value; JSON-safe and structurally compatible with dalist_utils' ScheduleTime fields. */
export interface Time {
    hour: number;
    minute: number;
}

export interface PDFRecord {
    name: string;
    class: string;
}

/**
 * Decoded timetable grid.
 * Outer index: day (0-6 = Mon-Sun). Inner index: period slot (0-15). null = no class.
 */
export type PDFDecoded = Array<Array<PDFRecord | null>>;

export interface PDFRecordWithTime extends PDFRecord {
    /** Day index (0-6 = Mon-Sun). */
    week: number;
    series?: string;
    startTime: Time;
    endTime: Time;
}

export type FormatedPDFDecoded = Array<Array<PDFRecordWithTime>>;

/** NDHU period slots: [start, end]. Period n starts at (n + 5):10 and ends at (n + 6):00. */
export const RECORD_TIME: Array<[Time, Time]> = Array.from({ length: 16 }, (_, i) => [
    { hour: i + 6, minute: 10 },
    { hour: i + 7, minute: 0 },
]);

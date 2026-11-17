import type { Schedule } from "dalist_utils";

/** URL-safe base64 (keeps "=" padding, as the original implementation did). */
export function byteArrayToBase64(value: Uint8Array): string {
    let binary = "";
    for (const b of value) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\//g, "_").replace(/\+/g, "-");
}

export function formatSchedulesToCreate(schedules: Schedule[]): string {
    return "dalist://create/" + schedules.map((s) => byteArrayToBase64(s.toFormat())).join("&");
}

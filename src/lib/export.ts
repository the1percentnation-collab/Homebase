import { todayIso } from "./format";
import { COLLECTIONS, type CollectionName } from "./schema";
import { getStorage } from "./storage";

/* -------------------------------------------------------------------------- */
/*                                     CSV                                    */
/* -------------------------------------------------------------------------- */

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headerSet = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) headerSet.add(k);
  }
  const headers = Array.from(headerSet);
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/*                            File download / read                            */
/* -------------------------------------------------------------------------- */

export function downloadBlob(
  contents: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/* -------------------------------------------------------------------------- */
/*                           Collection-level helpers                         */
/* -------------------------------------------------------------------------- */

export async function exportCollectionCsv(
  collection: CollectionName
): Promise<void> {
  const items = (await getStorage().list(collection)) as Record<string, unknown>[];
  const csv = toCsv(items);
  downloadBlob(
    csv || "(no data)",
    `homebase-${collection}-${todayIso()}.csv`,
    "text/csv;charset=utf-8"
  );
}

export async function exportAllJson(): Promise<void> {
  const data = await getStorage().exportAll();
  const payload = {
    app: "homebase",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `homebase-backup-${todayIso()}.json`,
    "application/json"
  );
}

export type ImportResult = {
  imported: Partial<Record<CollectionName, number>>;
  skipped: Partial<Record<CollectionName, number>>;
};

export async function importFromFile(file: File): Promise<ImportResult> {
  const text = await readFileAsText(file);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }

  const data = extractData(parsed);
  if (!data) {
    throw new Error(
      "Unrecognized file. Expected a Homebase backup JSON with a `data` object."
    );
  }

  const imported: Partial<Record<CollectionName, number>> = {};
  const skipped: Partial<Record<CollectionName, number>> = {};

  for (const key of Object.keys(COLLECTIONS) as CollectionName[]) {
    const list = data[key];
    if (!Array.isArray(list)) continue;
    const schema = COLLECTIONS[key];
    const valid: unknown[] = [];
    let bad = 0;
    for (const item of list) {
      const r = schema.safeParse(item);
      if (r.success) valid.push(r.data);
      else bad += 1;
    }
    imported[key] = valid.length;
    if (bad > 0) skipped[key] = bad;
  }

  // Only pass through collections we actually validated.
  const cleaned: Partial<Record<CollectionName, unknown[]>> = {};
  for (const key of Object.keys(COLLECTIONS) as CollectionName[]) {
    const list = data[key];
    if (!Array.isArray(list)) continue;
    const schema = COLLECTIONS[key];
    cleaned[key] = list
      .map((item) => schema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => (r.success ? r.data : null))
      .filter((x) => x !== null);
  }
  await getStorage().importAll(cleaned);

  return { imported, skipped };
}

function extractData(
  parsed: unknown
): Partial<Record<CollectionName, unknown[]>> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const maybeWrapped = parsed as { data?: unknown };
  const candidate =
    typeof maybeWrapped.data === "object" && maybeWrapped.data !== null
      ? maybeWrapped.data
      : parsed;
  if (typeof candidate !== "object" || candidate === null) return null;
  return candidate as Partial<Record<CollectionName, unknown[]>>;
}

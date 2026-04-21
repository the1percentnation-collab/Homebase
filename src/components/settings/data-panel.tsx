"use client";

import {
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  exportAllJson,
  exportCollectionCsv,
  importFromFile,
  type ImportResult,
} from "@/lib/export";
import { getStorage } from "@/lib/storage";

const CSV_COLLECTIONS = [
  { key: "expenses", label: "Expenses" },
  { key: "incomes", label: "Income" },
  { key: "bills", label: "Bills" },
  { key: "budgets", label: "Budgets" },
  { key: "goals", label: "Goals" },
  { key: "tasks", label: "Tasks" },
] as const;

type ImportState =
  | { kind: "idle" }
  | { kind: "success"; result: ImportResult }
  | { kind: "error"; message: string };

export function DataPanel() {
  const [importing, setImporting] = useState(false);
  const [importState, setImportState] = useState<ImportState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportState({ kind: "idle" });
    try {
      const result = await importFromFile(file);
      setImportState({ kind: "success", result });
    } catch (e) {
      setImportState({
        kind: "error",
        message: e instanceof Error ? e.message : "Import failed.",
      });
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "Wipe all local data? Budgets, expenses, bills, tasks, everything. This cannot be undone."
    );
    if (!confirmed) return;
    const again = window.prompt('Type "erase" to confirm.');
    if (again !== "erase") return;
    await getStorage().clear();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Export</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Download your data. JSON is the full backup; CSVs are per-module for
            spreadsheets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportAllJson()}>
            <Download className="h-4 w-4" />
            Full backup (JSON)
          </Button>
          {CSV_COLLECTIONS.map((c) => (
            <Button
              key={c.key}
              variant="outline"
              onClick={() => exportCollectionCsv(c.key)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {c.label} CSV
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Import</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Restore from a Homebase JSON backup. This replaces matching
            collections with the imported ones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
            }}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing…" : "Choose JSON file"}
          </Button>
        </div>

        {importState.kind === "success" && (
          <div className="flex items-start gap-2 rounded-md border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">Import complete</p>
              <ul className="text-xs text-muted-foreground">
                {Object.entries(importState.result.imported)
                  .filter(([, n]) => (n ?? 0) > 0)
                  .map(([k, n]) => (
                    <li key={k}>
                      {k}: {n}
                      {importState.result.skipped[k as keyof ImportResult["skipped"]]
                        ? ` (${importState.result.skipped[k as keyof ImportResult["skipped"]]} skipped)`
                        : ""}
                    </li>
                  ))}
                {Object.keys(importState.result.imported).length === 0 && (
                  <li>No collections matched. Nothing imported.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {importState.kind === "error" && (
          <div className="flex items-start gap-2 rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-[var(--destructive)] mt-0.5 shrink-0" />
            <p>{importState.message}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--destructive)]/30 bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--destructive)]">
            Reset
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Wipes every collection from local storage. Export a backup first if
            you want to keep anything.
          </p>
        </div>
        <Button variant="destructive" onClick={handleReset}>
          <Trash2 className="h-4 w-4" />
          Wipe all data
        </Button>
      </section>
    </div>
  );
}

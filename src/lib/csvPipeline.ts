import { computeTrendAnalysis, type TrendAnalysis } from "@/lib/mlModels";

/** One row after cleaning (ISO date + OHLCV). */
export interface ParsedCsvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface CsvPipelineResult {
  rows: ParsedCsvRow[];
  /** Close prices in chronological order (model target). */
  closes: number[];
  dates: string[];
  preprocessingLog: string[];
  /** Index of first test row (80/20 temporal split). */
  splitIndex: number;
  trainRows: number;
  testRows: number;
  trend: TrendAnalysis;
  error?: string;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && c === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseNum(s: string): number {
  const t = s.replace(/,/g, "").replace(/^\$/, "").trim();
  if (t === "" || t === "null" || t === "NA") return NaN;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/adj close/i, "adjclose");
}

/** Parse various date formats to YYYY-MM-DD. */
function parseDateCell(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(t);
  if (iso) return iso[0];
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (mdy) {
    const mm = mdy[1].padStart(2, "0");
    const dd = mdy[2].padStart(2, "0");
    return `${mdy[3]}-${mm}-${dd}`;
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return null;
}

function mapHeader(h: string): keyof ParsedCsvRow | null {
  const n = normalizeHeader(h).replace(/\s/g, "");
  if (n === "date") return "date";
  if (n === "open") return "open";
  if (n === "high") return "high";
  if (n === "low") return "low";
  if (n === "close") return "close";
  if (n === "adjclose") return "adjClose";
  if (n === "volume") return "volume";
  return null;
}

/**
 * Ingest and preprocess uploaded Bitcoin OHLCV CSV.
 * Expects columns: Date, Open, High, Low, Close, Adj Close, Volume (names flexible).
 */
export function runCsvPipeline(csvText: string): CsvPipelineResult {
  const preprocessingLog: string[] = [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      closes: [],
      dates: [],
      preprocessingLog: ["Error: file is empty or has no data rows."],
      splitIndex: 0,
      trainRows: 0,
      testRows: 0,
      trend: computeTrendAnalysis([]),
      error: "Invalid CSV: need a header row and at least one data row.",
    };
  }

  const headerCells = parseCsvLine(lines[0]);
  const colIndex: Partial<Record<keyof ParsedCsvRow, number>> = {};
  for (let c = 0; c < headerCells.length; c++) {
    const mapped = mapHeader(headerCells[c]);
    if (mapped) colIndex[mapped] = c;
  }

  if (
    colIndex.date === undefined ||
    colIndex.close === undefined ||
    colIndex.volume === undefined
  ) {
    return {
      rows: [],
      closes: [],
      dates: [],
      preprocessingLog: [
        `Headers found: ${headerCells.join(", ")}`,
        "Error: need at least Date, Close, and Volume columns.",
      ],
      splitIndex: 0,
      trainRows: 0,
      testRows: 0,
      trend: computeTrendAnalysis([]),
      error:
        "Missing required columns. Use: Date, Open, High, Low, Close, Adj Close, Volume.",
    };
  }

  preprocessingLog.push(`Detected ${headerCells.length} columns, ${lines.length - 1} raw rows.`);

  const rawRows: ParsedCsvRow[] = [];
  let droppedInvalid = 0;
  let droppedDup = 0;

  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]);
    const get = (k: keyof ParsedCsvRow): string => {
      const idx = colIndex[k];
      return idx !== undefined ? (cells[idx] ?? "") : "";
    };

    const dateStr = parseDateCell(get("date"));
    if (!dateStr) {
      droppedInvalid++;
      continue;
    }

    const close = parseNum(get("close"));
    const vol = parseNum(get("volume"));
    if (!Number.isFinite(close) || !Number.isFinite(vol)) {
      droppedInvalid++;
      continue;
    }

    const open = parseNum(get("open"));
    const high = parseNum(get("high"));
    const low = parseNum(get("low"));
    const adj = get("adjClose") ? parseNum(get("adjClose")) : close;

    rawRows.push({
      date: dateStr,
      open: Number.isFinite(open) ? open : close,
      high: Number.isFinite(high) ? high : close,
      low: Number.isFinite(low) ? low : close,
      close,
      adjClose: Number.isFinite(adj) ? adj : close,
      volume: vol,
    });
  }

  preprocessingLog.push(`Parsed ${rawRows.length} numeric rows (${droppedInvalid} invalid lines skipped).`);

  rawRows.sort((a, b) => a.date.localeCompare(b.date));

  const byDate = new Map<string, ParsedCsvRow>();
  for (const row of rawRows) {
    if (byDate.has(row.date)) droppedDup++;
    byDate.set(row.date, row);
  }
  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (droppedDup) preprocessingLog.push(`Deduplicated by date: ${droppedDup} duplicate day(s) merged (kept last).`);

  const closes = rows.map((r) => r.close);
  const dates = rows.map((r) => r.date);
  const trend = computeTrendAnalysis(closes);
  preprocessingLog.push(
    `Trend (OLS on full series): ${trend.direction} — slope ${trend.slopePerDay} USD/day, total return ${trend.cumulativeReturnPct}%.`
  );

  const splitIndex = Math.floor(rows.length * 0.8);
  const trainRows = splitIndex;
  const testRows = rows.length - splitIndex;
  preprocessingLog.push(
    `Temporal split: ${trainRows} training rows (~80%), ${testRows} test rows (~20%).`
  );

  if (rows.length < 30) {
    return {
      rows,
      closes,
      dates,
      preprocessingLog,
      splitIndex,
      trainRows,
      testRows,
      trend,
      error: `Need at least 30 rows after cleaning; got ${rows.length}.`,
    };
  }

  return {
    rows,
    closes,
    dates,
    preprocessingLog,
    splitIndex,
    trainRows,
    testRows,
    trend,
  };
}

/** Stable seed for Random Forest from series (reproducible metrics for same CSV). */
export function seedFromSeries(prices: number[]): number {
  let h = 2166136261;
  for (let i = 0; i < prices.length; i++) {
    h ^= Math.floor(prices[i] * 100) % 9973;
    h = Math.imul(h, 16777619);
  }
  h ^= prices.length * 1315423911;
  return Math.abs(h) % 2147483646 || 1;
}

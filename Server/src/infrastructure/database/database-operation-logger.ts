/**
 * Universal Database Operation Logger
 * Prints a clean, colored per-request summary to the server console.
 *
 * Output format:
 * ══════════════════════════════════════
 * REQUEST  POST /api/products
 * ══════════════════════════════════════
 * Firestore    Reads: 4  Writes: 0  Updates: 0  Deletes: 0
 * MongoDB      Reads: 16 Writes: 2  Updates: 1  Deletes: 0
 * ──────────────────────────────────────
 * TOTAL        Reads: 23 Writes: 3  Updates: 1  Deletes: 0
 * Duration     52ms
 * ══════════════════════════════════════
 */

import { Request } from "express";
import { MultiDbStore, computeTotals } from "./database-operation-store";
import { ProviderStats } from "./database-operation-types";

// ANSI color codes
const C = {
  reset:    "\x1b[0m",
  bold:     "\x1b[1m",
  dim:      "\x1b[2m",
  cyan:     "\x1b[36m",
  green:    "\x1b[32m",
  yellow:   "\x1b[33m",
  red:      "\x1b[31m",
  blue:     "\x1b[34m",
  magenta:  "\x1b[35m",
  white:    "\x1b[37m",
  gray:     "\x1b[90m",
};

const PROVIDER_COLORS: Record<string, string> = {
  firestore:   C.yellow,
  supabase:    C.green,
  mongodb:     C.cyan,
  postgresql:  C.blue,
  mysql:       C.magenta,
  sqlite:      C.gray,
  sqlserver:   C.red,
};

function colorForProvider(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? C.white;
}

function pad(str: string | number, len: number): string {
  return String(str).padEnd(len, " ");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const DOUBLE_LINE = "══════════════════════════════════════════════════════";
const SINGLE_LINE = "──────────────────────────────────────────────────────";

function methodColor(method: string): string {
  switch (method?.toUpperCase()) {
    case "GET":    return C.green;
    case "POST":   return C.cyan;
    case "PUT":
    case "PATCH":  return C.yellow;
    case "DELETE": return C.red;
    default:       return C.white;
  }
}

function formatProviderRow(provider: string, stats: ProviderStats): string {
  const color = colorForProvider(provider);
  const name  = pad(provider.toUpperCase(), 14);
  const reads  = `Reads: ${pad(stats.reads, 5)}`;
  const writes = `Writes: ${pad(stats.writes, 5)}`;
  const updates = `Updates: ${pad(stats.updates, 5)}`;
  const deletes = `Deletes: ${pad(stats.deletes, 5)}`;
  const failed  = stats.failed > 0 ? `${C.red}Failed: ${stats.failed}${C.reset}` : "";
  const timing  = stats.totalDurationMs > 0
    ? `${C.dim}(avg ${stats.avgDurationMs}ms, max ${stats.maxDurationMs}ms)${C.reset}`
    : "";

  return `  ${color}${C.bold}${name}${C.reset}` +
         `${C.green}${reads}${C.reset}` +
         `${C.cyan}${writes}${C.reset}` +
         `${C.yellow}${updates}${C.reset}` +
         `${C.red}${deletes}${C.reset}` +
         (failed  ? `  ${failed}`  : "") +
         (timing  ? `  ${timing}`  : "");
}

export class DatabaseOperationLogger {
  /**
   * Prints the complete per-request database summary.
   * Called at the end of each HTTP request in the middleware.
   */
  static printSummary(req: Request, store: MultiDbStore): void {
    const providers = Object.keys(store.byProvider);

    // Skip empty requests (static assets, health pings, etc.)
    const totals = computeTotals(store);
    const hasActivity = totals.totalOperations > 0 || totals.failed > 0;
    if (!hasActivity) return;

    const duration = Date.now() - store.requestStart;
    const method = req.method ?? "???";
    const url    = req.originalUrl ?? req.url ?? "/";
    const mColor = methodColor(method);

    const lines: string[] = [];
    lines.push(`\n${C.bold}${DOUBLE_LINE}${C.reset}`);
    lines.push(`${C.bold}  REQUEST  ${mColor}${method}${C.reset}${C.bold} ${url}${C.reset}`);
    lines.push(`${C.bold}${DOUBLE_LINE}${C.reset}`);

    if (providers.length === 0) {
      lines.push(`  ${C.dim}No database operations recorded.${C.reset}`);
    } else {
      for (const provider of providers) {
        const stats = store.byProvider[provider];
        const anyOps = stats.reads + stats.writes + stats.updates + stats.deletes + stats.failed > 0;
        if (anyOps) {
          lines.push(formatProviderRow(provider, stats));
        }
      }
    }

    lines.push(`  ${C.dim}${SINGLE_LINE}${C.reset}`);

    const t = totals;
    lines.push(
      `  ${C.bold}${pad("TOTAL", 14)}${C.reset}` +
      `${C.green}Reads: ${pad(t.reads, 5)}${C.reset}` +
      `${C.cyan}Writes: ${pad(t.writes, 5)}${C.reset}` +
      `${C.yellow}Updates: ${pad(t.updates, 5)}${C.reset}` +
      `${C.red}Deletes: ${pad(t.deletes, 4)}${C.reset}` +
      (t.failed > 0 ? `  ${C.red}Failed: ${t.failed}${C.reset}` : "")
    );

    const dColor = duration < 200 ? C.green : duration < 1000 ? C.yellow : C.red;
    lines.push(`  ${C.bold}${pad("Duration", 14)}${C.reset}${dColor}${formatDuration(duration)}${C.reset}`);
    lines.push(`${C.bold}${DOUBLE_LINE}${C.reset}\n`);

    process.stdout.write(lines.join("\n") + "\n");
  }

  /**
   * Prints the global cumulative database stats.
   * Useful for server startup / periodic summary logging.
   */
  static printGlobalSummary(globalStats: Record<string, ProviderStats>): void {
    const providers = Object.keys(globalStats);
    if (providers.length === 0) return;

    const lines: string[] = [];
    lines.push(`\n${C.bold}${DOUBLE_LINE}${C.reset}`);
    lines.push(`${C.bold}  DATABASE OPERATIONS (Global Totals)${C.reset}`);
    lines.push(`${C.bold}${DOUBLE_LINE}${C.reset}`);

    for (const provider of providers) {
      lines.push(formatProviderRow(provider, globalStats[provider]));
    }

    lines.push(`${C.bold}${DOUBLE_LINE}${C.reset}\n`);
    process.stdout.write(lines.join("\n") + "\n");
  }
}

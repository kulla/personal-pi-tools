import type {
  ExtensionCommandContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";

export function abortCurrentTurn(ctx: ExtensionCommandContext): void {
  if (!ctx.isIdle()) {
    ctx.abort();
  }
}

export function getEntryTime(entry: { timestamp: string }): number {
  const time = new Date(entry.timestamp).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function getEntriesAfterTime(
  entries: SessionEntry[],
  timeMs: number,
): SessionEntry[] {
  return entries.filter((entry) => getEntryTime(entry) > timeMs);
}

export function findFirstEntryAfterTime(
  entries: SessionEntry[],
  timeMs: number,
): SessionEntry | undefined {
  return getEntriesAfterTime(entries, timeMs).sort(
    (a, b) => getEntryTime(a) - getEntryTime(b),
  )[0];
}

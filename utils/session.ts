import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

export function abortCurrentTurn(ctx: ExtensionCommandContext): void {
  if (!ctx.isIdle()) {
    ctx.abort();
  }
}

export function getEntryTime(entry: { timestamp: string }): number {
  const time = new Date(entry.timestamp).getTime();
  return Number.isFinite(time) ? time : 0;
}

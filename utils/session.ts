import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

export function abortCurrentTurn(ctx: ExtensionCommandContext): void {
  if (!ctx.isIdle()) {
    ctx.abort();
  }
}

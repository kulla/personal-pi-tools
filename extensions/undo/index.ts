import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { createLogger } from "../../utils/logging.ts";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("undo", {
    description: "Abort the current turn and rewind to the previous prompt",
    handler: async (_args, ctx) => {
      try {
        abortCurrentTurn(ctx);
        await ctx.waitForIdle();
      } catch (error) {
        logger.log(getUndoErrorMessage(error), "error");
      }
    },
  });
}

function abortCurrentTurn(ctx: ExtensionCommandContext): void {
  if (!ctx.isIdle()) {
    ctx.abort();
  }
}

function getUndoErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to undo the current turn.";
}

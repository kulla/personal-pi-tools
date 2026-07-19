import type {
  ExtensionAPI,
  ExtensionCommandContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { createLogger, type Logger } from "../../utils/logging.ts";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("undo", {
    description: "Abort the current turn and rewind to the previous prompt",
    handler: async (_args, ctx) => {
      try {
        abortCurrentTurn(ctx);
        await ctx.waitForIdle();
        await rewindToLastUserPrompt(ctx, logger);
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

async function rewindToLastUserPrompt(
  ctx: ExtensionCommandContext,
  logger: Logger,
): Promise<void> {
  const target = findLastUserMessage(ctx.sessionManager.getBranch());
  if (!target) {
    logger.log("No earlier user prompt was found.", "warning");
    return;
  }

  const result = await ctx.navigateTree(target.id, { summarize: false });
  if (result.cancelled) {
    logger.log("Undo was cancelled.", "warning");
  }
}

function findLastUserMessage(
  entries: SessionEntry[],
): SessionEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry && isUserMessage(entry)) return entry;
  }

  return undefined;
}

function getUndoErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to undo the current turn.";
}

function isUserMessage(entry: SessionEntry): entry is SessionEntry & {
  type: "message";
  message: { role: "user"; content: unknown };
} {
  const message = (entry as { message?: { role?: unknown } }).message;
  return entry.type === "message" && message?.role === "user";
}

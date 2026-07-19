import type {
  ExtensionAPI,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { createLogger } from "../../utils/logging.ts";

const UNDO_LOG_TYPE = "undo-log";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi, UNDO_LOG_TYPE);

  pi.registerCommand("undo", {
    description: "Abort the current turn and rewind to the previous prompt",
    handler: async (_args, ctx) => {
      try {
        if (!ctx.isIdle()) {
          ctx.abort();
        }

        await ctx.waitForIdle();

        const branch = ctx.sessionManager.getBranch();
        const userIndex = findLastUserMessageIndex(branch);

        if (userIndex < 0) {
          logger.log("No earlier user prompt was found.", "warning");
          return;
        }

        const target = branch.at(userIndex);
        if (!target) {
          logger.log("No earlier user prompt was found.", "warning");
          return;
        }

        const result = await ctx.navigateTree(target.id, {
          summarize: false,
        });

        if (result.cancelled) {
          logger.log("Undo was cancelled.", "warning");
        }
      } catch (error) {
        logger.log(
          error instanceof Error
            ? error.message
            : "Unable to undo the current turn.",
          "error",
        );
      }
    },
  });
}

function findLastUserMessageIndex(entries: SessionEntry[]): number {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry && isUserMessage(entry)) return index;
  }

  return -1;
}

function isUserMessage(entry: SessionEntry): entry is SessionEntry & {
  type: "message";
  message: { role: "user"; content: unknown };
} {
  const message = (entry as { message?: { role?: unknown } }).message;
  return entry.type === "message" && message?.role === "user";
}

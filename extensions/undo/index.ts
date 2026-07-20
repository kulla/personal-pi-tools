import type {
  ExtensionAPI,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import { createLogger } from "../../utils/logging.ts";
import { abortCurrentTurn } from "../../utils/session.ts";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("undo", {
    description:
      "Abort the current turn and rewind to the message before the last user message",
    handler: async (_args, ctx) => {
      try {
        abortCurrentTurn(ctx);
        await ctx.waitForIdle();

        const target = findUndoTarget(ctx.sessionManager.getBranch());
        if (!target) {
          return;
        }

        const result = await ctx.navigateTree(target.id, { summarize: false });
        if (result.cancelled) {
          throw new Error("Undo navigation was cancelled.");
        }
      } catch (error) {
        logger.log(
          getErrorMessage(error, "Unable to undo the current turn."),
          "error",
        );
      }
    },
  });
}

function findUndoTarget(entries: SessionEntry[]): SessionEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!entry || !isUserMessage(entry)) {
      continue;
    }

    return index === 0 ? entry : entries[index - 1];
  }

  return entries[0];
}

function isUserMessage(entry: SessionEntry): entry is SessionEntry & {
  type: "message";
  message: { role: "user" };
} {
  return entry.type === "message" && entry.message.role === "user";
}

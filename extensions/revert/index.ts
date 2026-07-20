import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import {
  getLastCommitTime,
  requireGitRepository,
  stashChanges,
} from "../../utils/git.ts";
import { createLogger, type Logger } from "../../utils/logging.ts";
import {
  abortCurrentTurn,
  findFirstEntryAfterTime,
} from "../../utils/session.ts";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("revert", {
    description:
      "Stash changes and rewind to the first entry after the last commit",
    handler: async (_args, ctx) => {
      try {
        await rewindSession(pi, ctx, logger);
      } catch (error) {
        logger.log(
          getErrorMessage(error, "Unable to revert the current workflow."),
          "error",
        );
      }
    },
  });
}

async function rewindSession(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  logger: Logger,
): Promise<void> {
  abortCurrentTurn(ctx);
  await ctx.waitForIdle();

  await requireGitRepository(pi, ctx);
  await stashChanges(pi, ctx);
  const commitTime = await getLastCommitTime(pi, ctx);
  const entry = findFirstEntryAfterTime(
    ctx.sessionManager.getBranch(),
    commitTime,
  );

  if (!entry) {
    logger.log("There is nothing to rewind.", "info");
    return;
  }

  const result = await ctx.navigateTree(entry.id, { summarize: false });
  if (result.cancelled) {
    throw new Error("Revert navigation was cancelled.");
  }
}

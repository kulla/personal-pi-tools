import type {
  ExtensionAPI,
  ExtensionCommandContext,
  SessionEntry,
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
  await abortAndWaitForIdle(ctx);

  await requireGitRepository(pi, ctx);
  await stashChanges(pi, ctx);

  const entry = await findRewindTarget(pi, ctx);
  if (!entry) {
    logger.log("There is nothing to rewind.", "info");
    return;
  }

  await navigateToEntry(ctx, entry.id);
}

async function abortAndWaitForIdle(
  ctx: ExtensionCommandContext,
): Promise<void> {
  abortCurrentTurn(ctx);
  await ctx.waitForIdle();
}

async function findRewindTarget(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<SessionEntry | undefined> {
  const commitTime = await getLastCommitTime(pi, ctx);
  return findFirstEntryAfterTime(ctx.sessionManager.getBranch(), commitTime);
}

async function navigateToEntry(
  ctx: ExtensionCommandContext,
  entryId: string,
): Promise<void> {
  const result = await ctx.navigateTree(entryId, { summarize: false });
  if (result.cancelled) {
    throw new Error("Revert navigation was cancelled.");
  }
}

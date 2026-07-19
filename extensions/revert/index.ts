import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import { git } from "../../utils/git.ts";
import { createLogger, type Logger } from "../../utils/logging.ts";
import { abortCurrentTurn, getEntryTime } from "../../utils/session.ts";

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
  const entry = findFirstEntryAfterCommit(ctx, commitTime);

  if (!entry) {
    logger.log("There is nothing to rewind.", "info");
    return;
  }

  const result = await ctx.navigateTree(entry.id, { summarize: false });
  if (result.cancelled) {
    throw new Error("Revert navigation was cancelled.");
  }
}

async function requireGitRepository(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const repository = await git(pi, ctx, ["rev-parse", "--is-inside-work-tree"]);
  if (repository.code !== 0 || repository.stdout.trim() !== "true") {
    throw new Error("Not inside a git repository.");
  }

  const head = await git(pi, ctx, ["rev-parse", "--verify", "HEAD"]);
  if (head.code !== 0) {
    throw new Error("The git repository has no commits.");
  }
}

async function stashChanges(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const result = await git(pi, ctx, ["stash", "push", "--include-untracked"]);
  if (result.code !== 0) {
    throw new Error(
      `Unable to stash repository changes: ${result.stderr.trim() || result.stdout.trim() || "unknown error"}`,
    );
  }
}

async function getLastCommitTime(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<number> {
  const result = await git(pi, ctx, ["log", "-1", "--format=%ct"]);
  if (result.code !== 0) {
    throw new Error(
      `Unable to read the latest git commit: ${result.stderr.trim() || "unknown error"}`,
    );
  }

  const seconds = Number.parseInt(result.stdout.trim(), 10);
  if (!Number.isFinite(seconds)) {
    throw new Error("Unable to read the latest git commit time.");
  }
  return seconds * 1000;
}

function findFirstEntryAfterCommit(
  ctx: ExtensionCommandContext,
  commitTime: number,
) {
  return ctx.sessionManager
    .getBranch()
    .filter((entry) => getEntryTime(entry) > commitTime)
    .sort((a, b) => getEntryTime(a) - getEntryTime(b))[0];
}

import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { throwIfCommandFailed } from "./process.ts";

export function git(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  args: string[],
) {
  return pi.exec("git", args, { cwd: ctx.cwd, signal: ctx.signal });
}

export async function gitText(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  args: string[],
): Promise<string> {
  const result = await git(pi, ctx, args);
  return result.code === 0 ? result.stdout.trim() : "";
}

export async function requireGitRepository(
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

export async function stashChanges(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const result = await git(pi, ctx, ["stash", "push", "--include-untracked"]);
  throwIfCommandFailed(
    result,
    "Unable to stash repository changes: unknown error",
  );
}

export async function getLastCommitTime(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<number> {
  const result = await git(pi, ctx, ["log", "-1", "--format=%ct"]);
  throwIfCommandFailed(
    result,
    "Unable to read the latest git commit: unknown error",
  );

  const seconds = Number.parseInt(result.stdout.trim(), 10);
  if (!Number.isFinite(seconds)) {
    throw new Error("Unable to read the latest git commit time.");
  }

  return seconds * 1000;
}

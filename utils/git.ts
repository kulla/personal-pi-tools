import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

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

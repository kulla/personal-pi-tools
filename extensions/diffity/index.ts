import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import { git, gitText, requireGitRepository } from "../../utils/git.ts";
import { throwIfCommandFailed } from "../../utils/process.ts";
import { createLogger, type Logger } from "../../utils/logging.ts";

const DIFFITY_START_DELAY_MS = 2_000;
const DIFFITY_DIFF_CMD = "diffity";
const DIFFITY_URL_PREFIX = "http://localhost:";
const WAITING_FOR_USER_INPUT = "waiting for user input";
const QUESTION_PREFIX = "[question]";
const THREAD_CONTEXT_RADIUS = 3;
const DIFFITY_SESSION_RESULT_TIMEOUT_MS = 1_800_000;
const DIFFITY_SESSION_RESULT_POLL_MS = 100;

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("diffity-diff", {
    description: "Open diffity for the current worktree changes",
    handler: async (_args, ctx) => {
      try {
        await openDiffity(pi, ctx, logger);
      } catch (error) {
        logger.log(getErrorMessage(error, "Unable to open diffity."), "error");
      }
    },
  });

  pi.registerCommand("diffity-resolve", {
    description: "Resolve actionable diffity review threads",
    handler: async (_args, ctx) => {
      try {
        await resolveDiffityThreads(pi, ctx, logger);
      } catch (error) {
        logger.log(
          getErrorMessage(error, "Unable to resolve diffity threads."),
          "error",
        );
      }
    },
  });
}

async function openDiffity(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  logger: Logger,
): Promise<void> {
  await requireGitRepository(pi, ctx);
  if (!(await hasWorkingTreeChanges(pi, ctx))) {
    throw new Error("No working tree changes found.");
  }

  await requireDiffity();

  const repoRoot = await getRepoRoot(pi, ctx);
  const repoHash = hashRepoRoot(repoRoot);
  const existingEntry = await getRunningInstance(pi, ctx, repoHash);
  if (existingEntry) {
    logDiffityInstanceUrl(existingEntry, logger);
    return;
  }

  spawnDiffity(ctx.cwd);

  await sleep(DIFFITY_START_DELAY_MS);

  const entry = await getRunningInstance(pi, ctx, repoHash);
  if (!entry) {
    throw new Error("Unable to discover the running diffity instance.");
  }

  logDiffityInstanceUrl(entry, logger);
}

async function resolveDiffityThreads(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  logger: Logger,
): Promise<void> {
  await requireDiffity();

  const list = await runDiffity(pi, ctx, [
    "agent",
    "list",
    "--status",
    "open",
    "--json",
  ]);
  throwIfCommandFailed(list, "No active diffity review session.");

  const threads = parseJsonArray(list.stdout, "diffity agent list output");
  if (threads.length === 0) {
    logger.log("There is nothing to resolve.");
    return;
  }

  const actionableThreads = threads
    .filter(isDiffityThread)
    .filter(isActionableThread)
    .sort(byResolutionOrder);

  if (actionableThreads.length === 0) {
    logger.log("There is nothing to resolve.");
    return;
  }

  await ctx.waitForIdle();

  for (const thread of actionableThreads) {
    const summary = await resolveThreadInCurrentSession(pi, ctx, thread);
    await resolveThread(pi, ctx, thread.id, summary);
  }

  logger.log("Resolved actionable diffity threads.");
}

async function resolveThreadInCurrentSession(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  thread: DiffityThread,
): Promise<string> {
  const source = await readThreadSource(
    ctx.cwd,
    thread.filePath,
    thread.startLine,
    thread.endLine,
  );
  const beforeCount = ctx.sessionManager.getEntries().length;
  pi.sendUserMessage(buildThreadPrompt(thread, source));

  return waitForAssistantSummary(ctx, beforeCount, thread.id);
}

function buildThreadPrompt(thread: DiffityThread, source: string): string {
  const mode = isQuestionThread(thread)
    ? "Answer the code review question in the current session."
    : "Fix the code review thread in the current session.";
  const action = isQuestionThread(thread)
    ? "Use the current session tools to answer the question."
    : "Use the current session tools to make the necessary file changes.";

  return [
    mode,
    action,
    "Return a short plain-text summary when you are done.",
    "Do not use markdown.",
    "",
    `File: ${thread.filePath}`,
    `Range: ${thread.startLine}-${thread.endLine}`,
    "",
    "Thread comments:",
    renderComments(thread.comments),
    "",
    "Source context:",
    source,
  ].join("\n");
}

async function waitForAssistantSummary(
  ctx: ExtensionCommandContext,
  startIndex: number,
  threadId: string,
): Promise<string> {
  const deadline = Date.now() + DIFFITY_SESSION_RESULT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (ctx.signal?.aborted) {
      throw new Error(`Unable to read the result for thread ${threadId}.`);
    }

    const summary = extractLatestAssistantSummary(
      ctx.sessionManager.getEntries(),
      startIndex,
    );
    if (summary) {
      return summary;
    }

    await sleep(DIFFITY_SESSION_RESULT_POLL_MS);
  }

  throw new Error(`Unable to read the result for thread ${threadId}.`);
}

function extractLatestAssistantSummary(
  entries: SessionEntry[],
  startIndex: number,
): string | undefined {
  for (let index = entries.length - 1; index >= startIndex; index -= 1) {
    const entry = entries[index];
    if (!entry || !isSessionMessageEntry(entry)) continue;
    if (entry.message.role !== "assistant") continue;

    const text = extractMessageText(entry.message.content);
    if (text) {
      return normalizeSummary(text);
    }
  }

  return undefined;
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter(isTextBlock)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function isSessionMessageEntry(
  entry: SessionEntry,
): entry is Extract<SessionEntry, { type: "message" }> {
  return entry.type === "message";
}

async function resolveThread(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  threadId: string,
  summary: string,
): Promise<void> {
  const result = await runDiffity(pi, ctx, [
    "agent",
    "resolve",
    threadId,
    "--summary",
    summary,
  ]);
  throwIfCommandFailed(result, `Unable to resolve thread ${threadId}.`);
}

async function readThreadSource(
  cwd: string,
  filePath: string,
  startLine: number,
  endLine: number,
): Promise<string> {
  const fullPath = join(cwd, filePath);
  const text = await readFile(fullPath, "utf8");
  const lines = text.split(/\r?\n/);
  const start = Math.max(1, startLine - THREAD_CONTEXT_RADIUS);
  const end = Math.min(lines.length, endLine + THREAD_CONTEXT_RADIUS);
  return truncateText(
    lines
      .slice(start - 1, end)
      .map(
        (line, index) => `${String(start + index).padStart(4, " ")}: ${line}`,
      )
      .join("\n"),
    4_000,
  );
}

function spawnDiffity(cwd: string): void {
  const child = spawn(DIFFITY_DIFF_CMD, [], {
    cwd,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

async function requireDiffity(): Promise<void> {
  const result = await runProcess("which", [DIFFITY_DIFF_CMD]);
  if (result.code !== 0) {
    throw new Error("diffity is not available.");
  }
}

async function hasWorkingTreeChanges(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<boolean> {
  const status = await gitText(pi, ctx, ["status", "--porcelain"]);
  return status.trim().length > 0;
}

async function getRepoRoot(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<string> {
  const result = await git(pi, ctx, ["rev-parse", "--show-toplevel"]);
  throwIfCommandFailed(result, "Unable to determine the git repository root.");

  return result.stdout.trim();
}

async function runDiffity(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  args: string[],
) {
  return runProcess(DIFFITY_DIFF_CMD, args, ctx.cwd, pi, ctx);
}

async function getRunningInstance(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  repoHash: string,
): Promise<DiffityInstance | undefined> {
  const list = await runDiffity(pi, ctx, ["list", "--json"]);
  if (list.code !== 0) {
    return undefined;
  }

  const entries = parseJsonArray(list.stdout, "diffity list output");
  return selectInstance(entries, repoHash);
}

function logDiffityInstanceUrl(entry: DiffityInstance, logger: Logger): void {
  if (typeof entry.port !== "number") {
    throw new Error("Unable to read the diffity port.");
  }

  logger.log(`${DIFFITY_URL_PREFIX}${entry.port}`);
}

async function runProcess(
  command: string,
  args: string[],
  cwd?: string,
  pi?: ExtensionAPI,
  ctx?: ExtensionCommandContext,
) {
  if (pi && ctx) {
    return pi.exec(command, args, { cwd, signal: ctx.signal });
  }

  return new Promise<{
    stdout: string;
    stderr: string;
    code: number;
    killed: boolean;
  }>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 0, killed: false });
    });
  });
}

function hashRepoRoot(repoRoot: string): string {
  return createHash("sha256").update(repoRoot).digest("hex").slice(0, 12);
}

function selectInstance(
  entries: unknown[],
  repoHash: string,
): DiffityInstance | undefined {
  const match = entries
    .filter(isDiffityInstance)
    .filter((entry) => entry.repoHash === repoHash)
    .sort((a, b) =>
      String(b.startedAt ?? "").localeCompare(String(a.startedAt ?? "")),
    )[0];

  return match && typeof match.port === "number" ? match : undefined;
}

function isActionableThread(thread: DiffityThread): boolean {
  if (thread.filePath === "__general__") {
    return false;
  }

  return !isLastAgentCommentWaiting(thread);
}

function isQuestionThread(thread: DiffityThread): boolean {
  const firstComment = thread.comments[0]?.body.trim().toLowerCase() ?? "";
  return firstComment.startsWith(QUESTION_PREFIX);
}

function isLastAgentCommentWaiting(thread: DiffityThread): boolean {
  const lastAgentComment = [...thread.comments]
    .reverse()
    .find((comment) => comment.author?.type === "agent");
  if (!lastAgentComment) return false;
  return lastAgentComment.body.toLowerCase().includes(WAITING_FOR_USER_INPUT);
}

function byResolutionOrder(a: DiffityThread, b: DiffityThread): number {
  if (a.filePath !== b.filePath) {
    return a.filePath.localeCompare(b.filePath);
  }

  return b.startLine - a.startLine;
}

function parseJsonArray(text: string, source: string): unknown[] {
  const data = parseModelJson(text, source);
  if (Array.isArray(data)) return data;
  throw new Error(`Unexpected ${source}.`);
}

function parseModelJson(
  text: string,
  source: string,
): Record<string, unknown> | unknown[] {
  const trimmed = stripCodeFences(text.trim());
  const candidate = extractJsonCandidate(trimmed);
  if (!candidate) {
    throw new Error(`Unable to parse ${source}.`);
  }

  try {
    return JSON.parse(candidate) as Record<string, unknown> | unknown[];
  } catch (error) {
    throw new Error(
      `Unable to parse ${source}: ${getErrorMessage(error, "invalid JSON")}`,
    );
  }
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

function extractJsonCandidate(text: string): string | undefined {
  const start = text.indexOf("{");
  const arrayStart = text.indexOf("[");
  if (start === -1 && arrayStart === -1) return undefined;

  const openIndex =
    start === -1
      ? arrayStart
      : arrayStart === -1
        ? start
        : Math.min(start, arrayStart);
  const openChar = text[openIndex];
  const closeChar = openChar === "{" ? "}" : "]";
  const endIndex = text.lastIndexOf(closeChar);
  if (endIndex <= openIndex) return undefined;
  return text.slice(openIndex, endIndex + 1);
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
}

function normalizeSummary(text: string): string {
  return text.replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
}

function renderComments(comments: DiffityComment[]): string {
  return truncateText(
    comments
      .map((comment) => `${comment.author?.type ?? "unknown"}: ${comment.body}`)
      .join("\n"),
    4_000,
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDiffityThread(value: unknown): value is DiffityThread {
  if (!isObject(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.filePath !== "string") return false;
  if (typeof value.startLine !== "number") return false;
  if (typeof value.endLine !== "number") return false;
  if (!Array.isArray(value.comments)) return false;
  return value.comments.every(isDiffityComment);
}

function isDiffityComment(value: unknown): value is DiffityComment {
  if (!isObject(value)) return false;
  if (typeof value.body !== "string") return false;
  if (
    "author" in value &&
    value.author !== undefined &&
    !isObject(value.author)
  ) {
    return false;
  }
  return true;
}

function isTextBlock(block: unknown): block is { type: "text"; text: string } {
  return (
    isObject(block) && block.type === "text" && typeof block.text === "string"
  );
}

function isDiffityInstance(value: unknown): value is DiffityInstance {
  return (
    isObject(value) &&
    "repoHash" in value &&
    "port" in value &&
    "startedAt" in value
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type DiffityThread = {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  comments: DiffityComment[];
};

type DiffityInstance = {
  repoHash?: unknown;
  port?: unknown;
  startedAt?: unknown;
};

type DiffityComment = {
  body: string;
  author?: {
    type?: string;
  };
};

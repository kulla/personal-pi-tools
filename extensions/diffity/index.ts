import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { complete } from "@earendil-works/pi-ai/compat";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import { git, gitText, requireGitRepository } from "../../utils/git.ts";
import { createLogger, type Logger } from "../../utils/logging.ts";

const DIFFITY_START_DELAY_MS = 2_000;
const DIFFITY_DIFF_CMD = "diffity";
const DIFFITY_URL_PREFIX = "http://localhost:";
const WAITING_FOR_USER_INPUT = "waiting for user input";
const QUESTION_PREFIX = "[question]";
const THREAD_CONTEXT_RADIUS = 20;

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
  spawnDiffity(ctx.cwd);

  await sleep(DIFFITY_START_DELAY_MS);

  const list = await runDiffity(pi, ctx, ["list", "--json"]);
  const entries = parseJsonArray(list.stdout, "diffity list output");
  const entry = selectInstance(entries, repoHash);
  if (!entry) {
    throw new Error("Unable to discover the running diffity instance.");
  }

  if (typeof entry.port !== "number") {
    throw new Error("Unable to read the diffity port.");
  }

  logger.log(`${DIFFITY_URL_PREFIX}${entry.port}`);
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
  if (list.code !== 0) {
    throw new Error(
      list.stderr.trim() ||
        list.stdout.trim() ||
        "No active diffity review session.",
    );
  }

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

  const model = ctx.model;
  if (!model) {
    throw new Error("No active model is available to resolve diffity threads.");
  }

  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
  if (!auth.ok || !auth.apiKey) {
    throw new Error("Unable to authenticate the active model.");
  }

  const resolvedAuth = auth as ModelAuthSuccess;

  for (const thread of actionableThreads) {
    if (isQuestionThread(thread)) {
      const answer = await answerQuestionThread(
        ctx,
        model,
        resolvedAuth,
        thread,
      );
      await resolveThread(pi, ctx, thread.id, answer);
      continue;
    }

    const result = await fixThread(pi, ctx, model, resolvedAuth, thread);
    if (result.filePath) {
      await applyReplacement(
        ctx.cwd,
        result.filePath,
        result.startLine,
        result.endLine,
        result.replacement,
      );
    }
    await resolveThread(pi, ctx, thread.id, result.summary);
  }

  logger.log("Resolved actionable diffity threads.");
}

type ModelAuth =
  | {
      ok: true;
      apiKey?: string;
      headers?: Record<string, string>;
      env?: Record<string, string>;
    }
  | { ok: false; error: string };

type ModelAuthSuccess = Extract<ModelAuth, { ok: true }>;

async function fixThread(
  _pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  model: NonNullable<ExtensionCommandContext["model"]>,
  auth: ModelAuthSuccess,
  thread: DiffityThread,
): Promise<{
  filePath: string;
  startLine: number;
  endLine: number;
  replacement: string;
  summary: string;
}> {
  const filePath = thread.filePath;
  const source = await readThreadSource(
    ctx.cwd,
    filePath,
    thread.startLine,
    thread.endLine,
  );
  const prompt = [
    "You are fixing a code review thread.",
    "Return only valid JSON with keys: summary, replacement.",
    "summary must be a short sentence describing the fix.",
    "replacement must be the updated source code for the selected range only.",
    "Keep the rest of the file unchanged.",
    "Do not use markdown.",
    "",
    `File: ${filePath}`,
    `Range: ${thread.startLine}-${thread.endLine}`,
    "",
    "Thread comments:",
    renderComments(thread.comments),
    "",
    "Source context:",
    source,
  ].join("\n");

  const response = await complete(
    model,
    {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
          timestamp: Date.now(),
        },
      ],
    },
    {
      apiKey: auth.apiKey,
      headers: auth.headers,
      env: auth.env,
      signal: ctx.signal,
    },
  );

  const answer = response.content
    .filter(isTextBlock)
    .map((part) => part.text)
    .join("\n")
    .trim();
  const data = parseModelJson(answer, "diffity fix response") as {
    summary?: unknown;
    replacement?: unknown;
  };

  if (
    typeof data.summary !== "string" ||
    typeof data.replacement !== "string"
  ) {
    throw new Error("The model did not return a valid fix response.");
  }

  const summary = normalizeSummary(data.summary);
  const replacement = normalizeReplacement(data.replacement);
  if (!summary || !replacement) {
    throw new Error("The model returned an empty fix response.");
  }

  return {
    filePath,
    startLine: thread.startLine,
    endLine: thread.endLine,
    replacement,
    summary,
  };
}

async function answerQuestionThread(
  ctx: ExtensionCommandContext,
  model: NonNullable<ExtensionCommandContext["model"]>,
  auth: ModelAuthSuccess,
  thread: DiffityThread,
): Promise<string> {
  const source = await readThreadSource(
    ctx.cwd,
    thread.filePath,
    thread.startLine,
    thread.endLine,
  );
  const prompt = [
    "Answer the code review question.",
    "Return only valid JSON with key: summary.",
    "summary must be the short answer to the question.",
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

  const response = await complete(
    model,
    {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
          timestamp: Date.now(),
        },
      ],
    },
    {
      apiKey: auth.apiKey,
      headers: auth.headers,
      env: auth.env,
      signal: ctx.signal,
    },
  );

  const answer = response.content
    .filter(isTextBlock)
    .map((part) => part.text)
    .join("\n")
    .trim();
  const data = parseModelJson(answer, "diffity question response") as {
    summary?: unknown;
  };

  if (typeof data.summary !== "string") {
    throw new Error("The model did not return a valid question response.");
  }

  const summary = normalizeSummary(data.summary);
  if (!summary) {
    throw new Error("The model returned an empty question response.");
  }

  return summary;
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
  if (result.code !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        `Unable to resolve thread ${threadId}.`,
    );
  }
}

async function applyReplacement(
  cwd: string,
  filePath: string,
  startLine: number,
  endLine: number,
  replacement: string,
): Promise<void> {
  const fullPath = join(cwd, filePath);
  const original = await readFile(fullPath, "utf8");
  const hasTrailingNewline = original.endsWith("\n");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);
  if (hasTrailingNewline) {
    lines.pop();
  }

  const startIndex = Math.max(0, startLine - 1);
  const endIndex = Math.max(startIndex, endLine);
  const replacementLines = replacement.replace(/\r\n/g, "\n").split("\n");
  lines.splice(startIndex, endIndex - startIndex, ...replacementLines);
  const updated = lines.join(newline);
  await writeFile(
    fullPath,
    hasTrailingNewline ? `${updated}${newline}` : updated,
    "utf8",
  );
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
  if (result.code !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        "Unable to determine the git repository root.",
    );
  }

  return result.stdout.trim();
}

async function runDiffity(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  args: string[],
) {
  return runProcess(DIFFITY_DIFF_CMD, args, ctx.cwd, pi, ctx);
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

function normalizeReplacement(text: string): string {
  return text.replace(/\r\n/g, "\n").trimEnd();
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

import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { complete } from "@earendil-works/pi-ai/compat";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import { getLastCommitTime, git, gitText } from "../../utils/git.ts";
import {
  getCommandErrorMessage,
  throwIfCommandFailed,
} from "../../utils/process.ts";
import { createLogger, type Logger } from "../../utils/logging.ts";
import { getEntriesAfterTime, getEntryTime } from "../../utils/session.ts";

const GIT_SOURCE = "git status, diffs, and untracked files";
const INSUFFICIENT_CONTEXT_RESPONSE = "CONTEXT_NOT_ENOUGH";
const GIT_CONTEXT_TOTAL_MAX_CHARS = 5_000;
const AI_MESSAGE_LOG_MAX_CHARS = 500;
const UNTRACKED_FILE_LIMIT = 10;
const UNTRACKED_FILE_SUMMARY_MAX_CHARS = 400;
const COMMIT_MODEL_PROVIDER = "openai-codex";
const COMMIT_MODEL_ID = "gpt-5.4-mini";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("commit", {
    description: "Generate an editable conventional commit template",
    handler: async (_args, ctx) => {
      if (!(await isGitRepo(pi, ctx))) {
        logger.log("Not inside a git repository.", "error");
        return;
      }

      if (!(await hasChanges(pi, ctx))) {
        logger.log("No changes to commit.", "warning");
        return;
      }

      const commitDraft = await generateCommitMessage(pi, ctx, logger);
      if (!commitDraft) {
        logger.log(
          `Unable to generate a commit message with the active model.`,
          "error",
        );
        return;
      }

      await stageAndCommit(pi, ctx, commitDraft, logger);
    },
  });
}

async function generateCommitMessage(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  logger: Logger,
): Promise<{ subject: string; assistedBy?: string } | null> {
  const { contexts, hasUserMessages } = await getCommitContexts(pi, ctx);
  const previousModel = ctx.model;
  if (!previousModel) {
    logger.log("No active model is available.", "error");
    return null;
  }

  const commitModel = ctx.modelRegistry.find(
    COMMIT_MODEL_PROVIDER,
    COMMIT_MODEL_ID,
  );
  if (!commitModel) {
    logger.log(
      `Commit model ${COMMIT_MODEL_PROVIDER}/${COMMIT_MODEL_ID} is not available.`,
      "error",
    );
    return null;
  }

  try {
    if (!(await pi.setModel(commitModel))) {
      logger.log(
        `Unable to authenticate commit model ${COMMIT_MODEL_PROVIDER}/${COMMIT_MODEL_ID}.`,
        "error",
      );
      return null;
    }

    for (const context of contexts) {
      const prompt = buildCommitPrompt(context.text, context.source);
      logger.log(
        `Generate commit (${context.source}):\n${truncateText(context.text, AI_MESSAGE_LOG_MAX_CHARS)}`,
        "info",
      );
      const message = await askModel(ctx, prompt, logger);
      const commitMessage = normalizeOneLine(message ?? "");
      if (!commitMessage) continue;
      if (isContextNotEnough(commitMessage)) {
        continue;
      }

      return {
        subject: commitMessage,
        assistedBy: hasUserMessages ? formatModelRef(previousModel) : undefined,
      };
    }

    return null;
  } finally {
    try {
      if (!(await pi.setModel(previousModel))) {
        logger.log("Unable to restore the previously active model.", "error");
      }
    } catch (error) {
      logger.log(
        `Unable to restore the previously active model: ${getErrorMessage(error, "unknown error")}`,
        "error",
      );
    }
  }
}

async function getCommitContexts(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<{
  contexts: { text: string; source: string }[];
  hasUserMessages: boolean;
}> {
  const lastCommitTime = await getLastCommitTime(pi, ctx);
  const entries = getEntriesAfterTime(
    ctx.sessionManager.getBranch(),
    lastCommitTime,
  );

  const results = entries.filter(isAssistantMessage);
  const prompts = entries.filter(isUserMessage);
  const contexts: { text: string; source: string }[] = [];

  const promptText = renderTranscript(prompts);
  if (promptText) {
    contexts.push({ text: promptText, source: "session user prompts" });
  }

  if (results.length > 0) {
    const sessionText = renderTranscript([...prompts, ...results].sort(byTime));
    if (sessionText && sessionText !== promptText) {
      contexts.push({
        text: sessionText,
        source: "session user prompts and result messages",
      });
    }
  }

  contexts.push({ text: await getGitContext(pi, ctx), source: GIT_SOURCE });
  return {
    contexts,
    hasUserMessages: prompts.length > 0,
  };
}

function isContextNotEnough(text: string): boolean {
  const normalized = text.toUpperCase().replace(/[^A-Z]+/g, "");
  return (
    normalized === "CONTEXTNOTENOUGH" ||
    normalized === "CONTEXTISNOTENOUGH" ||
    normalized === "NOTENOUGHCONTEXT" ||
    normalized === "NEEDMORECONTEXT" ||
    normalized === "MORECONTEXTNEEDED"
  );
}

async function askModel(
  ctx: ExtensionCommandContext,
  prompt: string,
  logger: Logger,
): Promise<string | null> {
  const model = ctx.model;
  if (!model) {
    logger.log("No active model is available.", "error");
    return null;
  }

  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
  if (!auth.ok || !auth.apiKey) {
    logger.log("Unable to authenticate the active model.", "error");
    return null;
  }

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
    .join("\n");

  return answer;
}

async function stageAndCommit(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  commitDraft: { subject: string; assistedBy?: string },
  logger: Logger,
): Promise<void> {
  let finalCommitMessage = formatCommitMessage(
    commitDraft.subject,
    commitDraft.assistedBy,
  );

  if (ctx.hasUI) {
    const edited = await ctx.ui.editor(
      "Edit commit message",
      finalCommitMessage,
    );
    if (edited === undefined) {
      logger.log("Commit was cancelled.", "warning");
      return;
    }

    finalCommitMessage = normalizeCommitMessage(edited);
    if (!finalCommitMessage) {
      logger.log("Commit message is empty.", "warning");
      return;
    }
  }

  const add = await git(pi, ctx, ["add", "-A"]);
  if (add.code !== 0) {
    logger.log(
      `Failed to stage changes for commit: ${getCommandErrorMessage(add, "unknown error")}`,
      "error",
    );
    return;
  }

  const commit = await git(pi, ctx, ["commit", "-m", finalCommitMessage]);
  if (commit.code === 0) {
    logger.log("Git commit commpleted");
  } else {
    logger.log("Error in running git commit.", "error");
  }
}

async function getGitContext(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<string> {
  const [status, stagedDiff, diff] = await Promise.all([
    gitText(pi, ctx, ["status", "--porcelain"]),
    gitText(pi, ctx, ["diff", "--cached", "--no-ext-diff", "--no-color"]),
    gitText(pi, ctx, ["diff", "--no-ext-diff", "--no-color"]),
  ]);
  const untracked = await summarizeUntrackedFiles(ctx, status);

  const gitContext = [
    section("Git status", status || "[clean]"),
    section("Staged diff", stagedDiff || "[no staged diff]"),
    section("Working tree diff", diff || "[no diff]"),
    untracked.length > 0
      ? section("Untracked files", untracked.join("\n---\n"))
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return truncateText(gitContext, GIT_CONTEXT_TOTAL_MAX_CHARS);
}

async function summarizeUntrackedFiles(
  ctx: ExtensionCommandContext,
  status: string,
): Promise<string[]> {
  const files = status
    .split(/\r?\n/)
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3).trim())
    .filter(Boolean);

  const summaries: string[] = [];
  for (const file of files.slice(0, UNTRACKED_FILE_LIMIT)) {
    summaries.push(
      truncateText(
        await summarizeFile(ctx, file),
        UNTRACKED_FILE_SUMMARY_MAX_CHARS,
      ),
    );
  }

  if (files.length > UNTRACKED_FILE_LIMIT) {
    summaries.push(
      `[${files.length - UNTRACKED_FILE_LIMIT} more untracked file(s) omitted]`,
    );
  }

  return summaries;
}

async function summarizeFile(
  ctx: ExtensionCommandContext,
  file: string,
): Promise<string> {
  try {
    const path = join(ctx.cwd, file);
    const fileStat = await stat(path);
    if (fileStat.size > 200_000) return `File: ${file}\n[too large to include]`;

    const text = (await readFile(path, "utf8")).trim();
    if (!text) return `File: ${file}\n[empty or binary file]`;

    const snippet = truncateText(text, UNTRACKED_FILE_SUMMARY_MAX_CHARS);
    return `File: ${file}\n${snippet}`;
  } catch (error) {
    return `File: ${file}\n[${getErrorMessage(error, "unable to read file contents")}]`;
  }
}

async function isGitRepo(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<boolean> {
  const result = await git(pi, ctx, ["rev-parse", "--is-inside-work-tree"]);
  return result.code === 0 && result.stdout.trim() === "true";
}

async function hasChanges(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<boolean> {
  const status = await gitText(pi, ctx, ["status", "--porcelain"]);
  return status.trim().length > 0;
}

function renderTranscript(entries: SessionEntry[]): string {
  return entries.map(renderEntry).filter(Boolean).join("\n\n");
}

function renderEntry(entry: SessionEntry): string {
  if (!isUserMessage(entry) && !isAssistantMessage(entry)) return "";

  const label = isUserMessage(entry) ? "User" : "Assistant";
  const text = extractText(entry.message.content);
  return text ? `${label}: ${text}` : "";
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";

  return content
    .filter(isTextBlock)
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeOneLine(text: string): string {
  const line = text
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("```"));

  return (line ?? "")
    .replace(/^commit message:\s*/i, "")
    .replace(/^['"`]+|['"`]+$/g, "")
    .trim();
}

function normalizeCommitMessage(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function formatCommitMessage(subject: string, assistedBy?: string): string {
  return assistedBy ? `${subject}\n\nAssisted-by: ${assistedBy}` : subject;
}

function formatModelRef(model: { provider: string; id: string }): string {
  return `${model.provider}/${model.id}`;
}

function buildCommitPrompt(contextText: string, source: string): string {
  return [
    "Write one concise conventional commit subject.",
    `If the context is not enough to infer one, reply exactly ${INSUFFICIENT_CONTEXT_RESPONSE} or "context is not enough".`,
    "Otherwise return exactly one line and nothing else.",
    "Use format: type(scope): description or type: description.",
    "Prefer a meaningful scope when obvious.",
    "",
    `Context source: ${source}`,
    "<context>",
    contextText,
    "</context>",
  ].join("\n");
}

function section(title: string, body: string): string {
  return `${title}:\n${body}`;
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
}

function byTime(a: SessionEntry, b: SessionEntry): number {
  return getEntryTime(a) - getEntryTime(b);
}

type UserOrAssistantEntry = SessionEntry & {
  type: "message";
  message: { role: "user" | "assistant"; content: unknown };
};

function isAssistantMessage(
  entry: SessionEntry,
): entry is UserOrAssistantEntry & {
  message: { role: "assistant"; content: unknown };
} {
  return entry.type === "message" && entry.message.role === "assistant";
}

function isUserMessage(entry: SessionEntry): entry is UserOrAssistantEntry & {
  message: { role: "user"; content: unknown };
} {
  return entry.type === "message" && entry.message.role === "user";
}

function isTextBlock(block: unknown): block is { type: "text"; text: string } {
  return (
    typeof block === "object" &&
    block !== null &&
    "type" in block &&
    (block as { type?: unknown }).type === "text" &&
    "text" in block &&
    typeof (block as { text?: unknown }).text === "string"
  );
}

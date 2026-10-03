import type { ImageContent, TextContent } from "@earendil-works/pi-ai";
import {
  createReadTool,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";

const FILE_CONTEXT_TYPE = "file-context";
const REFERENCE_PATTERN = /(?<![\w@/:\\])@([^\s"'`<>]+)/gu;
const TRAILING_PUNCTUATION = /[.,;:!?\]\)}]+$/gu;
const MAX_ERROR_LENGTH = 200;

type ContextContent = TextContent | ImageContent;

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const paths = parseReferences(event.prompt);
    if (paths.length === 0) return;

    const read = createReadTool(ctx.cwd);
    const files = await Promise.all(
      paths.map(async (path, index): Promise<ContextContent[]> => {
        const content: ContextContent[] = [];
        if (index > 0) content.push({ type: "text", text: "\n\n" });
        content.push({ type: "text", text: `File: ${path}\n` });

        try {
          const result = await read.execute("auto-read", { path }, ctx.signal);
          content.push(...result.content);
        } catch (error) {
          content.push({
            type: "text",
            text: `[Unable to read: ${formatError(error)}]`,
          });
        }
        return content;
      }),
    );

    return {
      message: {
        customType: FILE_CONTEXT_TYPE,
        content: files.flat(),
        display: false,
      },
    };
  });
}

export function parseReferences(prompt: string): string[] {
  const paths = new Set<string>();

  for (const match of prompt.matchAll(REFERENCE_PATTERN)) {
    const rawPath = match[1];
    if (!rawPath) continue;

    const path = rawPath.replace(TRAILING_PUNCTUATION, "");
    if (
      !path ||
      path.startsWith("@") ||
      isUrl(path) ||
      /[*?{}[\]]/u.test(path)
    ) {
      continue;
    }

    paths.add(path);
  }

  return [...paths];
}

function isUrl(path: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\//iu.test(path);
}

function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const singleLine = message.replace(/\s+/gu, " ").trim();
  if (singleLine.length <= MAX_ERROR_LENGTH) return singleLine;
  return `${singleLine.slice(0, MAX_ERROR_LENGTH - 1)}…`;
}

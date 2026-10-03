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
type ReadResult = Awaited<
  ReturnType<ReturnType<typeof createReadTool>["execute"]>
>;
type FileContext =
  | { path: string; result: ReadResult }
  | { path: string; error: string };

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const paths = parseReferences(event.prompt);
    if (paths.length === 0) return;

    const read = createReadTool(ctx.cwd);
    const files = await Promise.all(
      paths.map(async (path): Promise<FileContext> => {
        try {
          const result = await read.execute("auto-read", { path }, ctx.signal);
          return { path, result };
        } catch (error) {
          return { path, error: formatError(error) };
        }
      }),
    );

    return {
      message: {
        customType: FILE_CONTEXT_TYPE,
        content: formatFiles(files),
        display: false,
      },
    };
  });
}

export function parseReferences(prompt: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const match of prompt.matchAll(REFERENCE_PATTERN)) {
    const rawPath = match[1];
    if (!rawPath) continue;

    const path = rawPath.replace(TRAILING_PUNCTUATION, "");
    if (
      !path ||
      path.startsWith("@") ||
      seen.has(path) ||
      isUrl(path) ||
      /[*?{}[\]]/u.test(path)
    ) {
      continue;
    }

    seen.add(path);
    paths.push(path);
  }

  return paths;
}

function formatFiles(files: FileContext[]): ContextContent[] {
  const content: ContextContent[] = [];

  for (const [index, file] of files.entries()) {
    if (index > 0) {
      content.push({ type: "text", text: "\n\n" });
    }

    content.push({ type: "text", text: `File: ${file.path}\n` });
    if ("error" in file) {
      content.push({ type: "text", text: `[Unable to read: ${file.error}]` });
      continue;
    }

    content.push(...file.result.content);
  }

  return content;
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

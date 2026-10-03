import type { ImageContent, TextContent } from "@earendil-works/pi-ai";
import {
  createReadTool,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";

const REFERENCE_PATTERN = /(?<![\w@/:\\])@([^\s"'`<>]+)/gu;
const TRAILING_PUNCTUATION = /[.,;:!?\]\)}]+$/gu;
const MAX_ERROR_LENGTH = 200;

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const paths = parseReferences(event.prompt);
    if (paths.length === 0) return;

    const read = createReadTool(ctx.cwd);
    const files = await Promise.all(
      paths.map(async (path, index) => {
        const content: (TextContent | ImageContent)[] = [
          { type: "text", text: `File: ${path}\n` },
        ];
        if (index > 0) content.unshift({ type: "text", text: "\n\n" });

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
        customType: "file-context",
        content: files.flat(),
        display: false,
      },
    };
  });
}

export function parseReferences(prompt: string): string[] {
  const paths = new Set<string>();

  for (const match of prompt.matchAll(REFERENCE_PATTERN)) {
    const path = match[1]?.replace(TRAILING_PUNCTUATION, "");
    if (
      !path ||
      path.startsWith("@") ||
      /^[a-z][a-z\d+.-]*:\/\//iu.test(path) ||
      /[*?{}[\]]/u.test(path)
    ) {
      continue;
    }

    paths.add(path);
  }

  return [...paths];
}

function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const singleLine = message.replace(/\s+/gu, " ").trim();
  if (singleLine.length <= MAX_ERROR_LENGTH) return singleLine;
  return `${singleLine.slice(0, MAX_ERROR_LENGTH - 1)}…`;
}

import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { createReadTool } from "@earendil-works/pi-coding-agent";
import extension, { parseReferences } from "./index.ts";

test("references keep order, deduplicate, and ignore non-file tokens", () => {
  assert.deepEqual(
    parseReferences("(@src/storage.ts) `@README.md` @src/storage.ts."),
    ["src/storage.ts", "README.md"],
  );
  assert.deepEqual(
    parseReferences(
      "email@example.com https://host/@file @@file \\@file @https://host/file @src/*.ts @src/[a].ts @src/{a,b}.ts",
    ),
    [],
  );
  assert.deepEqual(parseReferences("@./file @../file @/file @~/file @!"), [
    "./file",
    "../file",
    "/file",
    "~/file",
  ]);
});

test("attachments preserve prompt, read output, order, and isolated errors", async () => {
  let handler;
  extension({
    on: (_event, callback) => {
      handler = callback;
    },
  });
  const ctx = { cwd: resolve(import.meta.dirname, "../..") };
  assert.equal(await handler({ prompt: "Explain README.md" }, ctx), undefined);

  const path = "skills/ponytail/SKILL.md";
  const event = { prompt: `Read @${path} @${path} @missing-ponytail-file.txt` };
  const prompt = event.prompt;
  const result = await handler(event, ctx);
  const content = result.message.content;
  const read = await createReadTool(ctx.cwd).execute("test", { path });
  assert.equal(event.prompt, prompt);
  assert.equal(result.message.customType, "file-context");
  assert.equal(result.message.display, false);
  assert.deepEqual(content.slice(0, 1 + read.content.length), [
    { type: "text", text: `File: ${path}\n` },
    ...read.content,
  ]);
  assert.deepEqual(content.slice(-3, -1), [
    { type: "text", text: "\n\n" },
    { type: "text", text: "File: missing-ponytail-file.txt\n" },
  ]);
  assert.match(content.at(-1).text, /^\[Unable to read: /);
  assert.equal(content.length, read.content.length + 4);
  assert.deepEqual(await handler(event, ctx), result);
});

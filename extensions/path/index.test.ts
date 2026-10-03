import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type TestContext, test } from "node:test";
import type {
  BeforeAgentStartEvent,
  BeforeAgentStartEventResult,
  ExtensionAPI,
  ExtensionContext,
  ExtensionHandler,
} from "@earendil-works/pi-coding-agent";
import pathExtension from "./index.ts";

async function attach(prompt: string, cwd: string) {
  let handler:
    | ExtensionHandler<BeforeAgentStartEvent, BeforeAgentStartEventResult>
    | undefined;
  pathExtension({
    on(event: string, callback: typeof handler) {
      assert.equal(event, "before_agent_start");
      handler = callback;
    },
  } as unknown as ExtensionAPI);
  assert.ok(handler);
  const result = await handler(
    { prompt } as BeforeAgentStartEvent,
    { cwd } as ExtensionContext,
  );
  assert.ok(result?.message);
  assert.equal(result.message.customType, "file-context");
  assert.equal(result.message.display, false);
  const content = result.message.content;
  assert.ok(Array.isArray(content));
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

async function fixture(t: TestContext) {
  const cwd = await mkdtemp(join(tmpdir(), "pi-path-test-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

test("directory listings are shallow, directories-first, and include dotfiles", async (t) => {
  const cwd = await fixture(t);
  await mkdir(join(cwd, "attached", "z-dir"), { recursive: true });
  await mkdir(join(cwd, "attached", "a-dir"));
  await writeFile(
    join(cwd, "attached", "z-dir", "nested.txt"),
    "nested secret",
  );
  await writeFile(join(cwd, "attached", "b.txt"), "file secret");
  await writeFile(join(cwd, "attached", ".hidden"), "hidden secret");
  await symlink("z-dir", join(cwd, "attached", "link"));
  await symlink("missing", join(cwd, "attached", "broken"));

  assert.equal(
    await attach("@attached/", cwd),
    "Directory: attached/\na-dir/\nz-dir/\n.hidden\nb.txt\nbroken\nlink",
  );
});

test("empty directories and absolute directory symlinks work", async (t) => {
  const cwd = await fixture(t);
  await mkdir(join(cwd, "empty"));
  const link = join(cwd, "link");
  await symlink("empty", link);
  assert.equal(
    await attach(`@${link}`, cwd),
    `Directory: ${link}\n(empty directory)`,
  );
});

test("directory listings stop at 200 entries and report truncation", async (t) => {
  const cwd = await fixture(t);
  await Promise.all(
    Array.from({ length: 201 }, (_, i) =>
      writeFile(join(cwd, `entry-${String(i).padStart(3, "0")}`), "secret"),
    ),
  );
  const lines = (await attach("@./", cwd)).split("\n");
  assert.equal(lines.length, 202);
  assert.equal(lines[200], "entry-199");
  assert.equal(lines[201], "[Truncated: showing 200 of 201 entries]");
});

test("exactly 200 entries are not marked truncated", async (t) => {
  const cwd = await fixture(t);
  await Promise.all(
    Array.from({ length: 200 }, (_, i) => writeFile(join(cwd, `${i}`), "")),
  );
  const output = await attach("@./", cwd);
  assert.equal(output.split("\n").length, 201);
  assert.ok(!output.includes("[Truncated:"));
});

test("mixed references preserve order, deduplicate, and isolate errors", async (t) => {
  const cwd = await fixture(t);
  await writeFile(join(cwd, "file.txt"), "file contents");
  await mkdir(join(cwd, "empty"));
  const output = await attach("@file.txt @missing @empty @file.txt", cwd);
  assert.match(output, /^File: file.txt\nfile contents\n\nFile: missing\n/);
  assert.match(
    output,
    /\[Unable to read: .*\]\n\nDirectory: empty\n\(empty directory\)$/,
  );
  assert.equal(output.split("File: file.txt").length, 2);
});

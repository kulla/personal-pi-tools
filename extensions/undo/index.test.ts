import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import undo from "./index.ts";

test("undo rewinds before last user message and handles empty branches", async () => {
  let handler:
    | Parameters<ExtensionAPI["registerCommand"]>[1]["handler"]
    | undefined;
  undo({
    registerEntryRenderer() {},
    registerCommand(
      name: string,
      command: Parameters<ExtensionAPI["registerCommand"]>[1],
    ) {
      assert.equal(name, "undo");
      handler = command.handler;
    },
  } as unknown as ExtensionAPI);
  assert.ok(handler);

  for (const [roles, target] of [
    [[], undefined],
    [["assistant", "assistant"], "0"],
    [["user", "assistant"], "0"],
    [["assistant", "user", "assistant", "user", "assistant"], "2"],
  ] as const) {
    const entries = roles.map((role, index) => ({
      id: String(index),
      type: "message",
      message: { role },
    })) as SessionEntry[];
    const visited: string[] = [];
    let aborted = false;
    const ctx = {
      isIdle: () => false,
      abort: () => {
        aborted = true;
      },
      waitForIdle: async () => {},
      sessionManager: { getBranch: () => entries },
      navigateTree: async (id: string, options: { summarize: boolean }) => {
        assert.deepEqual(options, { summarize: false });
        visited.push(id);
        return { cancelled: false };
      },
    } as unknown as ExtensionCommandContext;
    await handler("", ctx);
    assert.equal(aborted, true);
    assert.deepEqual(visited, target === undefined ? [] : [target]);
  }
});

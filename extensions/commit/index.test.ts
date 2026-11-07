import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import commitExtension from "./index.ts";

test("/commit drafts with low reasoning without changing session model", async () => {
  const commands: string[][] = [];
  const model = { provider: "openai", id: "gpt-6-luna" };
  let handler:
    | ((args: string, ctx: ExtensionCommandContext) => Promise<void>)
    | undefined;
  const pi = {
    registerEntryRenderer() {},
    appendEntry() {},
    registerCommand(_name: string, command: { handler: typeof handler }) {
      handler = command.handler;
    },
    async exec(_command: string, args: string[]) {
      commands.push(args);
      return {
        code: 0,
        stdout:
          args[0] === "status"
            ? " M file.ts"
            : args[0] === "log"
              ? "0"
              : "true",
        stderr: "",
      };
    },
  } as unknown as ExtensionAPI;
  commitExtension(pi);
  assert.ok(handler);

  const ctx = {
    cwd: process.cwd(),
    model: { provider: "openai", id: "gpt-6-sol" },
    hasUI: false,
    sessionManager: { getBranch: () => [] },
    modelRegistry: {
      find: () => model,
      streamSimple(
        selected: unknown,
        _context: unknown,
        options: { reasoning: string },
      ) {
        assert.equal(selected, model);
        assert.equal(options.reasoning, "low");
        return {
          result: async () => ({
            stopReason: "stop",
            content: [{ type: "text", text: "fix: update file" }],
          }),
        };
      },
    },
  } as unknown as ExtensionCommandContext;
  await handler("", ctx);
  assert.ok(commands.some((args) => args.join(" ") === "add -A"));
  assert.ok(
    commands.some((args) => args.join(" ") === "commit -m fix: update file"),
  );
});

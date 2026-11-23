import { test } from "bun:test"
import assert from "node:assert/strict"

import type {
  ExtensionAPI,
  ExtensionCommandContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent"

import revert from "./index.ts"

test("revert stashes changes and rewinds to first entry after latest commit", async () => {
  let handler: Parameters<ExtensionAPI["registerCommand"]>[1]["handler"] | undefined
  const commands: string[] = []
  revert({
    registerEntryRenderer() {},
    registerCommand(_name: string, command: Parameters<ExtensionAPI["registerCommand"]>[1]) {
      handler = command.handler
    },
    async exec(_command: string, args: string[]) {
      commands.push(args.join(" "))
      return { code: 0, stdout: args[0] === "log" ? "100" : "true", stderr: "" }
    },
  } as unknown as ExtensionAPI)
  assert.ok(handler)

  const entries = [
    { id: "later", timestamp: "1970-01-01T00:01:42Z" },
    { id: "earlier", timestamp: "1970-01-01T00:01:41Z" },
    { id: "before", timestamp: "1970-01-01T00:01:39Z" },
  ] as SessionEntry[]
  const visited: string[] = []
  await handler("", {
    cwd: process.cwd(),
    isIdle: () => true,
    waitForIdle: async () => {},
    sessionManager: { getBranch: () => entries },
    navigateTree: async (id: string, options: { summarize: boolean }) => {
      assert.deepEqual(options, { summarize: false })
      visited.push(id)
      return { cancelled: false }
    },
  } as unknown as ExtensionCommandContext)

  assert.ok(commands.includes("stash push --include-untracked"))
  assert.deepEqual(visited, ["earlier"])
})

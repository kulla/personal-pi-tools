import { test } from "bun:test"
import assert from "node:assert/strict"

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent"

import modelSwitch from "./index.ts"

test("model commands switch to their models and report unavailable models or auth", async () => {
  const commands = new Map<string, Parameters<ExtensionAPI["registerCommand"]>[1]>()
  let selected: unknown
  let thinkingLevel: string | undefined
  let authenticated = true
  modelSwitch({
    registerCommand(name, command) {
      commands.set(name, command)
    },
    async setModel(model) {
      if (!authenticated) return false
      selected = model
      return true
    },
    setThinkingLevel(level) {
      thinkingLevel = level
    },
  } as ExtensionAPI)

  for (const [name, id] of [
    ["luna", "gpt-6-luna"],
    ["sol", "gpt-6-sol"],
    ["astra", "gpt-6-astra"],
  ] as const) {
    const command = commands.get(name)
    assert.ok(command)
    const model = { provider: "openai", id }
    const notifications: [string, string | undefined][] = []
    let available = true
    const ctx = {
      modelRegistry: { find: () => (available ? model : undefined) },
      ui: { notify: (message: string, level?: string) => notifications.push([message, level]) },
    } as unknown as ExtensionCommandContext

    await command.handler("", ctx)
    assert.equal(selected, model)
    assert.equal(thinkingLevel, "high")
    assert.deepEqual(notifications.pop(), [`Switched to openai/${id}.`, "info"])

    available = false
    await command.handler("", ctx)
    assert.deepEqual(notifications.pop(), [`Model openai/${id} is not available.`, "error"])

    available = true
    authenticated = false
    await command.handler("", ctx)
    assert.deepEqual(notifications.pop(), [`Unable to authenticate openai/${id}.`, "error"])
    authenticated = true
  }
})

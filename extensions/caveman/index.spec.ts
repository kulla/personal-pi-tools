import { test } from "bun:test"
import assert from "node:assert/strict"

import type {
  BeforeAgentStartEvent,
  BeforeAgentStartEventResult,
  ExtensionAPI,
  ExtensionContext,
  ExtensionHandler,
} from "@earendil-works/pi-coding-agent"

import caveman from "./index.ts"

test("caveman adds a structured section without replacing the system prompt", async () => {
  let handler: ExtensionHandler<BeforeAgentStartEvent, BeforeAgentStartEventResult> | undefined
  caveman({
    on(_event: string, callback: typeof handler) {
      handler = callback
    },
  } as unknown as ExtensionAPI)
  assert.ok(handler)

  const sections = { other: "Keep existing instructions." } as Record<string, string>
  const event = {
    messageType: "user",
    systemPrompt: "Existing system prompt",
    systemPromptOptions: { sections },
  } as BeforeAgentStartEvent

  assert.equal(await handler(event, {} as ExtensionContext), undefined)
  assert.equal(event.systemPrompt, "Existing system prompt")
  assert.equal(sections.other, "Keep existing instructions.")
  assert.ok(sections.caveman)
  assert.match(sections.caveman, /Respond like smart caveman/)
})

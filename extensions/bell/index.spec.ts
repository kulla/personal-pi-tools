import { mock, test } from "bun:test"
import assert from "node:assert/strict"

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"

import bell from "./index.ts"

test("bell rings once only after interactive agent settles", () => {
  let onSettled: ((event: unknown, ctx: ExtensionContext) => void) | undefined
  bell({
    on(event: string, handler: typeof onSettled) {
      assert.equal(event, "agent_settled")
      onSettled = handler
    },
  } as unknown as ExtensionAPI)
  assert.ok(onSettled)

  const write = mock((_text: string) => true)
  const originalWrite = process.stdout.write
  process.stdout.write = write as typeof originalWrite
  try {
    for (const mode of ["print", "json", "rpc", "tui"] as const) {
      onSettled({}, { mode } as ExtensionContext)
    }
    assert.equal(write.mock.calls.length, 1)
    assert.equal(write.mock.calls[0]?.[0], "\x07")
  } finally {
    process.stdout.write = originalWrite
  }
})

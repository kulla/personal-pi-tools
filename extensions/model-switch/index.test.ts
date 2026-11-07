import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import modelSwitch from "./index.ts";

test("model commands select exact models and report missing models or auth", async () => {
  const commands = new Map<
    string,
    Parameters<ExtensionAPI["registerCommand"]>[1]
  >();
  let authenticated = true;
  const selected: unknown[] = [];
  const thinkingLevels: string[] = [];
  modelSwitch({
    registerCommand(name, command) {
      commands.set(name, command);
    },
    async setModel(model) {
      if (!authenticated) return false;
      selected.push(model);
      return true;
    },
    setThinkingLevel(level) {
      thinkingLevels.push(level);
    },
  } as ExtensionAPI);
  assert.deepEqual([...commands.keys()], ["luna", "sol", "astra"]);

  for (const [name, id] of [
    ["luna", "gpt-6-luna"],
    ["sol", "gpt-6-sol"],
    ["astra", "gpt-6-astra"],
  ] as const) {
    const command = commands.get(name);
    assert.ok(command);
    const model = { provider: "openai", id };
    let available = true;
    const notifications: [string, string | undefined][] = [];
    const ctx = {
      modelRegistry: {
        find(provider: string, modelId: string) {
          assert.equal(provider, model.provider);
          assert.equal(modelId, model.id);
          return available ? model : undefined;
        },
      },
      ui: {
        notify(message: string, level?: string) {
          notifications.push([message, level]);
        },
      },
    } as unknown as ExtensionCommandContext;

    authenticated = true;
    const thinkingLevelCount = thinkingLevels.length;
    await command.handler("", ctx);
    assert.equal(selected.at(-1), model);
    assert.deepEqual(notifications.pop(), [
      `Switched to openai/${id}.`,
      "info",
    ]);
    assert.deepEqual(
      thinkingLevels.slice(thinkingLevelCount),
      name === "luna" ? ["low"] : ["high"],
    );

    const count = selected.length;
    available = false;
    await command.handler("", ctx);
    assert.deepEqual(notifications.pop(), [
      `Model openai/${id} is not available.`,
      "error",
    ]);
    assert.equal(selected.length, count);

    available = true;
    authenticated = false;
    await command.handler("", ctx);
    assert.deepEqual(notifications.pop(), [
      `Unable to authenticate openai/${id}.`,
      "error",
    ]);
    assert.equal(selected.length, count);
  }
});

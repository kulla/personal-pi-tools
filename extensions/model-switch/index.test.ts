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
  modelSwitch({
    registerCommand(name, command) {
      commands.set(name, command);
    },
    async setModel(model) {
      if (!authenticated) return false;
      selected.push(model);
      return true;
    },
  } as ExtensionAPI);
  assert.deepEqual([...commands.keys()], ["luna", "sol"]);

  for (const [name, id] of [
    ["luna", "gpt-6-luna"],
    ["sol", "gpt-6.1-sol"],
  ] as const) {
    const command = commands.get(name);
    assert.ok(command);
    const model = { provider: "openai-codex", id };
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
    await command.handler("", ctx);
    assert.equal(selected.at(-1), model);
    assert.deepEqual(notifications.pop(), [
      `Switched to openai-codex/${id}.`,
      "info",
    ]);

    const count = selected.length;
    available = false;
    await command.handler("", ctx);
    assert.deepEqual(notifications.pop(), [
      `Model openai-codex/${id} is not available.`,
      "error",
    ]);
    assert.equal(selected.length, count);

    available = true;
    authenticated = false;
    await command.handler("", ctx);
    assert.deepEqual(notifications.pop(), [
      `Unable to authenticate openai-codex/${id}.`,
      "error",
    ]);
    assert.equal(selected.length, count);
  }
});

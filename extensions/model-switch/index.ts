import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  for (const [command, modelId, thinkingLevel] of [
    ["luna", "gpt-6-luna", "low"],
    ["sol", "gpt-6-sol", undefined],
    ["astra", "gpt-6-astra", undefined],
  ] as const) {
    const provider = "openai";
    const modelRef = `${provider}/${modelId}`;

    pi.registerCommand(command, {
      description: `Switch to ${modelRef}`,
      handler: async (_args, ctx) => {
        const model = ctx.modelRegistry.find(provider, modelId);
        if (!model) {
          ctx.ui.notify(`Model ${modelRef} is not available.`, "error");
          return;
        }

        if (!(await pi.setModel(model))) {
          ctx.ui.notify(`Unable to authenticate ${modelRef}.`, "error");
          return;
        }

        if (thinkingLevel) pi.setThinkingLevel(thinkingLevel);
        ctx.ui.notify(`Switched to ${modelRef}.`, "info");
      },
    });
  }
}

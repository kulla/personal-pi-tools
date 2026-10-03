import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  for (const [command, modelId] of [
    ["luna", "gpt-6-luna"],
    ["sol", "gpt-6.1-sol"],
  ] as const) {
    const provider = "openai-codex";
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

        ctx.ui.notify(`Switched to ${modelRef}.`, "info");
      },
    });
  }
}

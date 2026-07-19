import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getErrorMessage } from "../../utils/errors.ts";
import { createLogger } from "../../utils/logging.ts";
import { abortCurrentTurn } from "../../utils/session.ts";

export default function (pi: ExtensionAPI) {
  const logger = createLogger(pi);

  pi.registerCommand("undo", {
    description: "Abort the current turn and rewind to the previous prompt",
    handler: async (_args, ctx) => {
      try {
        abortCurrentTurn(ctx);
        await ctx.waitForIdle();
      } catch (error) {
        logger.log(
          getErrorMessage(error, "Unable to undo the current turn."),
          "error",
        );
      }
    },
  });
}

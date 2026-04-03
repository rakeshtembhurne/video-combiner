/**
 * Usage Extension - Track session token usage and costs
 * Use /usage to see current session statistics
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  // Track usage from assistant messages
  pi.on("message_end", async (event, ctx) => {
    if (event.message.role !== "assistant") return;

    const usage = event.message.usage;
    if (usage) {
      totalInputTokens += usage.inputTokens || 0;
      totalOutputTokens += usage.outputTokens || 0;
      totalCost += usage.cost || 0;
    }
  });

  pi.registerCommand("usage", {
    description: "Show session usage (tokens and cost)",
    handler: async (_args, ctx) => {
      const msg = `📊 Input: ${totalInputTokens.toLocaleString()} | Output: ${totalOutputTokens.toLocaleString()} | Cost: $${totalCost.toFixed(4)}`;
      ctx.ui.notify(msg, "info");
    },
  });
}

/**
 * Git Safety Extension - Protect against destructive git operations
 * Confirms before force push, hard reset, and other dangerous operations
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Dangerous git patterns
  const dangerousGitPatterns = [
    /\bgit\s+push\s+.*--force\b/,
    /\bgit\s+push\s+-f\b/,
    /\bgit\s+reset\s+--hard\b/,
    /\bgit\s+clean\s+-fd\b/,
    /\bgit\s+branch\s+-D\b/,
    /\bgit\s+checkout\s+--theirs\b/,
  ];

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return;

    const cmd = event.input.command || "";
    const isDangerous = dangerousGitPatterns.some(p => p.test(cmd));

    if (isDangerous) {
      const ok = await ctx.ui.confirm(
        "⚠️ Dangerous Git Operation",
        `Allow: ${cmd}?`
      );
      if (!ok) {
        return { block: true, reason: "Blocked by user" };
      }
    }
  });
}

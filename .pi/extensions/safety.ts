/**
 * Safety Extension - Blocks dangerous bash commands
 * Prompts for confirmation before executing potentially destructive operations
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Patterns for dangerous commands
  const dangerousPatterns = [
    /\brm\s+-rf\b/,           // rm -rf
    /\brm\s+-.*f.*r\b/,       // rm -fr, rm -r -f variants
    /\bsudo\s+rm\b/,          // sudo rm
    /\bdd\s+if=/,             // dd (disk operations)
    /\bmkfs\b/,               // format filesystem
    />\s*\/dev\//,            // redirect to /dev
    /\b:(){ :\|:& };:/,       // fork bomb
  ];

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return;

    const cmd = event.input.command || "";
    const isDangerous = dangerousPatterns.some(p => p.test(cmd));

    if (isDangerous) {
      const ok = await ctx.ui.confirm(
        "⚠️ Dangerous Command",
        `Allow: ${cmd}?`
      );
      if (!ok) {
        return { block: true, reason: "Blocked by user" };
      }
    }
  });
}

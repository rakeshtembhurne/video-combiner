/**
 * Files Extension - Enhanced file listing tool
 * Adds list_dir tool with better formatting than ls
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "list_dir",
    label: "List Directory",
    description: "List files and directories in a path with icons",
    parameters: Type.Object({
      path: Type.Optional(Type.String({ description: "Directory path (default: cwd)" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const dirPath = params.path || ctx.cwd;

      try {
        const entries = await readdir(dirPath);
        const lines = await Promise.all(
          entries.map(async (entry) => {
            try {
              const fullPath = join(dirPath, entry);
              const stats = await stat(fullPath);
              return stats.isDirectory() ? `📁 ${entry}/` : `📄 ${entry}`;
            } catch {
              return `❓ ${entry}`;
            }
          })
        );

        return {
          content: [{ type: "text", text: `${dirPath}:\n${lines.join("\n")}` }],
          details: { path: dirPath, count: entries.length },
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

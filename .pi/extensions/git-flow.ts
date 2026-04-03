/**
 * GitFlow Extension
 *
 * Enforces proper GitFlow workflow:
 * - main/master: Production only, no direct commits
 * - develop: Integration branch, features branch from here
 * - feature/*: From develop, merge back to develop
 * - hotfix/*: From main, merge to main AND develop
 * - release/*: From develop, merge to main AND develop
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// GitFlow branch categories
const MAIN_BRANCHES = ["main", "master"];
const DEVELOP_BRANCHES = ["develop", "dev"];
const PROTECTED_BRANCHES = [...MAIN_BRANCHES, ...DEVELOP_BRANCHES, "staging", "production"];

// Valid branch prefixes with their base branch
const BRANCH_RULES: Record<string, { from: string; to: string[] }> = {
  "feature/": { from: "develop", to: ["develop"] },
  "feat/": { from: "develop", to: ["develop"] },
  "bugfix/": { from: "develop", to: ["develop"] },
  "chore/": { from: "develop", to: ["develop"] },
  "refactor/": { from: "develop", to: ["develop"] },
  "test/": { from: "develop", to: ["develop"] },
  "docs/": { from: "develop", to: ["develop"] },
  "release/": { from: "develop", to: ["main", "develop"] },
  "hotfix/": { from: "main", to: ["main", "develop"] },
};

const COMMIT_PREFIXES = ["feat:", "fix:", "chore:", "refactor:", "docs:", "test:", "style:", "perf:", "ci:", "build:", "hotfix:"];

export default function (pi: ExtensionAPI) {
  // Warn on session start if on protected branch
  pi.on("session_start", async (_event, ctx) => {
    const branch = await getCurrentBranch(pi);
    if (!branch) return;

    if (isMainBranch(branch)) {
      ctx.ui.notify(`🚫 On ${branch} (production). Create a hotfix/* or switch to develop.`, "warning");
    } else if (branch === "develop") {
      ctx.ui.notify(`📍 On develop. Create feature/* branch for new work.`, "info");
    } else if (isProtected(branch)) {
      ctx.ui.notify(`⚠️ On protected branch: ${branch}`, "warning");
    }
  });

  // Intercept git commands
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return;

    const cmd = event.input.command || "";

    // === GIT COMMIT ===
    if (cmd.match(/\bgit\s+commit\b/)) {
      const branch = await getCurrentBranch(pi);

      // Block commits to main branches
      if (branch && isMainBranch(branch)) {
        const choice = await ctx.ui.select(
          `🚫 Cannot commit to '${branch}'`,
          [
            "Create hotfix/* (for urgent prod fix)",
            "Switch to develop branch",
            "Cancel"
          ]
        );

        if (choice?.includes("hotfix")) {
          const name = await ctx.ui.input("Hotfix name (e.g., fix-login-bug)");
          if (name) {
            await pi.exec("git", ["checkout", "main"]);
            await pi.exec("git", ["pull"]);
            await pi.exec("git", ["checkout", "-b", `hotfix/${name}`]);
            ctx.ui.notify(`✅ Created hotfix/hotfix/${name} from main`, "success");
          }
        } else if (choice?.includes("develop")) {
          await pi.exec("git", ["checkout", "develop"]);
          ctx.ui.notify(`✅ Switched to develop`, "success");
        }
        return { block: true, reason: "Cannot commit to main branch" };
      }

      // Block commits to develop (should work on feature branch)
      if (branch === "develop") {
        const choice = await ctx.ui.select(
          `⚠️ Committing directly to develop`,
          [
            "Create feature/* branch first",
            "Proceed anyway (not recommended)"
          ]
        );
        if (!choice?.includes("Proceed")) {
          const name = await ctx.ui.input("Feature name (e.g., user-auth)");
          if (name) {
            const prefix = name.includes("/") ? "" : "feature/";
            await pi.exec("git", ["checkout", "-b", `${prefix}${name}`]);
            ctx.ui.notify(`✅ Created ${prefix}${name}`, "success");
          }
          return { block: true, reason: "Create feature branch first" };
        }
      }

      // Validate commit message
      const messageMatch = cmd.match(/-m\s+["']?([^"']+)["']?/);
      if (messageMatch) {
        const message = messageMatch[1];
        if (!isValidCommitMessage(message)) {
          const ok = await ctx.ui.confirm(
            "⚠️ Commit Message Format",
            `Use conventional commits:\n${COMMIT_PREFIXES.slice(0, 5).join(", ")}\n\nYour message: "${message}"\n\nProceed anyway?`
          );
          if (!ok) return { block: true, reason: "Invalid commit message" };
        }
      }
    }

    // === GIT CHECKOUT/BRANCH (creating new branch) ===
    if (cmd.match(/\bgit\s+(checkout|switch)\s+-b\b/) || cmd.match(/\bgit\s+branch\s+\S+/)) {
      const branchMatch = cmd.match(/\bgit\s+(?:checkout|switch)\s+-b\s+(\S+)/) ||
                          cmd.match(/\bgit\s+branch\s+(\S+)/);
      if (!branchMatch) return;

      const newBranch = branchMatch[1];
      const rule = getBranchRule(newBranch);

      if (rule) {
        const currentBranch = await getCurrentBranch(pi);
        const correctBase = rule.from;

        // Check if branching from correct base
        if (currentBranch !== correctBase) {
          const ok = await ctx.ui.confirm(
            `⚠️ GitFlow: Wrong Base Branch`,
            `'${newBranch}' should be created from '${correctBase}'\nYou're on '${currentBranch}'.\n\nSwitch to '${correctBase}' first?`
          );
          if (ok) {
            await pi.exec("git", ["checkout", correctBase]);
            await pi.exec("git", ["pull"]);
            ctx.ui.notify(`✅ Switched to ${correctBase}. Now create your branch.`, "success");
            return { block: true, reason: "Switch to correct base branch first" };
          }
        }
      }
    }

    // === GIT MERGE ===
    if (cmd.match(/\bgit\s+merge\b/)) {
      const targetMatch = cmd.match(/\bgit\s+merge\s+(\S+)/);
      if (targetMatch) {
        const sourceBranch = targetMatch[1];
        const currentBranch = await getCurrentBranch(pi);
        const rule = getBranchRule(sourceBranch);

        if (rule && currentBranch) {
          // Check merge target is correct
          if (!rule.to.includes(currentBranch)) {
            const correctTargets = rule.to.join(" or ");
            const ok = await ctx.ui.confirm(
              `⚠️ GitFlow: Wrong Merge Target`,
              `'${sourceBranch}' should be merged to ${correctTargets}\nYou're on '${currentBranch}'.\n\nProceed anyway?`
            );
            if (!ok) return { block: true, reason: "Wrong merge target" };
          }
        }
      }
    }

    // === GIT PUSH ===
    if (cmd.match(/\bgit\s+push\b/)) {
      const branch = await getCurrentBranch(pi);
      if (branch && isMainBranch(branch)) {
        const ok = await ctx.ui.confirm(
          "🚫 Push to Production?",
          `Pushing to '${branch}' (production).\n\nThis should only happen via release or hotfix merge. Continue?`
        );
        if (!ok) return { block: true, reason: "Push to main blocked" };
      }
    }
  });

  // === COMMANDS ===

  pi.registerCommand("feature", {
    description: "Create a feature branch from develop",
    handler: async (args, ctx) => {
      const name = args || await ctx.ui.input("Feature name (e.g., user-auth)");
      if (!name) return;

      const branchName = name.includes("/") ? name : `feature/${name}`;

      // Ensure we're on develop
      const current = await getCurrentBranch(pi);
      if (current !== "develop") {
        await pi.exec("git", ["checkout", "develop"]);
        await pi.exec("git", ["pull"]);
      }

      await pi.exec("git", ["checkout", "-b", branchName]);
      ctx.ui.notify(`✅ Created ${branchName} from develop`, "success");
    },
  });

  pi.registerCommand("hotfix", {
    description: "Create a hotfix branch from main",
    handler: async (args, ctx) => {
      const name = args || await ctx.ui.input("Hotfix name (e.g., fix-login-crash)");
      if (!name) return;

      const branchName = name.includes("/") ? name : `hotfix/${name}`;

      // Ensure we're on main
      await pi.exec("git", ["checkout", "main"]);
      await pi.exec("git", ["pull"]);
      await pi.exec("git", ["checkout", "-b", branchName]);

      ctx.ui.notify(`✅ Created ${branchName} from main`, "success");
    },
  });

  pi.registerCommand("release", {
    description: "Create a release branch from develop",
    handler: async (args, ctx) => {
      const name = args || await ctx.ui.input("Release version (e.g., 1.2.0)");
      if (!name) return;

      const branchName = name.includes("/") ? name : `release/${name}`;

      // Ensure we're on develop
      await pi.exec("git", ["checkout", "develop"]);
      await pi.exec("git", ["pull"]);
      await pi.exec("git", ["checkout", "-b", branchName]);

      ctx.ui.notify(`✅ Created ${branchName} from develop`, "success");
    },
  });

  pi.registerCommand("gitflow", {
    description: "Show current branch and GitFlow status",
    handler: async (_args, ctx) => {
      const branch = await getCurrentBranch(pi);
      if (!branch) {
        ctx.ui.notify("Not a git repository", "error");
        return;
      }

      const rule = getBranchRule(branch);
      const { stdout } = await pi.exec("git", ["status", "--short"]);
      const status = stdout.trim() || "Clean";

      let info = `📍 Branch: ${branch}`;
      if (rule) {
        info += `\n   Created from: ${rule.from}`;
        info += `\n   Merge to: ${rule.to.join(", ")}`;
      } else if (isMainBranch(branch)) {
        info += `\n   ⚠️ Production branch - no direct commits`;
      } else if (branch === "develop") {
        info += `\n   Integration branch - create feature/* from here`;
      }

      ctx.ui.notify(`${info}\n\nStatus: ${status}`, "info");
    },
  });
}

// === HELPERS ===

async function getCurrentBranch(pi: ExtensionAPI): Promise<string | null> {
  try {
    const { stdout, code } = await pi.exec("git", ["branch", "--show-current"]);
    return code === 0 ? stdout.trim() : null;
  } catch {
    return null;
  }
}

function isMainBranch(branch: string): boolean {
  return MAIN_BRANCHES.includes(branch);
}

function isProtected(branch: string): boolean {
  return PROTECTED_BRANCHES.includes(branch);
}

function getBranchRule(branch: string): { from: string; to: string[] } | null {
  for (const [prefix, rule] of Object.entries(BRANCH_RULES)) {
    if (branch.startsWith(prefix)) return rule;
  }
  return null;
}

function isValidCommitMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return COMMIT_PREFIXES.some(p => lower.startsWith(p));
}

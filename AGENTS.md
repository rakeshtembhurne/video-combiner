# video-combiner - AI Coding Assistant Configuration

CLI tool to combine videos and add logo overlays using FFmpeg. Built with Bun + TypeScript.

## Project Overview

This is a fast, minimal CLI for:
- Concatenating multiple videos into one
- Adding logo/image watermarks with configurable position, scale, and margin
- Getting video metadata via ffprobe

## Quick Start

```bash
# Run CLI
bun run src/cli.ts --help

# Combine videos
bun run src/cli.ts combine video1.mp4 video2.mp4 -o output.mp4

# Add logo overlay
bun run src/cli.ts combine v1.mp4 v2.mp4 -l logo.png -p bottom-right -o branded.mp4
```

## Project Structure

```
.
├── src/
│   ├── cli.ts           # CLI entry point, argument parsing, commands
│   ├── ffmpeg.ts        # FFmpeg operations (concat, overlay, info)
│   └── types.ts         # TypeScript interfaces (VideoInfo, CombineOptions, etc.)
├── .pi/
│   ├── extensions/      # Custom TypeScript extensions for pi agent
│   │   ├── safety.ts       # Blocks dangerous bash commands
│   │   ├── git-safety.ts   # Confirms destructive git operations
│   │   ├── git-flow.ts     # Enforces GitFlow workflow
│   │   ├── usage.ts        # Token/cost tracking (/usage)
│   │   └── files.ts        # Enhanced directory listing
│   └── settings.json    # Project-level pi settings
├── AGENTS.md            # This file - AI context and guidelines
├── CLAUDE.md            # Claude-specific context
├── README.md            # User documentation
└── tasks/               # Task tracking
```

## Key Technical Details

### Runtime & Dependencies
- **Bun** >= 1.0.0 (runtime, package manager, shell execution)
- **FFmpeg** (system dependency, must be in PATH)
- No external npm dependencies - uses Bun's built-in APIs

### Bun Patterns Used
- `import { $ } from 'bun'` - Shell command execution with template literals
- `parseArgs` from `node:util` - CLI argument parsing
- `import.meta.dir` - Get current file's directory path

### FFmpeg Approach
- Uses **concat demuxer** for video concatenation (not filter_complex)
- Resolves video paths to absolute for concat list file
- Temp files stored in `temp/` directory (auto-cleaned after processing)
- Quality presets: low (CRF 28), medium (CRF 23), high (CRF 18), lossless (CRF 0)

### Logo Overlay
- Positions: top-left, top-right, bottom-left, bottom-right, center
- Uses FFmpeg overlay filter with position expressions
- Supports scaling via `scale=iw*{factor}:-1`

## Coding Standards

### Code Style
- TypeScript with strict mode
- Keep functions focused and under 30 lines
- Use descriptive names, avoid abbreviations
- Document complex FFmpeg filter logic with comments
- Handle errors with clear user-facing messages (use colored output)

### Error Handling
- Check FFmpeg availability at startup
- Validate input files exist before processing
- Check output file conflicts (unless --overwrite)
- Use colored console output: green for success, red for errors

### Git Workflow
- Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Small, focused commits
- GitFlow workflow enforced via git-flow extension

## Pi Extensions Included

| Extension | Purpose | Trigger |
|-----------|---------|---------|
| safety | Confirms dangerous bash commands (rm -rf, dd, etc.) | Automatic |
| git-safety | Confirms destructive git operations (force push, hard reset) | Automatic |
| git-flow | Enforces GitFlow branching workflow | Automatic + `/feature`, `/hotfix`, `/release`, `/gitflow` |
| usage | Track session tokens/costs | `/usage` |
| files | Enhanced directory listing with icons | Tool: `list_dir` |

## Common Tasks

### Adding a new CLI option
1. Add option to `parseArgs` in `cli.ts`
2. Update `CombineOptions` interface in `types.ts` if needed
3. Implement logic in `ffmpeg.ts`
4. Update help text in `cli.ts`
5. Update README.md

### Adding a new position
1. Add to `Position` type in `types.ts`
2. Add position expression in `ffmpeg.ts` `addLogoOverlay()`
3. Update help text and validation in `cli.ts`

### Adding a new quality preset
1. Add to `QUALITY_PRESETS` in `types.ts`
2. Update validation in `cli.ts`
3. Update README.md

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Pi Documentation](https://github.com/badlogic/pi-mono)
- [Agent Skills Spec](https://agentskills.io)

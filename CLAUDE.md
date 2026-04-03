# video-combiner

CLI tool to combine videos and add logo overlays using FFmpeg.

## Project Overview

A fast, minimal CLI for video concatenation and logo watermarking:
- Concatenate multiple videos into one
- Add logo/image watermarks with configurable position, scale, and margin
- Get video metadata via ffprobe

## Project Structure

```
src/
├── cli.ts       # Main CLI entry point (run with: bun run src/cli.ts)
│                # - Argument parsing with parseArgs
│                # - Command routing (combine, info)
│                # - Input validation and error messages
├── ffmpeg.ts    # FFmpeg operations
│                # - checkFFmpeg(): Verify FFmpeg installation
│                # - getVideoInfo(): Extract metadata via ffprobe
│                # - concatVideos(): Concat using demuxer
│                # - addLogoOverlay(): Apply overlay filter
│                # - combineVideos(): Full pipeline
└── types.ts     # TypeScript type definitions
                 # - VideoInfo, LogoOptions, CombineOptions
                 # - Position, QUALITY_PRESETS
```

## Development

```bash
# Run CLI
bun run src/cli.ts --help

# Run with verbose output
bun run src/cli.ts combine video1.mp4 video2.mp4 -v -o output.mp4

# Build for production
bun run build

# Build for Node.js
bun run build:node
```

## Key Dependencies

- **Bun** >= 1.0.0 - Runtime and shell execution (`$` template tag)
- **FFmpeg** - Video processing (must be installed on system)
- No external npm dependencies

## Bun Patterns Used

- `import { $ } from 'bun'` - Shell command execution
- `parseArgs` from `node:util` - CLI argument parsing
- `import.meta.dir` - Get current file's directory

## FFmpeg Technical Notes

- Uses **concat demuxer** for video concatenation (not filter_complex)
  - Creates temp file with `file 'path'` entries
  - Resolves paths to absolute for concat list
- Logo overlay uses `overlay` filter with position expressions:
  - `W-w-{margin}:H-h-{margin}` for bottom-right
  - Scale applied via `scale=iw*{factor}:-1` before overlay
- Temp files stored in `temp/` directory (cleaned up after processing)

## Quality Presets

| Level | CRF | Preset | Use Case |
|-------|-----|--------|----------|
| `low` | 28 | fast | Quick previews |
| `medium` | 23 | medium | Web videos |
| `high` | 18 | slow | Professional quality |
| `lossless` | 0 | slow | Archival |

## Coding Conventions

- TypeScript strict mode
- Colored console output: `\x1b[32m` (green), `\x1b[31m` (red), `\x1b[36m` (cyan)
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Validate inputs before FFmpeg operations
- Clean up temp files in `finally` blocks

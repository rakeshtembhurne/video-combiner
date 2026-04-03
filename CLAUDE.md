# video-combiner

CLI tool to combine videos and add logo overlays using FFmpeg.

## Project Structure

```
src/
├── cli.ts       # Main CLI entry point (run with: bun run src/cli.ts)
├── ffmpeg.ts    # FFmpeg operations (concat, overlay, info)
└── types.ts     # TypeScript type definitions
```

## Development

```bash
# Run CLI
bun run src/cli.ts --help

# Run with verbose output
bun run src/cli.ts combine video1.mp4 video2.mp4 -v -o output.mp4
```

## Key Dependencies

- **Bun** - Runtime and shell execution (`$` template tag)
- **FFmpeg** - Video processing (must be installed on system)

## Bun Patterns Used

- `import { $ } from 'bun'` - Shell command execution
- `parseArgs` from `node:util` - CLI argument parsing
- `import.meta.dir` - Get current file's directory

## Notes

- Uses concat demuxer for video concatenation (not filter_complex)
- Resolves video paths to absolute for concat list
- Temp files stored in `temp/` directory (cleaned up after processing)

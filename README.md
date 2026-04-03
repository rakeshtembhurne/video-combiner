# video-combiner

A fast CLI tool to combine videos and add logo overlays. Built with Bun + FFmpeg.

## Requirements

- [Bun](https://bun.sh) >= 1.0.0
- [FFmpeg](https://ffmpeg.org) (must be in PATH)

## Installation

### Option 1: Clone and run locally

```bash
git clone https://github.com/rakeshtembhurne/video-combiner.git
cd video-combiner
bun install
```

### Option 2: Install from GitHub

```bash
bun install github:rakeshtembhurne/video-combiner
```

## Usage

### Run directly

```bash
bun run src/cli.ts --help
```

### Combine videos

```bash
bun run src/cli.ts combine video1.mp4 video2.mp4 -o output.mp4
```

### Add a logo watermark

```bash
bun run src/cli.ts combine video1.mp4 video2.mp4 -l logo.png -o branded.mp4
```

### Get video info

```bash
bun run src/cli.ts info video.mp4
```

## Commands

| Command | Description |
|---------|-------------|
| `combine` | Combine multiple videos into one |
| `info` | Show video metadata |

## Combine Options

```
-o, --output <file>     Output file (default: combined.mp4)
-l, --logo <file>       Logo image to overlay
-p, --position <pos>    Logo position (default: bottom-right)
-m, --margin <px>       Logo margin from edges (default: 10)
-s, --scale <percent>   Logo scale percentage (default: 100)
-q, --quality <level>   Quality: low, medium, high, lossless (default: high)
-f, --overwrite         Overwrite existing output file
-v, --verbose           Show detailed progress
```

## Logo Positions

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right` (default)
- `center`

## Quality Presets

| Level | CRF | Preset | Use Case |
|-------|-----|--------|----------|
| `low` | 28 | fast | Quick previews |
| `medium` | 23 | medium | Web videos |
| `high` | 18 | slow | Professional quality |
| `lossless` | 0 | slow | Archival |

## Examples

```bash
# Combine two videos
bun run src/cli.ts combine intro.mp4 outro.mp4 -o final.mp4

# Combine with logo in bottom-right (default)
bun run src/cli.ts combine v1.mp4 v2.mp4 -l logo.png -o branded.mp4

# Centered logo at 50% size
bun run src/cli.ts combine v1.mp4 v2.mp4 -l logo.png -p center -s 50 -o output.mp4

# High quality with verbose output
bun run src/cli.ts combine v1.mp4 v2.mp4 -l logo.png -q lossless -v -o final.mp4

# Combine multiple videos
bun run src/cli.ts combine part1.mp4 part2.mp4 part3.mp4 part4.mp4 -o full.mp4
```

## Development

```bash
# Clone the repo
git clone https://github.com/rakeshtembhurne/video-combiner.git
cd video-combiner

# Install dependencies
bun install

# Run CLI
bun run src/cli.ts --help

# Build for production
bun run build
```

## License

MIT

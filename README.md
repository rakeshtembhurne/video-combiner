# video-combiner

A fast CLI tool to combine videos and add logo overlays. Built with Bun + FFmpeg.

## Installation

```bash
# Install globally with bun
bun install -g video-combiner

# Or use with npx
bunx video-combiner --help
```

## Requirements

- [Bun](https://bun.sh) >= 1.0.0
- [FFmpeg](https://ffmpeg.org) (must be in PATH)

## Usage

```bash
video-combiner <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `combine` | Combine multiple videos into one |
| `info` | Show video metadata |

### Combine Options

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

### Logo Positions

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right` (default)
- `center`

### Quality Presets

| Level | CRF | Preset | Use Case |
|-------|-----|--------|----------|
| `low` | 28 | fast | Quick previews |
| `medium` | 23 | medium | Web videos |
| `high` | 18 | slow | Professional quality |
| `lossless` | 0 | slow | Archival |

## Examples

### Combine two videos

```bash
video-combiner combine intro.mp4 outro.mp4 -o final.mp4
```

### Combine all MP4 files in a directory

```bash
video-combiner combine *.mp4 -o combined.mp4
```

### Add a logo watermark

```bash
video-combiner combine v1.mp4 v2.mp4 -l logo.png -o branded.mp4
```

### Centered logo with custom size

```bash
video-combiner combine *.mp4 -l logo.png -p center -s 50 -o output.mp4
```

### High quality with verbose output

```bash
video-combiner combine v1.mp4 v2.mp4 -l logo.png -q lossless -v -o final.mp4
```

### Get video info

```bash
video-combiner info video.mp4
```

## Development

```bash
# Clone the repo
git clone https://github.com/rakeshtembhurne/video-combiner
cd video-combiner

# Install dependencies
bun install

# Run in dev mode
bun run src/cli.ts --help

# Build for production
bun run build
```

## License

MIT

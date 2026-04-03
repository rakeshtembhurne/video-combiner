#!/usr/bin/env bun
/**
 * video-combiner - Combine videos and add logo overlays
 *
 * Usage:
 *   video-combiner combine <video1> <video2> [video3...] [options]
 *   video-combiner info <video>
 *   video-combiner --help
 */
import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { checkFFmpeg, getVideoInfo, combineVideos } from './ffmpeg';
import type { CombineOptions, Position } from './types';

const VERSION = '1.0.0';

const HELP = `
\x1b[1mvideo-combiner\x1b[0m - Combine videos and add logo overlays

\x1b[1mUSAGE\x1b[0m
  video-combiner combine <video1> <video2> [video3...] [options]
  video-combiner info <video>
  video-combiner --help
  video-combiner --version

\x1b[1mCOMMANDS\x1b[0m
  combine    Combine multiple videos into one
  info       Show video metadata

\x1b[1mCOMBINE OPTIONS\x1b[0m
  -o, --output <file>     Output file (default: combined.mp4)
  -l, --logo <file>       Logo image to overlay
  -p, --position <pos>    Logo position: top-left, top-right, bottom-left,
                          bottom-right, center (default: bottom-right)
  -m, --margin <px>       Logo margin from edges (default: 10)
  -s, --scale <percent>   Logo scale percentage (default: 100)
  -q, --quality <level>   Quality: low, medium, high, lossless (default: high)
  -f, --overwrite         Overwrite existing output file
  -v, --verbose           Show detailed progress

\x1b[1mEXAMPLES\x1b[0m
  # Combine two videos
  video-combiner combine intro.mp4 outro.mp4 -o final.mp4

  # Combine with logo overlay
  video-combiner combine *.mp4 -l logo.png -o branded.mp4

  # High quality with centered logo
  video-combiner combine v1.mp4 v2.mp4 -l logo.png -p center -q lossless

  # Get video info
  video-combiner info video.mp4

\x1b[1mREQUIREMENTS\x1b[0m
  FFmpeg must be installed and available in PATH
`;

function printHelp(): void {
  console.log(HELP);
}

function printVersion(): void {
  console.log(`video-combiner v${VERSION}`);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

async function runInfo(videoPath: string): Promise<void> {
  if (!existsSync(videoPath)) {
    console.error(`\x1b[31mError: File not found: ${videoPath}\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n\x1b[1m📹 ${basename(videoPath)}\x1b[0m\n`);

  try {
    const info = await getVideoInfo(videoPath);

    console.log(`  \x1b[36mResolution:\x1b[0m  ${info.width}x${info.height}`);
    console.log(`  \x1b[36mDuration:\x1b[0m    ${formatDuration(info.duration)} (${info.duration.toFixed(2)}s)`);
    console.log(`  \x1b[36mCodec:\x1b[0m       ${info.codec}`);
    console.log(`  \x1b[36mFPS:\x1b[0m         ${info.fps.toFixed(2)}`);
    if (info.audioCodec) {
      console.log(`  \x1b[36mAudio:\x1b[0m       ${info.audioCodec}`);
    }

    // Get file size
    const stat = await import('node:fs/promises').then(m => m.stat(videoPath));
    console.log(`  \x1b[36mSize:\x1b[0m        ${formatBytes(stat.size)}`);
    console.log();

  } catch (error) {
    console.error(`\x1b[31mError reading video: ${error}\x1b[0m`);
    process.exit(1);
  }
}

async function runCombine(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      output: { type: 'string', short: 'o', default: 'combined.mp4' },
      logo: { type: 'string', short: 'l', default: '' },
      position: { type: 'string', short: 'p', default: 'bottom-right' },
      margin: { type: 'string', short: 'm', default: '10' },
      scale: { type: 'string', short: 's', default: '100' },
      quality: { type: 'string', short: 'q', default: 'high' },
      overwrite: { type: 'boolean', short: 'f', default: false },
      verbose: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const videos = positionals;

  if (videos.length < 2) {
    console.error(`\x1b[31mError: At least 2 videos required\x1b[0m`);
    console.log(`\n  Usage: video-combiner combine <video1> <video2> [options]`);
    process.exit(1);
  }

  // Validate videos exist
  for (const video of videos) {
    if (!existsSync(video)) {
      console.error(`\x1b[31mError: File not found: ${video}\x1b[0m`);
      process.exit(1);
    }
  }

  // Validate logo if provided
  if (values.logo && !existsSync(values.logo)) {
    console.error(`\x1b[31mError: Logo file not found: ${values.logo}\x1b[0m`);
    process.exit(1);
  }

  // Validate position
  const validPositions: Position[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
  if (!validPositions.includes(values.position as Position)) {
    console.error(`\x1b[31mError: Invalid position "${values.position}"\x1b[0m`);
    console.log(`  Valid positions: ${validPositions.join(', ')}`);
    process.exit(1);
  }

  // Validate quality
  const validQualities = ['low', 'medium', 'high', 'lossless'];
  if (!validQualities.includes(values.quality)) {
    console.error(`\x1b[31mError: Invalid quality "${values.quality}"\x1b[0m`);
    console.log(`  Valid qualities: ${validQualities.join(', ')}`);
    process.exit(1);
  }

  const options: CombineOptions = {
    videos,
    output: values.output,
    logo: values.logo ? {
      path: values.logo,
      position: values.position as Position,
      margin: parseInt(values.margin),
      scale: parseInt(values.scale),
    } : undefined,
    quality: values.quality as 'low' | 'medium' | 'high' | 'lossless',
    overwrite: values.overwrite,
    verbose: values.verbose,
  };

  if (values.verbose) {
    console.log(`\n\x1b[1m🎬 Video Combiner\x1b[0m`);
    console.log(`\n  Videos: ${videos.length}`);
    videos.forEach((v, i) => console.log(`    ${i + 1}. ${v}`));
    console.log(`\n  Output: ${values.output}`);
    if (values.logo) {
      console.log(`  Logo: ${values.logo}`);
      console.log(`  Position: ${values.position}`);
      console.log(`  Margin: ${values.margin}px`);
      console.log(`  Scale: ${values.scale}%`);
    }
    console.log(`  Quality: ${values.quality}`);
    console.log();
  }

  try {
    await combineVideos(options);
    console.log(`\x1b[32m✅ Success!\x1b[0m Created: ${values.output}\n`);
  } catch (error) {
    console.error(`\x1b[31mError: ${error}\x1b[0m`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  // Check FFmpeg
  if (!(await checkFFmpeg())) {
    console.error(`\x1b[31mError: FFmpeg not found\x1b[0m`);
    console.log(`\n  Please install FFmpeg:`);
    console.log(`    macOS:   brew install ffmpeg`);
    console.log(`    Ubuntu:  sudo apt install ffmpeg`);
    console.log(`    Windows: winget install ffmpeg`);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Handle --help and --version
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-V')) {
    printVersion();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'combine':
      await runCombine(commandArgs);
      break;
    case 'info':
      if (commandArgs.length === 0) {
        console.error(`\x1b[31mError: No video specified\x1b[0m`);
        console.log(`\n  Usage: video-combiner info <video>`);
        process.exit(1);
      }
      await runInfo(commandArgs[0]);
      break;
    default:
      console.error(`\x1b[31mError: Unknown command "${command}"\x1b[0m`);
      console.log(`\n  Run "video-combiner --help" for usage`);
      process.exit(1);
  }
}

main();

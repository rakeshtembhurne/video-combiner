/**
 * FFmpeg utilities for video processing
 */
import { $ } from 'bun';
import { existsSync, unlinkSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { VideoInfo, CombineOptions, FFmpegProgress, QUALITY_PRESETS, Position, POSITION_COORDS } from './types';

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpeg(): Promise<boolean> {
  try {
    await $`ffmpeg -version`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get video metadata using ffprobe
 */
export async function getVideoInfo(path: string): Promise<VideoInfo> {
  const result = await $`ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,duration -of csv=p=0 ${path}`.quiet();

  const output = result.text().trim();
  const [codec, width, height, fpsStr, durationStr] = output.split(',');

  // Parse fps (can be "24/1" or "24000/1001")
  const [num, den] = fpsStr.split('/').map(Number);
  const fps = den ? num / den : num;

  // Get audio codec
  let audioCodec: string | undefined;
  try {
    const audioResult = await $`ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 ${path}`.quiet();
    audioCodec = audioResult.text().trim() || undefined;
  } catch {
    // No audio
  }

  return {
    path,
    duration: parseFloat(durationStr) || 0,
    width: parseInt(width),
    height: parseInt(height),
    codec,
    fps,
    audioCodec,
  };
}

/**
 * Concatenate videos using concat demuxer
 */
export async function concatVideos(
  videos: string[],
  outputPath: string,
  verbose: boolean = false
): Promise<void> {
  const tempDir = join(import.meta.dir, '..', 'temp');
  const concatFile = join(tempDir, 'concat_list.txt');

  // Create temp directory
  if (!existsSync(tempDir)) {
    await $`mkdir -p ${tempDir}`.quiet();
  }

  // Resolve to absolute paths for concat list
  const absoluteVideos = videos.map(v => {
    if (v.startsWith('/')) return v;
    return join(process.cwd(), v);
  });

  // Create concat list
  const concatList = absoluteVideos.map(v => `file '${v}'`).join('\n');
  writeFileSync(concatFile, concatList);

  if (verbose) {
    console.log(`📝 Concat list:\n${concatList}\n`);
  }

  try {
    if (verbose) {
      await $`ffmpeg -y -f concat -safe 0 -i ${concatFile} -c copy ${outputPath}`;
    } else {
      await $`ffmpeg -y -f concat -safe 0 -i ${concatFile} -c copy ${outputPath}`.quiet();
    }
  } finally {
    // Cleanup
    if (existsSync(concatFile)) unlinkSync(concatFile);
  }
}

/**
 * Add logo overlay to video
 */
export async function addLogoOverlay(
  input: string,
  logoPath: string,
  outputPath: string,
  options: {
    position: Position;
    margin: number;
    scale: number;
    quality: { crf: number; preset: string };
    verbose: boolean;
  }
): Promise<void> {
  const { position, margin, scale, quality, verbose } = options;

  // Build overlay position expression
  const positionExpr: Record<Position, string> = {
    'top-left': `${margin}:${margin}`,
    'top-right': `W-w-${margin}:${margin}`,
    'bottom-left': `${margin}:H-h-${margin}`,
    'bottom-right': `W-w-${margin}:H-h-${margin}`,
    'center': `(W-w)/2:(H-h)/2`,
  };

  // Build filter_complex
  // scale is percentage: 100 means no scaling, 50 means half size
  let filterComplex: string;
  if (scale === 100) {
    // No scaling needed, just overlay
    filterComplex = `[0:v][1:v]overlay=${positionExpr[position]}[out]`;
  } else {
    // Scale logo by percentage, then overlay
    const scaleFactor = scale / 100;
    filterComplex = `[1:v]scale=iw*${scaleFactor}:-1[logo];[0:v][logo]overlay=${positionExpr[position]}[out]`;
  }

  const crfStr = quality.crf.toString();

  if (verbose) {
    console.log(`🎬 Adding logo overlay...`);
    console.log(`   Position: ${position}`);
    console.log(`   Scale: ${scale}%`);
    console.log(`   Quality: CRF ${quality.crf}, preset ${quality.preset}`);
    console.log(`   Filter: ${filterComplex}`);
  }

  if (verbose) {
    await $`ffmpeg -y -i ${input} -i ${logoPath} -filter_complex ${filterComplex} -map [out] -map 0:a -c:v libx264 -crf ${crfStr} -preset ${quality.preset} -c:a aac -b:a 192k ${outputPath}`;
  } else {
    await $`ffmpeg -y -i ${input} -i ${logoPath} -filter_complex ${filterComplex} -map [out] -map 0:a -c:v libx264 -crf ${crfStr} -preset ${quality.preset} -c:a aac -b:a 192k ${outputPath}`.quiet();
  }
}

/**
 * Combine videos with optional logo overlay
 */
export async function combineVideos(options: CombineOptions): Promise<string> {
  const { videos, output, logo, quality, overwrite, verbose } = options;

  // Check output exists
  if (!overwrite && existsSync(output)) {
    throw new Error(`Output file exists: ${output}. Use --overwrite to replace.`);
  }

  const tempDir = join(import.meta.dir, '..', 'temp');
  const tempCombined = join(tempDir, 'temp_combined.mp4');

  // Create temp directory
  if (!existsSync(tempDir)) {
    await $`mkdir -p ${tempDir}`.quiet();
  }

  try {
    // Step 1: Concatenate videos
    if (verbose) console.log(`\n📹 Concatenating ${videos.length} videos...`);
    await concatVideos(videos, tempCombined, verbose);

    // Step 2: Add logo if provided
    if (logo) {
      const qualityPresets = {
        low: { crf: 28, preset: 'fast' },
        medium: { crf: 23, preset: 'medium' },
        high: { crf: 18, preset: 'slow' },
        lossless: { crf: 0, preset: 'slow' },
      };

      await addLogoOverlay(tempCombined, logo.path, output, {
        position: logo.position,
        margin: logo.margin,
        scale: logo.scale,
        quality: qualityPresets[quality],
        verbose,
      });
    } else {
      // Just move temp to output
      await $`mv ${tempCombined} ${output}`;
    }

    if (verbose) console.log(`\n✅ Created: ${output}`);
    return output;

  } finally {
    // Cleanup temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

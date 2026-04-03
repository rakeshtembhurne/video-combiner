/**
 * Type definitions for video-combiner
 */

export interface VideoInfo {
  path: string;
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  audioCodec?: string;
}

export interface LogoOptions {
  path: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  margin: number;
  scale: number;
}

export interface CombineOptions {
  videos: string[];
  output: string;
  logo?: LogoOptions;
  quality: 'low' | 'medium' | 'high' | 'lossless';
  overwrite: boolean;
  verbose: boolean;
}

export interface FFmpegProgress {
  frame: number;
  fps: number;
  time: string;
  bitrate: string;
  speed: string;
  percent: number;
}

export type Position = LogoOptions['position'];

export const QUALITY_PRESETS = {
  low: { crf: 28, preset: 'fast' },
  medium: { crf: 23, preset: 'medium' },
  high: { crf: 18, preset: 'slow' },
  lossless: { crf: 0, preset: 'slow' },
} as const;

export const POSITION_COORDS: Record<Position, (W: number, H: number, w: number, h: number, margin: number) => string> = {
  'top-left': (_, __, ___, h, margin) => `${margin}:${margin}`,
  'top-right': (W, _, w, __, margin) => `W-w-${margin}:${margin}`,
  'bottom-left': (_, H, ___, h, margin) => `${margin}:H-h-${margin}`,
  'bottom-right': (W, H, w, h, margin) => `W-w-${margin}:H-h-${margin}`,
  'center': (W, H, w, h, margin) => `(W-w)/2:(H-h)/2`,
};

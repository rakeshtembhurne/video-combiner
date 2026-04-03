# Tasks

Track development progress for video-combiner.

## Active

<!-- Add current tasks here -->

## Backlog

- [ ] **Feature**: Add audio-only extraction command
  - Priority: low
  - Notes: `video-combiner extract-audio video.mp4 -o audio.mp3`

- [ ] **Feature**: Add video trimming/cutting
  - Priority: medium
  - Notes: `video-combiner trim video.mp4 --start 10 --end 30 -o trimmed.mp4`

- [ ] **Feature**: Add batch processing mode
  - Priority: low
  - Notes: Process all videos in a directory with same settings

- [ ] **Feature**: Add progress bar for long operations
  - Priority: medium
  - Notes: Parse FFmpeg's stderr output for progress info

- [ ] **Feature**: Add video resizing/scaling
  - Priority: low
  - Notes: `video-combiner scale video.mp4 --width 1920 -o scaled.mp4`

## Completed

- [x] **Core**: Basic video concatenation
  - Uses concat demuxer for reliable joining

- [x] **Core**: Logo overlay with positioning
  - 5 positions: top-left, top-right, bottom-left, bottom-right, center
  - Configurable margin and scale

- [x] **Core**: Quality presets
  - low, medium, high, lossless with appropriate CRF values

- [x] **Core**: Video info command
  - Shows resolution, duration, codec, fps, file size

- [x] **CLI**: Colored output and verbose mode
  - Green for success, red for errors, cyan for labels

- [x] **CLI**: Input validation
  - Check files exist, validate positions and quality values

## Template

- [ ] **Task**: Description
  - Priority: high/medium/low
  - Notes: Additional context

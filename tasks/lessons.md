# Lessons Learned

Document patterns and corrections to prevent recurring mistakes in video-combiner development.

## Template

### Date: YYYY-MM-DD
### Context: Brief description
### Issue: What went wrong
### Solution: How to fix/prevent

---

## FFmpeg Lessons

### Date: 2024-01-XX
### Context: Video concatenation approach
### Issue: Using filter_complex for concatenation is complex and error-prone
### Solution: Use concat demuxer instead - simpler and more reliable
- Create temp file with `file 'absolute_path'` entries
- Use `ffmpeg -f concat -safe 0 -i concat_list.txt -c copy output.mp4`

### Date: 2024-01-XX
### Context: Logo overlay positioning
### Issue: Hardcoding pixel positions doesn't work for different video sizes
### Solution: Use FFmpeg's expression system for dynamic positioning
- `W-w-{margin}:H-h-{margin}` for bottom-right (adapts to video dimensions)
- `W` = video width, `w` = logo width

### Date: 2024-01-XX
### Context: Temp file cleanup
### Issue: Temp files left behind if process crashes
### Solution: Use try/finally blocks to ensure cleanup
```typescript
try {
  // FFmpeg operations
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
```

## Bun Lessons

### Date: 2024-01-XX
### Context: Shell command execution
### Issue: Need to capture output and handle errors
### Solution: Use Bun's `$` template tag
- `.quiet()` to suppress stdout
- `.text()` to get output as string
- Wrap in try/catch for error handling

---

## Lessons

<!-- Add new lessons here -->

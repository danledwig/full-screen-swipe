# Full-Screen Swipe Card Game

## Quick Reference
- **Port**: 5180 (Vite)
- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Open**: `http://localhost:5180/`

## Architecture
Zero-dependency vanilla TypeScript. Full-screen narrative swipe game with CSS transitions.

### Files
```
src/main.ts     — State machine, frame loop, drag-to-visual mapping, commit sequence
src/input.ts    — Pointer events, horizontal-only, clamped drag
src/scenes.ts   — Scene data array, image preloading
src/style.css   — Full-bleed layout, overlays, narrative pill
index.html      — DOM structure
images/         — Compressed JPEGs (from art test PNGs)
```

### State Machine
`IDLE(0) → DRAGGING(1) → COMMITTING(2) → TRANSITIONING(3) → IDLE(0)`
Also: `DRAGGING → IDLE` on snap-back (below commit threshold).

### Key Patterns
- Drag updates: direct style manipulation in rAF (no CSS transitions during drag)
- Animated sequences (snap-back, commit, scene enter): CSS transitions with setTimeout cleanup
- Snap-back easing: cubic-bezier(0.34, 1.56, 0.64, 1) for overshoot bounce
- Scene enter: brightness 0.6→1.0, scale 1.08→1.0 over 650ms
- Commit threshold: 40% of max drag (max drag = 28% viewport width)
- Punctuation signal: "?" while exploring, "." once committed
- No blur on images — brightness + overlay for darkening only

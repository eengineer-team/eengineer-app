# FIX PROMPT — v1 teardown, measured
Paste into the same thread. This is not a review request. These are measured defects in
the file you delivered, with the numbers attached. Fix them and re-deliver.

---

I measured your output frame by frame. It fails the contract in six places and the
composition fails everywhere. Do not defend the file, do not re-explain the concept, do
not deliver a "v2 with improvements." Fix these specific defects and return the corrected
motion sheet.

## FIRST — confirm the export, do not assume it

The copy I measured is 720 × 1280 / 30 fps / 22.20 s / 666 frames with no audio track.
The resolution and frame rate came from how the file was downloaded, so they are not
findings against you. Three things about it are still unexplained, and I need you to
state the actual numbers your file produces rather than argue about them:

- **Duration.** A downscale does not shorten a film. My copy is 22.20 s. Report the exact
  duration your timeline produces. If it is not 24.000 s, the scene lengths do not sum to
  1440 — print the sum.
- **Audio.** State plainly whether you rendered the nine UI cues at all. "It was stripped
  in export" and "I never made it" are different answers and I need the real one.
- **How it was captured.** There is a stray white dot in the lower-right at f564 that
  looks like an operating-system mouse cursor, and the frame count is not a clean multiple
  of anything. If this was screen-recorded rather than captured via
  `PROMO.seek(f)` → screenshot, then the whole determinism contract bought nothing and the
  timing in the file is not the timing on screen. Say which method produced it.

**Everything below is scale-invariant.** These are ratios and proportions, unaffected by
downscaling, and a 9:16 → 9:16 resize crops nothing. They are defects in your file.

## P0 · Content is clipped off the left edge for 400+ frames

Measured ink coverage in the outer 12 pixel columns:

```
f150   left 13.1%   right 3.0%
f260   left 10.6%   right 2.6%
f420   left 10.0%   right 2.5%
f500   left  8.3%   right 1.8%
```

Symmetric layouts do not produce asymmetric edge coverage. The stage is over-scaled or
off-centre, and half-words are running off the left of the frame — visible as `mpt Lab`,
`OMPT LAB`, `aff-le`, `I Chatbot`. A viewer reads that as a broken render, not as a
camera move.

**Fix:** stage is exactly 1080 wide with `transform-origin: 50% 50%`. `camScale` starts at
`1.0` and only ever pushes *in* on a deliberate move, never above `1.06`. Then add a
hard assertion to the diagnostic pass: for every frame, compute each layer's bounding box
and log any that extends beyond `[0, 1080] × [0, 1920]`. Return that log. It must be empty.

## P0 · The frame is empty — this is the "soulless" problem, and it is measurable

Ink coverage (share of pixels differing from the background):

```
f30    0.2%      f120   0.3%      f420   8.2%      f636   3.1%
```

The first four seconds are a 99.8% empty field with one small grey line in it. The endcard
is 97% empty. That is not minimalism, it is an unfinished frame.

Worse, in the hero sequence the content is stacked into one horizontal band:

```
f400 · content by band
  top 25%      0.6%
  second 25%  15.4%
  third 25%   11.9%
  bottom 25%   1.6%
```

**Half of a 9:16 frame carries nothing for ten consecutive seconds.** The dialog floats in
a black void. Nothing else on screen changes. That combination — small subject, locked
camera, dead surround — is exactly what makes a shot read as a still image with a few
pixels wiggling in it.

**Fix, with numbers:**
- The prompt dialog occupies **82% of stage width** (886 px of 1080) and is centred on the
  optical centre `y = 900`, not floated in the upper third.
- The Prompt Lab page **stays visible behind it** at 55% opacity with a 10 px backdrop
  blur — a legible, out-of-focus background plane, not black. Right now the backdrop is
  effectively opaque black and the shot has no depth and no context.
- The top band carries the page header (eyebrow + `Prompt Lab` + Sparkles) and the bottom
  band carries the `fig. 4` caption and the `⌘ + ↵` hint. Every quarter of the frame must
  hold something at all times.
- In the hook, the token sits on the **upper-third line at 54 px** (not 34 px, and not at
  dead centre), the graph paper carries a visible dimension line and the `fig. 1` caption,
  and the grid ink ramps from 0.06 to 0.10 across the scene.

## P0 · An entire scene is missing

Scene S2 — the sidebar, the cascade of nav items, and the arrival of the **Prompt Lab
entry with its gold bloom** — is not in the file. The film cuts from the logo straight to
the hub. That scene was the only moment that says *this is new*, which is the entire
reason the film exists. Restore it at its specified length: 156 frames, f216–f371.

## P0 · One second of near-black dead air

`f114–f140` is an almost entirely black frame with a small wordmark in the top-left corner
and nothing else, for roughly 30 frames. A hold is stillness with something to look at. An
empty frame is a mistake. Either fill it or cut it.

## P1 · Rhythm

Measured `stdev(E)/mean(E) = 4.34` on a 30 fps copy. Frame decimation inflates this,
so treat the exact figure as indicative rather than exact — but the shape is unambiguous.
Target is 0.55–1.4. The energy curve is long flat
stretches punctuated by enormous cuts — a slideshow, not a film. **Do not fix this by
adding more cuts or more camera moves.** Fix it inside the scenes: container-to-content
lag of 3–6 frames, settle on arrival, staggered reflow after each token fills, the counter
pop. Motion should live at the layer level so the frame is never fully frozen and never
fully churning.

## P1 · Render artifacts

- `f240`: a hard black rectangle in the upper-middle of the frame — a stale or unmasked layer.
- `f564`: a stray white dot in the lower-right corner.

Find what draws them and remove it. These read as encoding bugs and immediately break the
illusion that this is a real product screen.

## P1 · Strings that are not production strings

The copy control reads `Copy with My Values`. That string does not exist in the product.
List every piece of text in the file and replace anything that is not a real string from
the brief.

---

## BEFORE YOU RETURN THE FILE

Run your own measurement pass and print, as a plain table, the actual values:

1. `width × height`, `fps`, `totalFrames`, sum of scene lengths, exact duration in seconds
2. Layer-bounds violations (must be zero)
3. Ink coverage at f30, f120, f420, f636 — **no frame below 4%**
4. Content-by-band at f400 — **no band below 4%**
5. `stdev(E)/mean(E)` — must land in 0.55–1.4
6. Hold runs: count and total frames — ≥ 5 runs, ≥ 150 frames
7. Audio: cue count and file names, or an explicit statement that audio was not rendered

If a number is out of range, fix it before returning — do not return the file with a
failing number and a note explaining why it is acceptable.

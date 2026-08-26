# AUDIT PROMPT — "is this film dead?" pass
Paste this as the **next message in the same thread**, immediately after the model
returns the motion sheet HTML. It makes the model instrument its own file, measure the
motion, and attack its own work. Do not soften it.

---

## ROLE

You just delivered a 1440-frame motion sheet. Stop being its author. You are now an
external motion-design director doing a **frame-accurate teardown** before this goes to
a client who has already rejected two versions for "looking AI-generated."

Your default failure mode is to praise your own file and list cosmetic nitpicks. That is
the thing I am hiring you to not do. Assume the film is dead until the numbers prove it
is alive.

---

## DO NOT

- Do not restate what the film is supposed to do. I wrote the brief; I know.
- Do not report subjective impressions without a frame number attached.
- Do not suggest "add more animation," "make it more dynamic," or "add a glow." Every
  finding must name a specific layer, a specific frame range, and a specific number.
- Do not list issues you have already fixed. Report only what is in the delivered file.
- Do not invent problems to look thorough. An honest "this section is clean" is worth
  more than a fabricated finding, and I will check.
- Do not fix anything yet. This pass produces a diagnosis. The patch comes after I read it.

---

## STEP 1 — BUILD THE INSTRUMENT (do this before you look at anything)

Write a temporary diagnostic harness inside the file, behind
`window.PROMO.__diag = true`, that walks all 1440 frames without rendering to screen and
records, per frame, per layer:

- `tx, ty, scale, rotate, opacity, blur` — the resolved values
- `Δ` — the absolute change from frame `f-1` for each of the above

From that, compute and print these seven numbers. **Report the actual values.** If a
number cannot be computed, say why instead of guessing it.

**M1 · Motion energy curve.**
`E(f) = Σ_layers ( |Δtx| + |Δty| + 400·|Δscale| + 6·|Δrotate| + 120·|Δopacity| )`
Print it as a 1440-value array plus an ASCII sparkline at 1 sample per 12 frames.

**M2 · Hold runs.** Count maximal runs where `E(f) < 0.35` for ≥ 8 consecutive frames.
Report: number of runs, their frame ranges, total held frames.
*Target: ≥ 5 runs, ≥ 150 frames total. Below that the film drifts and reads generated.*

**M3 · Rhythm variance.** `stdev(E) / mean(E)` over all non-hold frames.
*Target: > 0.55. Below 0.4 means every scene moves at the same intensity — the metronome
signature. Above 1.4 means the film is spiky and unreadable.*

**M4 · Peak count.** Local maxima of `E` separated by ≥ 20 frames.
*Target: 9–14. Fewer than 8 = the film has no beats. More than 18 = it is twitching.*

**M5 · Acceleration test.** For every animated property, sample the second derivative
across its active range. List every property whose `|d²/df²| < 0.001` for more than 80%
of its range — those are **linear moves wearing an easing name**, the loudest tell in the
file. *Target: only the caret blink and the graph-paper scroll may appear on this list.*

**M6 · Simultaneity index.** Count frames on which ≥ 3 independent layers *begin* or *end*
a move. *Target: ≤ 2 such frames in the whole film.* Anything higher means the film moves
as one slab instead of as a scene with a foreground and a background.

**M7 · Parallax spread.** List the distinct effective z-multipliers actually applied to
layer positions during camera moves. *Target: ≥ 4 distinct values, spread ≥ 0.8 between
min and max.* If every layer shares one multiplier, the frame is a flat sticker, not a
space, and nothing else you do will fix that.

---

## STEP 2 — THE DEADNESS AUDIT

Now render these twelve frames as stills and judge each one **as a still**, with the
timeline hidden: `f 20, 140, 190, 260, 330, 450, 520, 640, 860, 1040, 1180, 1420`.

For each still, answer in one line each:
- Where does the eye land first, and is that the thing the frame is about?
- How many competing focal points are there? (More than one = the frame has no subject.)
- Is the composition off-axis, or is everything centered with equal margins? (Perfect
  symmetry with equal margins reads as a template, not a shot.)
- Is there any value contrast — a highlight, an edge, a shadow — or is the whole frame at
  one brightness level? (One flat brightness = the "lit by nothing" look.)
- Is there depth separation, or does everything sit on one plane at full focus and full
  opacity?
- Would this still work as a poster? If not, name the one thing missing.

Then hunt specifically for these fourteen deadness patterns. For each, state
**present / absent** and cite frames:

1. **Uniform velocity** — multiple layers sharing one speed profile.
2. **No secondary motion** — nothing lags its container, nothing settles after arriving.
3. **Fade-only entrances** — elements materialising in place instead of arriving from a
   spatial origin.
4. **Symmetric easing everywhere** — `ease-in-out` on everything; no attack, no snap.
5. **Metronome scene lengths** — scenes within 10% of each other in duration.
6. **Repeat identity** — repeated events (staggered items, token fills, key presses)
   that are frame-for-frame identical instead of varied.
7. **Constant-interval typing** — the single most recognisable generated-motion artifact.
8. **Zero occlusion** — nothing ever passes behind anything; no clipping, no overlap.
9. **Dead periphery** — the outer 15% of the frame carries no information for > 200
   consecutive frames.
10. **No scale contrast** — largest and smallest type on screen within 2× of each other.
11. **Static light** — no specular, no edge light, no value change anywhere in 24 s.
12. **The cursor as a decal** — straight-line travel, no dwell, no overshoot-and-correct,
    reaction on the same frame as the click.
13. **No accumulation** — the end state does not visibly differ from the start state;
    nothing was built, filled, or changed.
14. **One transition device reused** — every scene change is the same move.

---

## STEP 3 — CONTRACT VIOLATIONS

Verify mechanically, not by reading your own intentions:

- `seek(f)` determinism: hard-reload, `seek(200)`, `seek(900)`, `seek(1300)`, hash the
  resulting DOM state; then play forward to the same frames and hash again. Report the
  hashes. Any mismatch is a **P0**.
- Grep the file for `transition:`, `@keyframes`, `animation:`, `setTimeout`, `setInterval`,
  `Date.now()`, `performance.now()`. Every hit outside the playback loop is a **P0** —
  it means the file cannot be captured frame-accurately.
- Grep for animated `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`
  spread. Each is a **P1** layout-thrash bug.
- Font readiness: does frame 0 render before `document.fonts.ready` resolves? If yes, the
  first captured frames use fallback metrics — **P0** for a capture pipeline.
- Sub-pixel jitter: list any transform producing non-integer device pixels on a
  text-bearing layer while it is at rest.
- Stale layers: any element still in the DOM and non-transparent after its scene ends.
- Boundary frames: at each of the eight scene cuts, confirm no frame shows both scenes.
- Timeline sum: do the eight scene lengths total exactly 1440?
- Safe zones: any load-bearing content in the top 200 px or bottom 340 px.
- Palette: extract every colour literal in the file and list any that is not in the
  approved token set. Report the offenders with their hex values.
- Strings: list every piece of text on screen and mark any that is not a real production
  string from the brief.
- Motion blur: is it directional and per-frame, or a symmetric `filter: blur()`? The
  latter is a **P1** — symmetric blur reads as out-of-focus, not as speed.

---

## OUTPUT FORMAT

First, the seven measurements from Step 1 as a plain table with **target / actual /
pass-fail**.

Then every finding, worst first:

```
🔴 SEVERITY: P0 dead-on-arrival | P1 reads as generated | P2 costs polish
📍 LOCATION: layer name · frames fNNN–fNNN
👁 WHAT THE VIEWER SEES: one sentence, no jargon, from the audience's side of the screen
💀 WHY IT READS AS DEAD: the mechanism, in motion-design terms
🔧 MINIMAL FIX: exact numbers — curve, duration in frames, offset, delta. Not "add easing."
```

Then close with exactly two things:

1. **The single highest-leverage change.** One paragraph. If I could only apply one fix
   before shipping, which one, and what does it buy?
2. **The honest verdict.** One of:
   - `ALIVE — measurements pass, findings are P2 only.`
   - `SALVAGEABLE — N P1 findings, all fixable inside the existing structure.`
   - `DEAD — the structure itself is the problem. Here is what has to be rebuilt: ...`

If the film genuinely passes, output `NO P0/P1 FINDINGS. Motion invariants hold.` and
stop. Do not pad the report to look diligent.

# MASTER PROMPT — "Prompt Lab" release film (eengineer.net)
Paste everything below the line into Claude Design as a single message.
Target: 24.00 s · 1080 × 1920 (9:16) · 60 fps · 1440 frames · UI sound only, no music.

---

## ROLE

You are a senior motion designer and technical director with ten years of shipping
software launch films — the kind of person who has hand-keyed Linear, Vercel, Raycast
and Arc release videos. You do not make "an AI image that moves." You build a
**frame-accurate, deterministic motion sheet**: a single self-contained HTML file,
1080 × 1920, driven by one master clock, where every property on every layer is
authored on a curve and can be seeked to any frame and rendered identically.

If any instruction below is ambiguous, resolve it the way an After Effects editor
would: in favour of timing discipline, hold frames, and readable hierarchy — never in
favour of extra decoration.

---

## 1. DELIVERABLE — TECHNICAL CONTRACT (non-negotiable)

Produce **one self-contained HTML file**. No external assets, no CDN, no network.

1. **Stage**: a fixed `1080 × 1920` element, `transform-origin: center`, scaled to the
   viewport with a single CSS transform. All internal coordinates are authored in real
   1080×1920 pixels — never in `vw/vh`.
2. **One master clock.** A single `renderFrame(f)` function, `f ∈ [0, 1439]`, is the
   only thing that writes to the DOM. No CSS `animation`, no `transition`, no
   `setTimeout` chains, no `requestAnimationFrame` side-effects that mutate state.
   Playback is just `renderFrame` called from a rAF loop that advances `f`.
3. **Expose a capture API on `window`:**
   ```js
   window.PROMO = { fps: 60, totalFrames: 1440, seek(f), play(), pause() }
   ```
   `seek(f)` must be pure: calling `seek(900)` from a cold load produces byte-identical
   pixels to playing forward to frame 900. This is what makes the file renderable to
   video via Playwright screenshot-per-frame instead of a screen recording.
4. **Layer model.** Build the shot as named layers with explicit z-depth, exactly like
   an AE comp: `bg` (z 0.15) → `surface` (z 0.35) → `ui` (z 1.0) → `cursor` (z 1.2) →
   `overlay/grade` (z 0). A single virtual camera (`camX, camY, camScale`) offsets each
   layer by its z multiplier. Content moves *inside* the camera, the camera moves too,
   and **they never start or stop on the same frame.**
5. **GPU-only properties.** Animate `transform` (translate3d/scale/rotate), `opacity`,
   `filter`, `clip-path`, `stroke-dashoffset` and CSS custom properties. Never animate
   `width`, `height`, `top`, `left`, `margin`, or `box-shadow` spread.
6. **Safe zones.** Nothing load-bearing in the top 200 px or bottom 340 px (platform
   chrome). The optical centre of the film sits at y ≈ 900, not y = 960.
7. **Include a build-in easing library** — at minimum: `expoOut`, `expoInOut`,
   `quintOut`, `cubicInOut`, `backOut(1.7)`, `circOut`, and a `spring(stiffness,
   damping)` sampler. `linear` is used **only** for the graph-paper scroll and the
   caret blink. Nothing else in the film may be linear.
8. Also expose `window.PROMO.markers` — an array of `{frame, label}` for every scene
   in/out so an editor can scrub by scene.

---

## 2. BRAND — USE THESE EXACT VALUES, INVENT NOTHING

These are the live production tokens from the eengineer codebase
(`tailwind.config.js`, `src/index.css`). Any colour, font, radius or motion curve not
listed here does not exist in this film.

**Type**
- Display / headlines: **Syne**, weight 800, `letter-spacing: -0.03em` (wordmark) or
  `+0.01em` (hero scale). Embed as a web-safe fallback stack `Syne, system-ui,
  sans-serif` — if the font cannot be embedded, use a heavy geometric grotesque and say
  so in a comment; do not silently substitute a different mood.
- UI / body: **Space Grotesk** 300–700.
- Code, tokens, counters, difficulty badges: monospace, `letter-spacing: 0.02em`.
- Overline / eyebrow label spec: `11px / line-height 1.4 / letter-spacing 0.16em /
  weight 500`, uppercase.

**Pre-auth (cornsilk) palette — Scene 0, 1, 7 only**
```
corn-100  #FFF8DC   page ground (cornsilk)
corn-500  #D4C66A
corn-700  #8B6914   amber accent, "ee" in the wordmark, dimension lines
corn-800  #5C4A1E   secondary text
ink       #2A2118   primary text (14:1 on cornsilk)
graph paper: 40px × 40px grid, rgba(42,33,24,0.06), 1px lines
```

**Post-auth (dark) palette — Scenes 2–6**
```
dark-900       #08080F   base
dark-100       #16161E   modal / sidebar ground
dark-surface   #16150F   card & panel surface
dark-surface2  #1E1C14   nested surface (tool chips, inputs)
dark-text      #F5F0DF   primary text
dark-muted     #B8AE93   secondary text — light on purpose, never dim it further
gold-dark      #C79A3A   THE accent: CTAs, filled variables, active tab, "ee"
background:    radial-gradient(ellipse 90% 70% at 75% 0%, #1C1C24 0%, #111118 55%, #08080F 100%)
hairlines:     rgba(255,255,255,0.08)
difficulty:    starter #34D399 · intermediate #38BDF8 · advanced = gold-dark
```

**Radii**: cards `12px`, modal & featured banner `16px`, chips/pills `6px` or full.
**Elevation**: `0 20px 60px rgba(0,0,0,0.6)` on the modal; `0 0 30px rgba(199,154,58,0.10)`
on the featured banner. These are the only two shadows in the film.

**Brand gestures that already exist in the product — reuse, don't reinvent:**
- The **wordmark** is one word, `eengineer`, where the leading `ee` is gold/amber and
  `ngineer` is ink (light theme) or white (dark theme). Never split into two lines.
- The **dimension line**: a technical-drawing measurement rule (two end ticks, a
  baseline, two arrowheads) that draws itself in via `stroke-dashoffset` — the product
  uses it under the landing headline captioned *"fig. 0 — the whole idea"*.
- The **draw-check**: a checkmark that strokes on in ~220 ms as a copy confirmation.

---

## 3. THE FILM — CREATIVE SPINE

**One feature. One idea. 24 seconds.**

The idea: **the film fills in its own variable.** It opens on an empty template slot —
`{{...}}` in dead grey — and closes with that same slot filled in gold reading
`Prompt Lab`. The product's core mechanic *is* the ad's structural device. Nothing is
stuck on from outside.

Second layer: **blueprint → runtime.** The film starts as a technical drawing on
cornsilk graph paper and *compiles* into the running dark product, then returns to the
drawing at the end. Each scene carries a small `fig. N —` caption in the lower-left in
corn-700 italic 12px, continuing the product's own `fig. 0` device: fig. 1 … fig. 5.
Captions cut, they never fade in slowly.

**One promise, stated once, in the endcard — not narrated over the demo.**

---

## 4. SHOT LIST — LOCKED TIMING (60 fps)

Timings are law. If content does not fit a scene, cut content, not the hold frames.

### S0 · HOOK — f0–131 (0.00–2.20)
Cornsilk graph paper. Dead centre, a single monospace line at 34px in `rgba(42,33,24,0.28)`:
`{{ YOUR_PROMPT }}` with a 1px caret blinking at 500 ms (the only linear thing in the film).
- f0–f10: nothing. Two-thirds of a second of stillness before *anything* moves is what
  separates a directed film from a generated one. Hold.
- f10–f34: `{{ YOUR_PROMPT }}` arrives — `translateY 14px → 0` on `expoOut` over 24f,
  opacity `0 → 1` over **14f** (opacity finishes 10 frames before position: elements
  *arrive*, they do not fade in place).
- f34–f96: hold. Caret blinks. Camera drifts `+6px` on x with `cubicInOut` — one slow
  move, ending at f96, then **fully stopped**.
- f96–f131: the graph-paper grid brightens to 0.14 opacity and the whole cornsilk layer
  scales `1.0 → 1.04` on `expoIn` while a horizontal wipe led by a 3px corn-700
  dimension-line stroke crosses the frame left→right in 22 frames (`expoInOut`).
  Motion blur along x on the wipe leader.

### S1 · BRAND SNAP — f132–215 (2.20–3.60)
Cut on the arrowhead hit at f132. Ground is now `corn-100` still, but inverting.
- f132–f150: the wordmark `eengineer` snaps in at the optical centre. Scale `0.92 → 1.0`
  on `backOut(1.6)` in 18f, **no fade** — a hard on-frame appearance with 2 frames of
  anticipation (`scale 0.96` at f130, i.e. it pre-loads *before* the cut).
- f150–f176: the dimension line draws underneath it, 150px wide, `stroke-dashoffset`
  1000 → 0 on `expoOut`, arrowheads landing 15 frames after the baseline starts.
  Caption `fig. 1 — one word, two e's` cuts on at f168.
- f176–f200: **hold 24 frames.** Nothing moves. This is the film's first breath.
- f200–f215: the cornsilk ground inverts to the dark radial gradient via a `clip-path`
  circle expanding from the `ee` glyph — 15 frames, `circOut`. The wordmark's `ee` stays
  gold through the inversion; `ngineer` cross-fades ink → white in 8 frames. **Match
  cut: the same object survives the transition.** Everything else is replaced.

### S2 · SIDEBAR / THE NEW NAV ITEM — f216–371 (3.60–6.20)
Camera pushes left; the 220px dark sidebar builds against `dark-100`.
- f216–f230: sidebar panel slides `x −40 → 0`, `expoOut`, with a 1px right hairline at
  `rgba(255,255,255,0.08)`.
- f230–f300: nav items cascade in — Home, Community, Contests, Projects — 19px lucide
  icons at `stroke-width 1.8`, label `14px / 500` in `dark-muted`. Stagger is **eased,
  not linear**: gaps of 7, 6, 5, 4 frames (accelerating), each item `y +10 → 0` /
  opacity over 16f on `quintOut`.
- f300–f330: **the beat.** `Prompt Lab` (Sparkles icon) arrives last and differently:
  it overshoots `y −4px` then settles, and a gold `#C79A3A` glow blooms behind it —
  `filter: drop-shadow` 0 → 12px → 5px over 30f, plus a `New` pill in gold at 20%
  opacity fill that pops with `backOut` and holds.
- f330–f348: cursor enters from the lower right on an **arc**, not a straight line;
  decelerates on `expoOut`, overshoots the target by 5px, corrects back over 4 frames.
- f348–f356: cursor press (`scale 1 → 0.88 → 1`, 6f). The UI responds **4 frames later**
  at f352 — never on the same frame. Row background lifts to `rgba(255,255,255,0.08)`.
- f356–f371: whip to the right; content pushes in from x +60 with 3px directional
  motion blur; the Sparkles icon **flies from the sidebar into the page heading** —
  same object, new context. Remaining sidebar rows lag 3 frames behind the panel
  (secondary motion).

### S3 · HUB BUILDS ITSELF — f372–563 (6.20–9.40)
The real Prompt Lab page assembles. Use these exact production strings:
- Eyebrow (gold, caps-label spec): `PROMPT LAB`
- H1 with 20px gold Sparkles: `Prompt Lab`
- Sub: `Staff-level prompts for every engineering task. Copy, paste, ship.`
- Search field, `h 44px`, `radius 12px`, `bg rgba(255,255,255,0.05)`, border
  `rgba(255,255,255,0.10)`, placeholder in `rgba(184,174,147,0.4)`:
  `Search prompts by keyword, tool (Claude, Cursor, GPT-4o), or failure scenario…`
- Category tabs: `Все` · `🤖 AI Chatbot` · `🕹️ AI Agent` · `🤝 Cowork AI` ·
  `🔧 Error Clinic` — active tab = `bg rgba(199,154,58,0.15)`, border
  `rgba(199,154,58,0.30)`, text gold, glow `0 0 10px rgba(199,154,58,0.12)`.

Beats:
- f372–f384: **show the loading state.** A 24px gold ring spinner + `Loading prompts
  bank…`. Twelve frames of it. Real products load; fake promos never do. This single
  detail is what makes an audience read the shot as a real screen.
- f384–f404: spinner cross-dissolves out as the header block lands, `y +18 → 0`,
  `expoOut`, opacity over 12f.
- f404–f432: tabs arrive left-to-right, 4-frame eased stagger, and each count badge
  **ticks up numerically** from 0 to its value over 14 frames on `quintOut` — real
  counting, mono digits, no odometer roll.
- f432–f500: the two-column card grid staggers in — cards `scale 0.97 → 1`, `y +16 → 0`,
  opacity over 14f, 5-frame gaps. Card interior lags the card frame by 3 frames.
- f500–f524: **hold 24 frames.** Camera fully still. Let the page be read.
- f524–f563: camera pushes in 1.06× toward the featured banner on `cubicInOut`; the two
  bottom cards blur 0 → 1.5px (shallow depth of field) as they leave the plane of interest.
- `fig. 2 — the bank` cuts on at f440, out at f560.

### S4 · PROMPT OF THE DAY → OPEN — f564–695 (9.40–11.60)
The featured banner, exactly as built: gradient `from rgba(199,154,58,0.15)` → dark-surface,
gold border at 40%, a blurred gold radial bloom top-right, a gold solid pill reading
`✦ PROMPT OF THE DAY` in `dark-900` text, plus category pill `🤖 AI Chatbot` and a mono
`INTERMEDIATE` badge.
- Title: `The Production Blind Spot Finder`
- Footer: `Optimized for:` + mono chips `Claude 3.7 Sonnet` `GPT-4o` `o3-mini` `Gemini 2.5 Pro`
- CTA: gold button `Open in Editor →`

Beats:
- f564–f584: a single specular sweep — a 220px-wide, 12° skewed white gradient at 6%
  opacity crosses the banner once on `expoInOut`. **Once. It never loops.**
- f584–f612: cursor travels to the CTA on an arc, decelerating; hovers; the button
  brightens 110% over 6f.
- f612–f620: press at f612, UI responds f616.
- f620–f660: the modal opens **from the banner's own bounding box** — the banner scales
  and morphs into the dialog frame rather than a new panel fading in over it
  (`clip-path` inset interpolation + matched border radius 16px). Backdrop
  `rgba(0,0,0,0.75)` + 8px blur ramps over 14f, offset 4 frames *after* the morph begins.
- f660–f695: dialog contents settle in three lagged groups (header → template → panels),
  6 frames apart. `fig. 3 — one template` cuts on at f668.

### S5 · THE MONEY SHOT — VARIABLE FILL — f696–1139 (11.60–19.00) · 7.4 s
This is 31% of the runtime and it is the whole point of the film. Camera is locked
here except for one 1.03× drift at the end. Nothing else on screen moves.

The dialog shows the live template preview in mono 15px / line-height 1.75 on
`dark-surface`, with four unfilled tokens rendered exactly as the product renders them:
`rgba(255,255,255,0.30)` text on `rgba(255,255,255,0.05)` with a hairline border.

Header row: gold Sparkles + `VARIABLE INPUTS` (caps-label) + a mono pill `0/4 filled`.

Fill sequence — each variable is a four-part move: **type → token morph → counter tick → settle.**

| # | Token | Typed value | Type in | Morph |
|---|---|---|---|---|
| 1 | `{{LANGUAGE}}` | `TypeScript / Node.js 22` | f700–f772 | f772–f790 |
| 2 | `{{CONCURRENCY_LEVEL}}` | `5,000 req/sec` | f800–f852 | f852–f870 |
| 3 | `{{PERSISTENCE_LAYER}}` | `PostgreSQL 16 + Redis` | f880–f944 | f944–f962 |
| 4 | `{{CODE}}` | *(3 lines of code paste-drop, not typed)* | f972–f1000 | f1000–f1018 |

- **Typing cadence must be human.** Per-character intervals sampled 30–70 ms, with a
  2-frame micro-pause at every word boundary and one 5-frame hesitation somewhere in
  variable 2. A constant-interval typewriter is the single loudest "generated" tell.
- **Token morph** (the hero micro-interaction): the grey `{{TOKEN}}` in the live preview
  cross-fades to the typed value while its chip background goes
  `rgba(255,255,255,0.05)` → `rgba(199,154,58,0.15)`, border → `rgba(199,154,58,0.30)`,
  text → `#C79A3A`, and a bloom `0 0 8px rgba(199,154,58,0.15)` blooms to 18px and
  settles back to 8px over 18 frames on `expoOut`. The chip's width change must be
  handled with `transform: scaleX` + counter-scaled text, never an animated `width`.
  Neighbouring text **reflows with a 3-frame lag** — secondary motion sells it as real DOM.
- **Counter** `0/4 → 1/4 → 2/4 → 3/4 → 4/4` snaps on the frame the morph completes,
  with a 4-frame `scale 1 → 1.12 → 1` pop. Digits are mono, no roll.
- Variable 4 is a **paste**, not a type: the code block drops in as one block with a
  4-frame `y −8 → 0` and 2px motion blur. Rhythm variation — three types then a paste —
  is what keeps 7.4 seconds from feeling like a loop.
- f1018–f1060: **hold 42 frames.** All four tokens gold. Whole template legible. This is
  the longest hold in the film and it is deliberate: the viewer must read a filled
  template. Absolutely nothing moves — no drift, no glow pulse, no ambient anything.
- f1060–f1100: camera drifts 1.03× toward the copy button on `cubicInOut`, stopping
  completely at f1100.
- f1100–f1139: a keyboard-shortcut hint fades up next to the copy button, mono 12px:
  `⌘ + ↵`. `fig. 4 — 4 / 4 filled` cuts on at f1030.

### S6 · COPY — f1140–1271 (19.00–21.20)
- f1140–f1146: the `⌘ + ↵` hint chips flash — key-down state, `scale 0.94`, 6 frames.
- f1150–f1172: the copy button label swaps to a **stroking checkmark**: `stroke-dashoffset`
  draw over 13 frames (the product's 220 ms `draw-fast`) in `#34D399`, with a 3-frame
  `backOut` pop on the button.
- f1172–f1200: a toast slides up from the bottom of the dialog, `y +14 → 0`, `expoOut`,
  18f: `Copied — 1,842 characters` in `dark-text` mono on `dark-surface2`.
- f1200–f1232: **hold 32 frames.**
- f1232–f1271: everything on the dark layer retreats — the dialog scales to `0.97` and
  falls to opacity 0 over 22 frames on `expoIn` while a cornsilk `clip-path` circle
  re-expands from the checkmark's position. Match cut again: the check's green is the
  last dark-theme pixel on screen.

### S7 · ENDCARD — f1272–1439 (21.20–24.00)
Back on cornsilk graph paper. Composition is the landing page's own hero logic.
- f1272–f1292: the film's opening line returns, dead centre, in the *same* position and
  size as frame 34 — but now the slot fills: `{{ ... }}` morphs, using the identical
  token-morph move from S5, into a gold-chipped **`Prompt Lab`**. 20 frames, `expoOut`.
  This is the payoff. Nothing else is on screen while it happens.
- f1292–f1316: **hold 24 frames.**
- f1316–f1340: one line of Space Grotesk 26px in ink lands beneath, `y +10 → 0`, `expoOut`:
  `Staff-level prompts. Now inside eengineer.`
- f1340–f1372: the dimension line draws across beneath it (`expoOut`, arrowheads last),
  caption `fig. 5 — ship it`.
- f1372–f1396: the wordmark `eengineer` cuts in at the lower third (no fade) with the URL
  in mono 15px corn-800: `eengineer.net/dashboard/prompt-lab`.
- f1396–f1439: **hold 43 frames, absolutely static.** Last frame is a clean, exportable
  poster frame. Do not end on a move.

---

## 5. MOTION CRAFT — THE RULES THAT SEPARATE THIS FROM GENERATED MOTION

Apply all of these. They are the difference between "an image with movement" and a film.

1. **Split easing per property.** Position, opacity and scale on the same element get
   different curves and different durations. Opacity always resolves at ~60% of the
   position duration.
2. **Anticipation.** Every deliberate move (button press, panel open, camera push) gets
   2–4 frames of counter-motion first.
3. **Overshoot proportional to mass.** Chips and badges may overshoot 4–6%. Cards 2%.
   Panels and modals: **zero** — heavy things do not bounce.
4. **Lead and lag.** A container and its contents never move on the same frame.
   Contents trail the container by 3–6 frames, always.
5. **Hold frames are content.** There are five explicit holds above (f176, f500, f1018,
   f1200, f1396) totalling ~2.7 s of deliberate stillness. Do not fill them. Constant
   low-grade drift is the number-one signature of generated motion; stillness is the
   signature of a director.
6. **No perpetual motion.** No looping particles, no breathing background, no idle
   float, no never-ending zoom. Every animation in the file has a start frame and an
   end frame.
7. **Directional motion blur** on anything crossing more than 300 px in under 10 frames
   — implemented as a real per-frame directional blur (stacked offset copies or an SVG
   `feGaussianBlur` on one axis), never a symmetric CSS `blur()`.
8. **The cursor is a character.** It travels on arcs, leads its target, overshoots and
   corrects, presses before the UI reacts, and rests still between actions. It never
   teleports and never moves in a straight line.
9. **Latency is realism.** 3–5 frames between input and response, every time.
10. **Match cuts over transitions.** Three objects survive scene changes: the `ee` glyph
    (S1→S2), the Sparkles icon (S2→S3), the token chip (S5→S7). Build the film around
    those, not around wipes.
11. **Grade, lightly.** A static 2% film grain over the whole frame (a fixed noise tile,
    re-seeded every 2 frames, never animated smoothly), a 0.4px chromatic offset in the
    outer 8% of the frame only, and a subtle vignette on dark scenes. Nothing more.
12. **Type is never decorated.** No glow-on letters, no per-character fly-in, no
    gradient text. Text arrives as a block, on a curve, and stops.

---

## 6. HARD NO — REJECT ON SIGHT

- Fabricated UI. Every element must trace to a real eengineer component and a real
  string. No invented feature names, no lorem ipsum, no fake metrics.
- Colours outside §2. Specifically: no purple/blue "tech" gradients, no neon, no
  glassmorphism beyond the two shadows and one backdrop blur specified.
- Stock motion-graphics vocabulary: particle fields, bokeh, lens flare, "data streams",
  glowing orbs, circuit-board backgrounds, morphing blobs, 3D floating phone mockups.
- Ken Burns on a static screenshot. If a shot is a still image being slowly zoomed, it
  is not in this film.
- Linear easing anywhere except the graph-paper scroll and the caret blink.
- Uniform 300 ms-everything. Durations in this film range 6f to 44f and are all specified.
- Music, risers, braams, cinematic whooshes. See §7.
- Emoji as decoration. The only emoji permitted are the four already in the product's
  category data: 🤖 🕹️ 🤝 🔧.
- Anything that would still look correct if it were a different product's promo. Every
  frame must be unmistakably eengineer.

---

## 7. SOUND — UI ONLY, NO MUSIC

Silence is the bed. Design it: a room tone at −48 dBFS runs the whole 24 s so the cuts
do not feel dead, and there are only **nine** sound events. Every one lands on the
frame of contact, never after it. Deliver as a cue sheet (timecode, description,
duration, level) plus, if audio is generated, WAVs at 48 kHz.

| # | Frame | Time | Cue | Character | Level |
|---|---|---|---|---|---|
| 1 | 96 | 1.60 | Dimension-line wipe | Soft filtered air-pass, 180 ms, no tail | −18 dB |
| 2 | 132 | 2.20 | Brand snap | Low wooden tick + 60 Hz sub-thump, 90 ms | −12 dB |
| 3 | 300 | 5.00 | Prompt Lab nav item | Bright single ping, ~1.2 kHz, 140 ms | −16 dB |
| 4 | 352 | 5.87 | Nav click | Dry mechanical click, 40 ms | −14 dB |
| 5 | 616 | 10.27 | Open in Editor | Click + a rising 120 ms swell for the modal | −13 dB |
| 6 | 700–1000 | 11.7–16.7 | Typing | Real key clicks, varied velocity, ~50 ms each, panned ±8% | −22 dB |
| 7 | 772 / 852 / 944 / 1018 | — | Token fills | Four ascending marimba-like taps (C–E–G–C), 110 ms | −17 dB |
| 8 | 1152 | 19.20 | Copy confirm | Two-note resolve, pitched to the top of cue 7 | −11 dB |
| 9 | 1276 | 21.27 | Endcard slot fills | The cue-7 timbre, one octave down, with 400 ms tail | −14 dB |

Cue 7 is the film's motif: four rising notes that resolve on the copy. That is the only
"musical" idea permitted, and it is diegetic — it is the UI, not a score.

---

## 8. SELF-CHECK BEFORE YOU RETURN THE FILE

Answer each in a comment block at the top of the HTML:
1. Does `seek(f)` produce identical output to playing to `f`? (Test f = 200, 900, 1300.)
2. Is any element animating a non-GPU property? (Must be none.)
3. Count the frames where the camera is completely static. (Must be ≥ 160.)
4. Is every string on screen a real production string from §4? (List them.)
5. Does any animation loop or continue past its scene? (Must be none.)
6. At 1080 × 1920 played at 100%, is the smallest text ≥ 22 px on the stage? (Must be yes.)
7. Does the film still make sense with the sound off? (Must be yes.)

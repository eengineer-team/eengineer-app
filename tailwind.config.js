/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  // getDisciplineColor() builds these class names dynamically (bg-discipline-x /
  // border-discipline-x / text-discipline-x), so the JIT scanner can't find them
  // as literal strings in source — safelist keeps them from being purged.
  safelist: [
    {
      pattern: /^(bg|border|text)-discipline-(aerospace|mechanical|electrical|software|civil|chemical|biomedical|materials|environmental|other)$/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Pre-auth cornsilk palette
        corn: {
          50:  '#FFFDF0',
          100: '#FFF8DC',  // pure cornsilk
          200: '#FAF4CC',
          300: '#F5EFB8',
          400: '#EDE39A',
          500: '#D4C66A',
          600: '#B5A23A',
          700: '#8B6914',  // amber accent
          800: '#5C4A1E',  // warm brown secondary text
          900: '#1A1208',  // primary text
        },
        // Post-auth dark palette
        dark: {
          50:  '#1C1C24',
          100: '#16161E',
          200: '#111118',
          300: '#0D0D14',
          900: '#08080F',   // base under radial gradient
          // Semantic tokens (card/text/muted) — everything on dark screens
          // must trace to one of these, not a one-off hex/opacity.
          surface:  '#16150F',  // card/panel surface on dark
          surface2: '#1E1C14',  // nested surface (comment/reply inside a card)
          text:     '#F5F0DF',  // primary text and headings on dark
          muted:    '#B8AE93',  // secondary text — deliberately light, don't dim further
        },
        // Dashboard gold — corn-700 dims on dark backgrounds, dashboard CTAs
        // (Register/Connect/deadline badges) use this lighter gold instead.
        gold: {
          dark: '#C79A3A',
        },
        // Functional discipline color-coding (chips, calendar deadline dots,
        // sidebar clubs) — muted/desaturated so they sit calmly on dark-900
        // and read as information (which discipline), not decoration.
        // See src/lib/discipline-colors.ts for the lookup helper.
        discipline: {
          aerospace: '#6E8FB0',
          mechanical: '#B08A6E',
          electrical: '#B0A06E',
          software: '#7EA88C',
          civil: '#9A8FB0',
          chemical: '#B07E8C',
          biomedical: '#6EB0A4',
          materials: '#8C8C9A',
          environmental: '#7FB06E',
          other: '#9A9488',
        },
      },
      fontSize: {
        // Widened + given slight positive tracking per founder request
        // (07.09.2026): "larger, not giantly huge" — the heavy Syne 800
        // weight was crowding itself at the old -0.03em, so this moved to
        // +0.01em instead of just scaling the cap up. Previously defined but
        // never actually applied anywhere (Welcome.tsx's hero used a
        // one-off arbitrary clamp() instead) — now the hero uses this token
        // directly, so any future hero-scale headline gets it for free.
        // Floor lowered to 2.25rem (from 3.25rem) — at the old floor,
        // "Engineer" rendered at a fixed 52px on every viewport below 722px
        // (7.2vw only crosses 52px above that width), and 52px only clears
        // a 375px screen by ~9px, so 360/320px phones pushed the word off
        // the edge. Measured "Engineer" at 2.25rem leaves clear side margin
        // at 320px with room to spare at 360/375. Cap and vw ramp unchanged.
        'display': ['clamp(2.25rem, 7.2vw, 6.25rem)', { lineHeight: '0.94', letterSpacing: '0.01em', fontWeight: '800' }],
        'heading': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        // Canonical caps-label spec (overline / eyebrow text) — this was the
        // most common of three inline variants scattered across the app
        // (10px/0.18em, 10px/0.22em, 11px/0.16em); 11px/0.16em is what the
        // shared LabelCaps component already used, so it became the standard
        // instead of the token's old, never-applied 0.75rem/0.08em.
        'label': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.16em', fontWeight: '500' }],
      },
      backgroundImage: {
        'corn-subtle': 'radial-gradient(ellipse 80% 60% at 70% 40%, #FFF8DC 0%, #FAF4CC 60%, #F0E8AA 100%)',
        'dark-radial': 'radial-gradient(ellipse 90% 70% at 75% 0%, #1C1C24 0%, #111118 55%, #08080F 100%)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-med': 'float 6s ease-in-out infinite 1s',
        'draw': 'draw 3s ease forwards',
        // Same `draw` keyframe as the hero dimension line, just sped up for
        // an inline confirmation checkmark instead of a one-time page-load
        // flourish — the shape and mechanism (pathLength + dashoffset) are
        // identical, only the pace differs.
        'draw-fast': 'draw 220ms ease-out forwards',
        // Confirmation-feedback trio (block: motion pass, 07.2026) — Register/
        // Connect/Send/skill-fill all reuse one of these three, transform +
        // opacity only (no width/height — see tailwind constraint note),
        // capped under 250ms so they read as an ack, not decoration.
        'pop-in': 'pop-in 180ms ease-out forwards',
        'bubble-in': 'bubble-in 200ms ease-out forwards',
        'fill-in': 'fill-in 160ms ease-out forwards',
        'accordion-down': 'accordion-down 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        'accordion-up':   'accordion-up 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(1.5deg)' },
          '66%': { transform: 'translateY(6px) rotate(-1deg)' },
        },
        draw: {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bubble-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fill-in': {
          '0%':   { opacity: '0', transform: 'scale(0.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to:   { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          to:   { height: '0', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

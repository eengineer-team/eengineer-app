/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`
export default {
  // Absolute paths so the build works no matter which directory it is started from.
  content: [`${import.meta.dirname}/index.html`, `${import.meta.dirname}/src/**/*.{ts,tsx}`],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Same type scale as eengineer-app (display / heading / caps label).
      fontSize: {
        display: ['clamp(2.25rem, 7.2vw, 6.25rem)', { lineHeight: '0.94', letterSpacing: '0.01em', fontWeight: '800' }],
        heading: ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        label: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.16em', fontWeight: '500' }],
      },
      // Semantic tokens only — every color in the app traces to one of these.
      // Values live in src/index.css (.theme-welcome = eengineer cornsilk, .theme-dashboard = eengineer dark/gold).
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        surface2: token('surface-2'),
        text: token('text'),
        muted: token('muted'),
        border: token('border'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        // Solid call-to-action: near-black on welcome pages, gold on dashboard pages (eengineer-app button variants primary/accent).
        cta: token('cta'),
        'cta-ink': token('cta-ink'),
        'cta-hover': token('cta-hover'),
        good: token('good'),
        bad: token('bad'),
        // Physics diagram colors (forces, velocity, acceleration, graphs)
        force: token('force'),
        velocity: token('velocity'),
        accel: token('accel'),
      },
    },
  },
  plugins: [],
}

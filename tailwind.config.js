/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
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
        // Post-auth dark palette (for later phases)
        dark: {
          50:  '#1C1C24',
          100: '#16161E',
          200: '#111118',
          300: '#0D0D14',
          900: '#08080F',
        },
      },
      fontSize: {
        'display': ['5.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-sm': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '500' }],
      },
      backgroundImage: {
        'corn-subtle': 'radial-gradient(ellipse 80% 60% at 70% 40%, #FFF8DC 0%, #FAF4CC 60%, #F0E8AA 100%)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-med': 'float 6s ease-in-out infinite 1s',
        'draw': 'draw 3s ease forwards',
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

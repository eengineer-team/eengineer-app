// Explicit config path so Tailwind uses this app's config even when the dev server
// is started from another directory (e.g. the parent repo).
export default {
  plugins: {
    tailwindcss: { config: `${import.meta.dirname}/tailwind.config.js` },
    autoprefixer: {},
  },
}

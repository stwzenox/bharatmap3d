/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cadastral: {
          dark: '#0a0d14',
          card: 'rgba(15, 23, 42, 0.85)',
          border: 'rgba(56, 189, 248, 0.2)',
          accent: '#00f0ff',
          glow: '#0ea5e9',
          warning: '#f59e0b',
          error: '#ef4444',
          success: '#10b981',
          ground: '#1e293b',
          underground: '#6366f1',
          elevated: '#ec4899',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

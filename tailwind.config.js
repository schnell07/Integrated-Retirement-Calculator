/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0a',
          900: '#121212',
          850: '#1a1a1a',
          800: '#242424',
          700: '#2d2d2d',
          600: '#3d3d3d',
          500: '#4d4d4d',
          400: '#5d5d5d',
          300: '#7d7d7d',
          200: '#a0a0a0',
          100: '#d0d0d0',
          50: '#f5f5f5',
        },
        neon: {
          green: '#00ff41',
          cyan: '#00d9ff',
          purple: '#d946ef',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e5e7eb',
          },
        },
      },
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'headline-lg': ['"Space Grotesk"', 'sans-serif'],
        'display-lg': ['"Space Grotesk"', 'sans-serif'],
        'body-md': ['"Inter"', 'sans-serif'],
        'label-caps': ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#98cbff',
          400: '#38bdf8',
          500: '#00a3ff',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          container: '#00a3ff',
          glow: '#38bdf8',
        },
        secondary: {
          DEFAULT: '#d3fbff',
          fixed: '#7df4ff',
          'fixed-dim': '#00dbe9',
          container: '#00eefc',
        },
        accent: {
          DEFAULT: '#10b981', // emerald-500
        },
        dark: {
          950: '#030712',
          900: '#090d16',
          800: '#111827',
          700: '#1f293d',
        },
        surface: {
          DEFAULT: '#0c0d12',
          container: '#131622',
          'container-low': '#0a0c14',
          'container-lowest': '#05060a',
          'container-high': '#1b2030',
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
        },
        danger: {
          DEFAULT: '#ef4444', // red-500
        },
        success: {
          DEFAULT: '#22c55e', // green-500
        }
      }
    },
  },
  plugins: [],
}

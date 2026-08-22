/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'headline-lg': ['"Hanken Grotesk"', '"Space Grotesk"', 'sans-serif'],
        'headline-md': ['"Hanken Grotesk"', '"Space Grotesk"', 'sans-serif'],
        'body-lg': ['"Hanken Grotesk"', '"Inter"', 'sans-serif'],
        'body-md': ['"Hanken Grotesk"', '"Inter"', 'sans-serif'],
        'label-sm': ['"Hanken Grotesk"', 'sans-serif'],
        'data-display': ['"Hanken Grotesk"', '"Space Grotesk"', 'sans-serif'],
        'heritage-headline': ['"Be Vietnam Pro"', 'sans-serif'],
        'label-caps': ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Hanken Grotesk"', '"Inter"', 'sans-serif'],
      },
      colors: {
        // ── Terraform Organic Design System Colors ──
        terraform: {
          primary: '#17341c',
          'primary-container': '#2d4b31',
          'on-primary': '#ffffff',
          'primary-fixed': '#c8ecc8',
          'primary-fixed-dim': '#adcfad',
          secondary: '#805533',
          'secondary-container': '#fdc39a',
          'on-secondary': '#ffffff',
          tertiary: '#2d2f2c',
          background: '#fafaf4',
          'on-background': '#1a1c19',
          surface: '#fafaf4',
          'surface-dim': '#dadad5',
          'surface-container-low': '#f4f4ee',
          'surface-container': '#eeeee9',
          'surface-container-high': '#e8e8e3',
          'surface-container-highest': '#e3e3de',
          'surface-container-lowest': '#ffffff',
          'on-surface': '#1a1c19',
          'on-surface-variant': '#424841',
          outline: '#737971',
          'outline-variant': '#c2c8bf',
          // Heritage Palette
          saffron: '#FF9933',
          marigold: '#FFB300',
          terracotta: '#B35A38',
          sand: '#FAF3E0',
          clay: '#E8DCC4',
        },
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

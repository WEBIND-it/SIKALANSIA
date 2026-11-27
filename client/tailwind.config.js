/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: '#F8FAFC',       // Clinical soft slate page background
        surface: {
          soft: '#F1F5F9',       // Slate 100 soft elevation
          strong: '#E2E8F0',     // Slate 200 plate fill
          dark: '#0F172A',       // Slate 900 dark hero / card
          elevated: '#1E293B',   // Dark mode card elevation
        },
        saas: {
          primary: '#0A95E6',          // Brand Blue
          'primary-active': '#087EC4', // Deep Brand Blue
          'primary-light': '#EBF7FE',  // Soft Brand Blue 50
          dark: '#0F172A',             // Slate 900 deep text
          muted: '#475569',            // Slate 600 body text
          'muted-soft': '#64748B',     // Slate 500 subdued text
          lightBg: '#FFFFFF',          // Card background
        },
        sidebar: '#112751',
        brand: {
          white: '#FFFFFF',
          blue: '#0A95E6',
          green: '#489E23',
        },
        teal: {
          50: '#EBF7FE',
          100: '#D6EEFC',
          200: '#ADE0FA',
          300: '#74CBF7',
          400: '#35B2F1',
          500: '#0A95E6',
          600: '#0A95E6',
          700: '#087EC4',
          800: '#0767A1',
          900: '#085584',
          950: '#053554',
        },
        hairline: {
          DEFAULT: '#E2E8F0',
          soft: '#F1F5F9',
        },
        trend: {
          successBg: '#ECFDF5',
          successText: '#489E23',    // Brand Green
          dangerBg: '#FEF2F2',
          dangerText: '#DC2626',     // Red 600
          warningBg: '#FFFBEB',
          warningText: '#D97706',    // Amber 600
        }
      },
      borderRadius: {
        'card': '12px',
        'input': '8px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft-card': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}

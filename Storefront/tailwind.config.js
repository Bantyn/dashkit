/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        "moving-banner": {
          from: { backgroundPosition: "0% 0" },
          to: { backgroundPosition: "100% 0" },
        },
      },
      animation: {
        "moving-banner": "moving-banner 20s linear infinite",
      },
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50-rgb, 243 244 255) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100-rgb, 232 234 255) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200-rgb, 214 217 255) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300-rgb, 195 199 255) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400-rgb, 170 176 255) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500-rgb, 142 148 242) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600-rgb, 115 121 232) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700-rgb, 95 101 216) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800-rgb, 74 79 181) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900-rgb, 59 63 143) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-500-rgb, 142 148 242) / <alpha-value>)',
        },
        gray: {
          50: 'rgb(var(--color-gray-50-rgb, 248 249 255) / <alpha-value>)',
          100: 'rgb(var(--color-gray-100-rgb, 238 240 250) / <alpha-value>)',
          200: 'rgb(var(--color-gray-200-rgb, 224 228 245) / <alpha-value>)',
          300: 'rgb(var(--color-gray-300-rgb, 207 211 232) / <alpha-value>)',
          400: 'rgb(var(--color-gray-400-rgb, 165 169 194) / <alpha-value>)',
          500: 'rgb(var(--color-gray-500-rgb, 144 148 166) / <alpha-value>)',
          600: 'rgb(var(--color-gray-600-rgb, 107 112 148) / <alpha-value>)',
          700: 'rgb(var(--color-gray-700-rgb, 74 79 106) / <alpha-value>)',
          800: 'rgb(var(--color-gray-800-rgb, 45 49 66) / <alpha-value>)',
          900: 'rgb(var(--color-gray-900-rgb, 28 32 51) / <alpha-value>)',
        },
        card: 'var(--bg-card, #ffffff)',
        page: 'var(--bg-page, #ffffff)',
        border: 'var(--border-color, #e2e8f0)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

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
          50: 'var(--color-primary-50, #f3f4ff)',
          100: 'var(--color-primary-100, #e8eaff)',
          200: 'var(--color-primary-200, #d6d9ff)',
          300: 'var(--color-primary-300, #c3c7ff)',
          400: 'var(--color-primary-400, #aab0ff)',
          500: 'var(--color-primary-500, #8e94f2)',
          600: 'var(--color-primary-600, #7379e8)',
          700: 'var(--color-primary-700, #5f65d8)',
          800: 'var(--color-primary-800, #4a4fb5)',
          900: 'var(--color-primary-900, #3b3f8f)',
          DEFAULT: 'var(--color-primary, #7379e8)',
        },
        gray: {
          50: 'var(--color-gray-50, #f8f9ff)',
          100: 'var(--color-gray-100, #eef0fa)',
          200: 'var(--color-gray-200, #e0e4f5)',
          300: 'var(--color-gray-300, #cfd3e8)',
          400: 'var(--color-gray-400, #a5a9c2)',
          500: 'var(--color-gray-500, #9094a6)',
          600: 'var(--color-gray-600, #6b7094)',
          700: 'var(--color-gray-700, #4a4f6a)',
          800: 'var(--color-gray-800, #2d3142)',
          900: 'var(--color-gray-900, #1c2033)',
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

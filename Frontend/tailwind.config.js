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
                    50: 'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    200: 'var(--color-primary-200)',
                    300: 'var(--color-primary-300)',
                    400: 'var(--color-primary-400)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                    800: 'var(--color-primary-800)',
                    900: 'var(--color-primary-900)',
                    DEFAULT: 'var(--color-primary)',
                },
                gray: {
                    50: 'var(--color-gray-50)',
                    100: 'var(--color-gray-100)',
                    200: 'var(--color-gray-200)',
                    300: 'var(--color-gray-300)',
                    400: 'var(--color-gray-400)',
                    500: 'var(--color-gray-500)',
                    600: 'var(--color-gray-600)',
                    700: 'var(--color-gray-700)',
                    800: 'var(--color-gray-800)',
                    900: 'var(--color-gray-900)',
                },
                success: {
                    DEFAULT: 'var(--color-success)',
                    bg: 'var(--color-success-bg)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    bg: 'var(--color-warning-bg)',
                },
                danger: {
                    DEFAULT: 'var(--color-danger)',
                    bg: 'var(--color-danger-bg)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    bg: 'var(--color-info-bg)',
                },
                card: 'var(--bg-card)',
                page: 'var(--bg-page)',
                border: 'var(--border-color)',
            },
            fontFamily: {
                sans: ['var(--font-family-base)', 'Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
            spacing: {
                '1': 'var(--space-1)',
                '2': 'var(--space-2)',
                '3': 'var(--space-3)',
                '4': 'var(--space-4)',
                '5': 'var(--space-5)',
                '6': 'var(--space-6)',
                '8': 'var(--space-8)',
                '10': 'var(--space-10)',
                '12': 'var(--space-12)',
            },
        },
    },
    plugins: [],
}

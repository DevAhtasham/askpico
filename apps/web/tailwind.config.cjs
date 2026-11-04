/** @type {import('tailwindcss').Config} */

function parentSiblingHoverPlugin({ addVariant, e }) {
  addVariant('parent-sibling-hover', ({ modifySelectors, separator }) => {
    modifySelectors(({ className }) => {
      return `.parent-sibling:hover ~ .parent .${e(
        `parent-sibling-hover${separator}${className}`
      )}`;
    });
  });
}

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: [
        'Söhne',
        'Roboto',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Ubuntu',
        'Cantarell',
        'Noto Sans',
        'sans-serif',
        'Helvetica Neue',
        'Arial',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      mono: [
        'Söhne Mono',
        'Monaco',
        'Andale Mono',
        'Ubuntu Mono',
        'Consolas',
        'monospace',
      ],
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: { padding: 0, margin: 0 },
            ul: {
              'list-style-type': 'none',
            },
          },
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 12, 46, 0.04), 0 12px 40px rgba(80, 60, 140, 0.08)',
        soft: '0 1px 3px rgba(17, 12, 46, 0.06)',
      },
      keyframes: {
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        orbSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'orb-pulse': 'orbPulse 5s ease-in-out infinite',
        'orb-spin': 'orbSpin 14s linear infinite',
      },
      colors: {
        brand: {
          50: '#f6f3ff',
          100: '#ede7fe',
          200: '#ddd3fd',
          300: '#c4b2fb',
          400: '#a68af6',
          500: '#8b63ef',
          600: '#7a46e3',
          700: '#6935c7',
          800: '#572da2',
          900: '#482983',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f6f8',
          subtle: '#f0f0f4',
          line: '#e7e7ec',
        },
        ink: {
          DEFAULT: '#111113',
          soft: '#4b4b55',
          muted: '#8a8a95',
        },
        gray: {
          50: '#f7f7f8',
          100: '#ececf1',
          200: '#d9d9e3',
          300: '#d1d5db',
          400: '#acacbe',
          500: '#8e8ea0',
          600: '#4b5563',
          650: '#444654',
          700: '#40414f',
          800: '#343541',
          850: '#2A2B32',
          900: '#202123',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), parentSiblingHoverPlugin],
  darkMode: 'class',
};

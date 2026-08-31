/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f9f1',
          100: '#e4f1da',
          200: '#cae2b8',
          300: '#a5cd8b',
          400: '#7cb15e',
          500: '#5a943c',
          600: '#46762d',
          700: '#375c24',
          800: '#2e4a20',
          900: '#273e1d',
          950: '#14220e',
        },
        clay: {
          50: '#fdf8f3',
          100: '#fbeede',
          200: '#f5d8ba',
          300: '#edbd8e',
          400: '#e29a60',
          500: '#d97e3c',
          600: '#cc6630',
          700: '#a94e29',
          800: '#873f27',
          900: '#6e3623',
          950: '#3d1b10',
        },
        ink: {
          50: '#f7f6f4',
          100: '#edebe7',
          200: '#dad6cf',
          300: '#beb8ac',
          400: '#9e968a',
          500: '#827b6f',
          600: '#686259',
          700: '#524e47',
          800: '#3c3934',
          900: '#2b2925',
          950: '#1a1916',
        },
        severity: {
          low: '#5a943c',
          medium: '#e4a017',
          high: '#d9612f',
          'outbreak-risk': '#c2362b',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(43,41,37,0.08), 0 6px 24px -8px rgba(43,41,37,0.12)',
        'card-hover': '0 2px 8px rgba(43,41,37,0.12), 0 12px 36px -10px rgba(43,41,37,0.2)',
        warm: '0 4px 24px -6px rgba(204,102,48,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'badge-in': 'badgeIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        badgeIn: {
          '0%': { opacity: '0', transform: 'scale(0.6) translateY(4px)' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

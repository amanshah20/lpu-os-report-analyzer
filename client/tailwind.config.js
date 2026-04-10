/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E07B39',
          50: '#FDF3EB',
          100: '#FAE4CC',
          200: '#F5C89A',
          300: '#F0AC67',
          400: '#EB9044',
          500: '#E07B39',
          600: '#C4612A',
          700: '#A04A1F',
          800: '#7C3515',
          900: '#58230A',
        },
        secondary: {
          DEFAULT: '#1A1A2E',
          50: '#E8E8F0',
          100: '#C9C9DC',
          200: '#9595BB',
          300: '#60609A',
          400: '#3A3A70',
          500: '#1A1A2E',
          600: '#141424',
          700: '#0E0E1A',
          800: '#080810',
          900: '#020206',
        },
        accent: '#F5A623',
        background: '#0F0F1A',
        surface: 'rgba(255,255,255,0.05)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0B0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        button: '24px',
      },
      boxShadow: {
        'lpu': '0 8px 32px rgba(224,123,57,0.15)',
        'lpu-lg': '0 16px 48px rgba(224,123,57,0.25)',
        'glass': '0 4px 16px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'counter': 'counter 1.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      screens: {
        'xs': '360px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
    },
  },
  plugins: [],
};

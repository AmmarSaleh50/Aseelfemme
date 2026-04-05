/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blush: { DEFAULT: '#F0E5D6', 500: '#E7D7C1' },
        amber: { DEFAULT: '#C49A5A', 700: '#A97F3E' },
        mint: { DEFAULT: '#7A8F7A' },
        charcoal: { DEFAULT: '#5A5D4F' },
        ivory: { DEFAULT: '#F5EEDD' },
        brand: {
          bg: '#F5EEDD',
          text: '#5A5D4F',
          accent: '#C49A5A',
          accentDeep: '#A97F3E',
        },
        footer: {
          bg: '#A97F3E',
          text: '#F5EEDD',
          border: '#A97F3E',
          borderSubtle: '#C49A5A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1.25rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.06)',
      },
    }
  },
  plugins: []
};

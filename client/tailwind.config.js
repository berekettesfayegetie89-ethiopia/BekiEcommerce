/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Amazon Ember"','"Segoe UI"','system-ui','sans-serif'],
        display: ['"Playfair Display"','Georgia','serif'],
      },
      colors: {
        az: {
          dark:   '#131921',
          nav:    '#232f3e',
          light:  '#37475a',
          orange: '#ff9900',
          hover:  '#f3a847',
          yellow: '#febd69',
          blue:   '#146eb4',
          green:  '#067d62',
          red:    '#b12704',
          bg:     '#eaeded',
          card:   '#ffffff',
          border: '#d5d9d9',
          muted:  '#565959',
          text:   '#0f1111',
          link:   '#0066c0',
        },
        dk: {
          bg:     '#121212',
          card:   '#1e1e1e',
          nav:    '#1a1a1a',
          border: '#333333',
          text:   '#e8e8e8',
          sub:    '#aaaaaa',
          muted:  '#666666',
          orange: '#ff9900',
          blue:   '#4db8ff',
          green:  '#4caf7d',
          red:    '#f87171',
        },
      },
    },
  },
  plugins: [],
};

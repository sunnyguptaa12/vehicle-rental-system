/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        accent: '#f97316',
        surface: '#f8fafc'
      }
    }
  },
  plugins: []
};

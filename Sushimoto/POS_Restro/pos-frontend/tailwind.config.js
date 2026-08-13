/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b1454a',
        'primary-dark': '#8e363a',
        secondary: '#121212',
        creamson: '#fff0de',
        'black-200': '#020202',
        'black-300': '#333333',
        'black-400': '#1f1e31',
        'black-500': '#555555',
        'gray-100': '#888888',
        muted: '#f5f0e8',
        'muted-foreground': '#888888',
        border: '#e5e0d8',
        input: '#e5e0d8',
        ring: '#b1454a',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}

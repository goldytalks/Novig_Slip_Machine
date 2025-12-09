/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'novig-blue': '#38bdf8',
        'novig-dark': '#020617',
        'novig-orange': '#f97316',
        'novig-green': '#22c55e',
        'novig-light': '#f8fafc',
      }
    },
  },
  plugins: [],
}

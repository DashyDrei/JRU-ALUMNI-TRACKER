/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jru: {
          navy: '#0B2545',
          blue: '#13315C',
          lightBlue: '#1E3D59',
          gold: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
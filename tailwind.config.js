/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: '#2C1810',
          light: '#3D2518',
        },
        cream: '#FAF7F2',
        latte: '#C4A77D',
        ivory: '#FFF9F0',
        charcoal: '#1A1A1A',
        warm: {
          gold: '#B8965A',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
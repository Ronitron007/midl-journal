/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        lavender: '#e6e0f5',
        peach: '#fde8d7',
        sage: '#7c9082',
        'sage-light': '#b8c4ba',
        'muted-blue': '#5c9eb7',
      },
    },
  },
  plugins: [],
};

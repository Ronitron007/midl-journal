/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary 4-color palette
        cream: '#f8f4e9',
        terracotta: '#de8649',
        olive: '#707927',
        forest: '#3a5222',
      },
    },
  },
  plugins: [],
};

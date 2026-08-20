import tailwindcssAnimate from 'tailwindcss-animate';

import { darkMode, theme } from './tailwind.theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode,
  content: ['./**/*.{html,js,ts,jsx,tsx}'],
  theme,
  plugins: [tailwindcssAnimate],
};

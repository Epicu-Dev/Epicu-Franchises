import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        'page-bg': '#FAFAFA',
      },
      boxShadow: {
        'custom': '4px 4px 35px rgba(212,212,212,0.25)',
        'custom-dark': '4px 4px 35px rgba(0,0,0,0.3)',
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

module.exports = config;
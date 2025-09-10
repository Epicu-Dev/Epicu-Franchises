import { heroui } from "@heroui/theme"

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
        'custom-text-color': '#2B2B2B',
        'primary-light': '#666666',
        'primary': '#2B2B2B',
        'custom-blue-beauty': '#30BCE3',
        'custom-blue-rdv': '#1E40AF',
        'custom-blue-in-progress': '#5DADEC',
        'custom-blue-select': '#5DADEC',
        'custom-dark-blue': '#1E40AF',
        'custom-orange-food': '#F28D16',
        'custom-purple-shop': '#8E75B3',
        'custom-purple-studio': '#4525F7',
        'custom-green-travel': '#84BC26',
        'custom-green-stats': '#B1D1A0',
        'custom-green-success': '#4CAF50',
        'custom-red-fun': '#D8324A',
        'custom-red-retard': '#F44336',
        'custom-orange-event': '#F36F21',
        'custom-rose': '#E91E63',
        'custom-purple-pub': '#9B4DCC',
        'custom-purple-publication': '#8E24AA',
        'custom-red-filming': '#E91E63',
        'custom-orange-event': '#F36F2124',
        'custom-blue-meeting': '#1E40AF',

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
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
        'custom-rose-customers': '#FE88B4',
        'custom-rose-views': '#FE88B4',
        'custom-yellow-prospects': '#FFE07C',
        'custom-orange-franchises': '#FE6744',
        'custom-blue-posts': '#5DC9F4',
        'custom-purple-studio': '#6E52F8',
        'custom-orange-abonnes': '#FF9A3C',
        'custom-green-views': '#60940A',
        'custom-orange-conversion': '#FE6744',

        'custom-green-success': '#4CAF50',
        'custom-red-fun': '#D8324A',
        'custom-red-retard': '#F44336',
        'custom-orange-event': '#F36F21',
        'custom-rose': '#E91E63',
        'custom-purple-pub': '#9B4DCC',
        'custom-red-publication': '#E91E63',
        'custom-green-filming': '#84BC26',
        'custom-orange-event': '#F57C00',
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
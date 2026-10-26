import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/**/*.{astro,js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E53935',
          dark: '#C62828',
          light: '#EF5350',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          light: '#2D2D2D',
        },
        purple: {
          800: '#3B1F6E',
          900: '#2D1754',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      maxWidth: {
        container: '1200px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;

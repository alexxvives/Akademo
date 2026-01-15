import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AKADEMO Color Palette
        // Primary: Clean blacks and whites for UI
        // Accent: Soft green #b0e68e for CTAs and highlights
        brand: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',  // Primary dark
        },
        // Accent green palette based on #b0e68e
        accent: {
          50: '#f4fbf0',
          100: '#e8f7e0',
          200: '#d4efc5',
          300: '#b0e68e',  // Primary accent - the main green
          400: '#9ddb6f',
          500: '#7cc94d',
          600: '#5fb030',
          700: '#4a8c26',
          800: '#3d7321',
          900: '#325e1c',
        },
      },
    },
  },
  plugins: [],
};
export default config;

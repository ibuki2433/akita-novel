import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sepia: {
          50: "#fdf8ee",
          100: "#f9f1de",
          200: "#f4e4bf",
          300: "#ebd09b",
          600: "#8c6b32",
          700: "#6e5227",
          800: "#4f3c1d",
          900: "#382914",
          bg: "#fbf0d9",
          card: "#f4e6c8",
          text: "#433422",
          muted: "#7c6850",
          border: "#e5d6ba",
        },
      },
      fontFamily: {
        sarabun: ["Sarabun", "sans-serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sp-bg": "#080C12",
        "sp-card": "#0E1520",
        "sp-orange": "#F7620A",
        "sp-text": "#F1F5F9",
      },
      maxWidth: {
        "auth": "440px",
      },
    },
  },
  plugins: [],
};
export default config;

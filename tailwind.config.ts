import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#fbfaf7",
        court: "#ed6c2f",
        "court-dark": "#b94d1f",
        sky: "#e7f3f7",
        mint: "#e5f4ea",
        line: "#d9d3ca",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 32, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;

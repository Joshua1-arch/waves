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
        "brand-cream": "#EDE8E3",
        "brand-black": "#1A1A1A",
        "brand-gold": "#C9A96E",
        "brand-white": "#FAF8F5",
        "brand-border": "rgba(26,26,26,0.12)",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      letterSpacing: {
        wider: "0.12em",
        widest: "0.18em",
      },
      transitionDuration: {
        300: "300ms",
        350: "350ms",
        400: "400ms",
        450: "450ms",
      },
      boxShadow: {
        card: "0 24px 64px rgba(26, 26, 26, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

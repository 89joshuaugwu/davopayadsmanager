import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        davo: {
          blue: "#0051CF",
          "blue-light": "#3B7BFF",
          "blue-dark": "#003B9E",
          dark: "#173B8C",
          navy: "#0B1E3F",
          bg: "#F5F7FB",
          card: "#FFFFFF",
          border: "#E2E8F5",
          danger: "#E23744",
          "danger-bg": "#FDECEE",
          success: "#12B76A",
          "success-bg": "#E8F9F0",
          warn: "#F5A623",
          "warn-bg": "#FEF3E2",
          muted: "#5B6785",
        },
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,30,63,0.04), 0 8px 24px -8px rgba(11,30,63,0.08)",
        "card-hover": "0 4px 12px rgba(11,30,63,0.08), 0 16px 32px -12px rgba(11,30,63,0.14)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        axiom: {
          bg: "#0a0a0b",
          surface: "#111113",
          border: "#1e1e22",
          muted: "#6b6b76",
          text: "#e4e4e7",
          accent: "#3b82f6",
          "accent-dim": "#1d4ed8",
          danger: "#ef4444",
          warning: "#f59e0b",
          success: "#22c55e",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

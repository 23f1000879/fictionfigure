/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "690px",
      md: "768px",
      lg: "1000px",
      xl: "1280px",
      "2xl": "1350px",
    },
    extend: {
      colors: {
        background: "#F7F7F5",
        surface: "#FFFFFF",
        foreground: "#111111",
        secondary: "#6B6B6B",
        border: "#E5E5E2",
        muted: "#F0F0ED",
        accent: "#111111",
        gold: {
          DEFAULT: "#D4AF37",
          hover: "#B5932D",
          light: "rgba(212, 175, 55, 0.12)",
        },
        success: "#2E6B44",
        warning: "#B86E00",
        error: "#A83232",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      letterSpacing: {
        widest: "0.2em",
        tightest: "-0.03em",
      },
      borderRadius: {
        "3px": "3px",
        "8px": "8px",
      },
      boxShadow: {
        subtle: "0px 2px 3px 0px rgba(0, 0, 0, 0.12)",
        outlined: "6px 6px 0px -3px rgb(255, 255, 255), 6px 6px rgb(0, 0, 0)",
      },
      transitionDuration: {
        120: "120ms",
        150: "150ms",
        180: "180ms",
      },
      transitionTimingFunction: {
        theme: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
      },
    },
  },
  plugins: [],
};

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
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1440px",
      "3xl": "1920px",
    },
    extend: {
      colors: {
        // Core Cinematic Backgrounds
        background: {
          DEFAULT: "#08090B",
          deep: "#060708",
          charcoal: "#0C0D10",
        },
        // Layered Dark Surfaces
        surface: {
          DEFAULT: "#111318",
          elevated: "#17191F",
          soft: "#1E2027",
          glass: "rgba(17, 19, 24, 0.75)",
          card: "#111318",
          input: "#0D0E12",
        },
        // High-Contrast Foregrounds
        foreground: {
          DEFAULT: "#F7F7F5",
          primary: "#FFFFFF",
          secondary: "#9A9DA5",
          muted: "#6E717A",
          subtle: "#4A4D55",
        },
        // Subtle Low-Contrast Borders
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          light: "rgba(255, 255, 255, 0.14)",
          subtle: "rgba(255, 255, 255, 0.04)",
          gold: "rgba(212, 175, 55, 0.3)",
          glow: "rgba(245, 197, 24, 0.4)",
        },
        // FICTIONFIGURE Brand Gold / Radiant Yellow
        gold: {
          DEFAULT: "#D4AF37",
          bright: "#F5C518",
          radiant: "#FFD700",
          hover: "#E5B50D",
          muted: "#997F29",
          light: "rgba(212, 175, 55, 0.12)",
          glow: "rgba(245, 197, 24, 0.25)",
        },
        // Semantic Palette
        success: {
          DEFAULT: "#10B981",
          soft: "rgba(16, 185, 129, 0.15)",
          border: "rgba(16, 185, 129, 0.3)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "rgba(245, 158, 11, 0.15)",
          border: "rgba(245, 158, 11, 0.3)",
        },
        error: {
          DEFAULT: "#EF4444",
          soft: "rgba(239, 68, 68, 0.15)",
          border: "rgba(239, 68, 68, 0.3)",
        },
        // Curated Accents
        accent: {
          purple: "#8B5CF6",
          cyan: "#06B6D4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      letterSpacing: {
        widest: "0.2em",
        tightest: "-0.03em",
      },
      maxWidth: {
        shell: "1440px",
      },
      height: {
        header: "64px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        cardHover: "0 10px 30px -4px rgba(0, 0, 0, 0.8), 0 0 15px 0 rgba(212, 175, 55, 0.12)",
        goldGlow: "0 0 25px -3px rgba(245, 197, 24, 0.35)",
        goldGlowLg: "0 0 40px -5px rgba(245, 197, 24, 0.45)",
        subtleGlow: "0 0 20px -3px rgba(255, 255, 255, 0.06)",
        surfaceGlow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
        300: "300ms",
      },
      transitionTimingFunction: {
        theme: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

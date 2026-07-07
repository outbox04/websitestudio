/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        canvas: "#0A0F1E", // app background, just below navy
        navy: "#0F172A", // primary surface
        "navy-raised": "#141C30", // raised panel / card
        "navy-soft": "#1B2538", // hover / subtle surface
        surface: "#141C30",
        "surface-elevated": "#1B2538",
        brand: "#4F46E5",

        // Borders & dividers
        border: "rgba(248, 250, 252, 0.07)",
        "border-strong": "rgba(248, 250, 252, 0.14)",

        // Brand accents
        indigo: {
          DEFAULT: "#4F46E5",
          soft: "rgba(79, 70, 229, 0.16)",
        },
        purple: {
          DEFAULT: "#7C3AED",
          soft: "rgba(124, 58, 237, 0.16)",
        },

        // Text
        ink: "#F8FAFC",
        "ink-muted": "#94A3B8",
        "ink-faint": "#5B6B85",

        // Status
        success: { DEFAULT: "#10B981", soft: "rgba(16,185,129,0.14)" },
        warning: { DEFAULT: "#F59E0B", soft: "rgba(245,158,11,0.14)" },
        danger: { DEFAULT: "#F43F5E", soft: "rgba(244,63,94,0.14)" },
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(0, 0, 0, 0.55)",
        glow: "0 0 0 1px rgba(124,58,237,0.25), 0 8px 30px -8px rgba(124,58,237,0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        "canvas-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(79,70,229,0.10) 0%, rgba(10,15,30,0) 70%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

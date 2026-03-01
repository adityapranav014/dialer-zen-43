import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        border: "lab(var(--border) / <alpha-value>)",
        input: "lab(var(--input) / <alpha-value>)",
        ring: "lab(var(--ring) / <alpha-value>)",
        background: "lab(var(--background) / <alpha-value>)",
        foreground: "lab(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "lab(var(--primary) / <alpha-value>)",
          foreground: "lab(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "lab(var(--secondary) / <alpha-value>)",
          foreground: "lab(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "lab(var(--destructive) / <alpha-value>)",
          foreground: "lab(var(--destructive-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "lab(var(--success) / <alpha-value>)",
          foreground: "lab(var(--success-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "lab(var(--muted) / <alpha-value>)",
          foreground: "lab(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "lab(var(--accent) / <alpha-value>)",
          foreground: "lab(var(--accent-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "lab(var(--warning) / <alpha-value>)",
          foreground: "lab(var(--warning-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "lab(var(--popover) / <alpha-value>)",
          foreground: "lab(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "lab(var(--card) / <alpha-value>)",
          foreground: "lab(var(--card-foreground) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "lab(var(--sidebar-background) / <alpha-value>)",
          foreground: "lab(var(--sidebar-foreground) / <alpha-value>)",
          primary: "lab(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "lab(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "lab(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "lab(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "lab(var(--sidebar-border) / <alpha-value>)",
          ring: "lab(var(--sidebar-ring) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "lab(var(--surface) / <alpha-value>)",
          foreground: "lab(var(--surface-foreground) / <alpha-value>)",
        },
        /* Explicit palette tokens */
        zen: {
          dark: "#1B1918",
          warm: "#F5F0EB",
          base: "#F7F6F4",
          white: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "live-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(152 60% 42% / 0.4)" },
          "50%": { boxShadow: "0 0 0 4px hsl(152 60% 42% / 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

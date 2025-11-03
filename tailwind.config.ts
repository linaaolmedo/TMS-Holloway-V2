import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-gray-500',
    'bg-gray-600',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#ef4444",
          hover: "#dc2626",
        },
        navy: {
          DEFAULT: "#0f1729",
          light: "#1a2332",
          lighter: "#232d3f",
        },
      },
    },
  },
  plugins: [],
};
export default config;


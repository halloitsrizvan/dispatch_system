/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#42e5b0",
        "primary-container": "#00c896",
        "on-primary-container": "#004d38",
        secondary: "#bec7d2",
        background: "#0d1117",
        surface: "#161b22",
        "surface-container": "#1a211d",
        "surface-variant": "#2f3632",
        outline: "#85948c",
        "outline-variant": "#3c4a43",
        error: "#ffb4ab",
        text: "#dce4de",
        "text-muted": "#bbcac1",
      },
      fontFamily: {
        technical: ['var(--font-technical)'],
        label: ['var(--font-label)'],
        data: ['var(--font-data)'],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "8px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 200, 150, 0.05)",
      }
    },
  },
  plugins: [],
}

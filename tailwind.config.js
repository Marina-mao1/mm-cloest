/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        milk: "#f8f3eb",
        paper: "#f3e7df",
        wood: "#9a6e56",
        ink: "#2d221f",
        moss: "#7b8973",
        clay: "#bd5366",
        lilac: "#bd8caa",
        blush: "#e8b5b8",
        butter: "#e8c982",
        skywash: "#b8c7c4"
      },
      boxShadow: {
        soft: "0 20px 56px rgba(58, 33, 95, 0.22)",
        sticker: "0 12px 24px rgba(66, 39, 111, 0.16), inset 0 1px 0 rgba(255,255,255,0.9)"
      }
    }
  },
  plugins: []
};

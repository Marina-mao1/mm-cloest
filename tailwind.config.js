/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        milk: "#f0e7ff",
        paper: "#eee4ff",
        wood: "#b69bdf",
        ink: "#2f2147",
        moss: "#8aa394",
        clay: "#d879b0",
        lilac: "#a78bdd",
        blush: "#f0a9d1",
        butter: "#f7d96d",
        skywash: "#9dd7ef"
      },
      boxShadow: {
        soft: "0 20px 56px rgba(58, 33, 95, 0.22)",
        sticker: "0 12px 24px rgba(66, 39, 111, 0.16), inset 0 1px 0 rgba(255,255,255,0.9)"
      }
    }
  },
  plugins: []
};

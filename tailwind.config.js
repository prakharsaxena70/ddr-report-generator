/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#2D2D2D",
        ember: "#F5A623",
        amberdeep: "#E8941A",
        moss: "#8DC63F",
        canvas: "#F6F1E7",
        ink: "#202020",
      },
      boxShadow: {
        card: "0 20px 45px rgba(23, 23, 23, 0.12)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Segoe UI", "Tahoma", "sans-serif"],
      },
      backgroundImage: {
        "brand-grid":
          "linear-gradient(rgba(45,45,45,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(45,45,45,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:"#e8f7ff",100:"#d1efff",200:"#a3dfff",300:"#75cfff",400:"#47bfff",500:"#19afff",
          600:"#0e8ecc",700:"#0a6a99",800:"#074766",900:"#042333"
        }
      },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.35)" }
    },
  },
  plugins: [],
}

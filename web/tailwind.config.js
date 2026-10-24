/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#111318",
          panel: "#1B1E26",
          elevated: "#282D38",
          hover: "#343A47",
          border: "#343741",
        },
        text: {
          primary: "#F4F5F7",
          secondary: "#B6BAC5",
          muted: "#858B99",
        },
        accent: {
          DEFAULT: "#20B8A6",
          hover: "#39C9B8",
        },
        status: {
          live: "#EF6262",
          warning: "#E9B44C",
          success: "#39C98A",
          error: "#EF6262",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
}

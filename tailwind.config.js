/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 40px rgba(16, 24, 40, 0.10)",
      }
    },
  },
  plugins: [],
};

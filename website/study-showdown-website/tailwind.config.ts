import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      textShadow: {
        "border-black":
          "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        jersey: ['"Jersey 10"', "sans-serif"],
        inter: ["Inter", "sans-serif"],

        smallhollows: ['"Small-Hollows"', "sans-serif"],
        phatone: ['"Phatone"', "sans-serif"],
        medabots: ['"Medabots"', "sans-serif"],
        pixel3: ['"Pixel3"', "sans-serif"],
        brkreg: ['"BRKREG"', "sans-serif"],
        brkdotted: ['"BRKDOTTED"', "sans-serif"],
        brkdashed: ['"BRKDASHED"', "sans-serif"],
      },
      animation: {
        "gradient-xy": "gradient-xy 8s ease-in-out infinite",
      },
      keyframes: {
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
    },
    plugins: [require("tailwindcss-textshadow")],
  },
} satisfies Config;

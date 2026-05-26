/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				background: "#000000",
				foreground: "#ffffff",
				card: "#0a0a0f",
				"card-alt": "#141721",
				primary: "#10b981",
				secondary: "#f43f5e",
				muted: "#a1a1aa",
				border: "rgba(255,255,255,0.1)",
			},
		},
	},
	plugins: [],
};

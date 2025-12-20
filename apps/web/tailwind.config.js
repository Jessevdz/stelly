/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // The magic happens here. Tailwind uses the CSS variable injected by React.
                primary: "var(--primary)",
                "primary-fg": "var(--primary-fg)",
            }
        },
    },
    plugins: [],
}
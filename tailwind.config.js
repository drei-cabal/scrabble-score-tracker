/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF6B35',
                secondary: '#4A3F4F',
                background: '#2D2730',
                card: '#3D3540',
                'text-muted': '#B8B4B9',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                'gradient-card': 'linear-gradient(135deg, #4A3F4F 0%, #3D3540 100%)',
            },
            boxShadow: {
                'sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
                'md': '0 4px 16px rgba(0, 0, 0, 0.2)',
                'lg': '0 8px 32px rgba(0, 0, 0, 0.3)',
            },
            borderRadius: {
                'sm': '8px',
                'md': '12px',
                'lg': '16px',
            },
        },
    },
    plugins: [],
}

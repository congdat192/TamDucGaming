/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#C41E3A',
          green: '#228B22',
          gold: '#FFD700',
          snow: '#FFFAFA',
          pine: '#0B3D0B',
        }
      },
      fontFamily: {
        christmas: ['Fredoka One', 'cursive'],
      },
      animation: {
        'snow-fall': 'snowfall 10s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        snowfall: {
          '0%': { transform: 'translateY(-10vh) translateX(0)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) translateX(20px)', opacity: '0.3' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}

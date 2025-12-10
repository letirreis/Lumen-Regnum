/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Primária
        obsidian: '#1A1B23',    // Gunmetal Deep (Background - Lighter for visibility)
        shadow: '#13141A',      // Darker Ink (Cards/Panels - For Contrast)
        
        // Luz Arcana (Accents)
        gold: {
          DEFAULT: '#D4B875',   // Ouro Nebuloso
          dim: '#8A7545',
          glow: '#F0D696'
        },
        violet: {
          DEFAULT: '#6E51A3',   // Violeta Etéreo
          dark: '#4A3275',
          light: '#9176C7'
        },
        silver: '#FFFFFF',      // Pure White for max readability
        
        // Mistério
        twilight: '#2D3F57',    // Azul Crepúsculo
        
        // New LR semantic tokens
        'lr-bg': '#1A1B23',
        'lr-card': '#13141A',
        'lr-accent': '#6E51A3',
        'lr-accent-2': '#D4B875',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
      },
      boxShadow: {
        'arcane': '0 0 15px -3px rgba(110, 81, 163, 0.3)', // Violet glow
        'gold': '0 0 10px -2px rgba(212, 184, 117, 0.2)', // Gold glow
        'lr-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(110, 81, 163, 0.1)',
        'lr-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(110, 81, 163, 0.15)',
      },
      animation: {
        'snow': 'arcaneSnow 20s linear infinite',
      },
      transitionTimingFunction: {
        'lr-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }
  },
  plugins: [],
}

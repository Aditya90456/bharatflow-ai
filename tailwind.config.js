/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        tech: ['Rajdhani', 'Orbitron', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        // Dark theme with neon accents
        background: '#0a0a0f',
        surface: '#0f0f1a',
        surfaceHighlight: '#1a1a2e',
        surfaceGlow: '#16213e',
        border: '#2a2a3e',
        
        // Neon color palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
        },
        
        // Cyber accents
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          DEFAULT: '#06b6d4',
        },
        
        // Indian flag inspired
        saffron: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          DEFAULT: '#ff9933',
        },
        
        // Status colors with glow
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          DEFAULT: '#22c55e',
        },
        warning: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          DEFAULT: '#f59e0b',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          DEFAULT: '#ef4444',
        },
        
        // Text colors
        foreground: '#f1f5f9',
        muted: '#64748b',
        accent: '#06b6d4',
      },
      
      backgroundImage: {
        'cyber-grid': `
          radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)
        `,
        'neural-net': `
          radial-gradient(circle at 20% 80%, rgba(255, 153, 51, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
        `,
        'glow-gradient': 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
      },
      
      boxShadow: {
        'neon': '0 0 20px rgba(6, 182, 212, 0.3)',
        'neon-lg': '0 0 40px rgba(6, 182, 212, 0.4)',
        'glow': '0 0 30px rgba(59, 130, 246, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(6, 182, 212, 0.1)',
        'cyber': '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.1)',
      },
      
      animation: {
        // Enhanced animations
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-vertical': 'scan-vertical 4s linear infinite',
        'scan-horizontal': 'scan-horizontal 6s linear infinite',
        'boot-text': 'boot-text 0.8s steps(40, end)',
        'blink': 'blink 1s step-end infinite',
        'tick-up': 'tick-up 0.6s ease-out',
        'grid-pulse': 'grid-pulse 15s linear infinite',
        'grid-move': 'grid-move 25s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'slide-in': 'slide-in 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'cyber-flicker': 'cyber-flicker 0.1s ease-in-out infinite alternate',
        'data-flow': 'data-flow 3s linear infinite',
        'hologram': 'hologram 4s ease-in-out infinite',
      },
      
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1', 
            filter: 'brightness(1.2) drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.8', 
            filter: 'brightness(1) drop-shadow(0 0 5px rgba(6, 182, 212, 0.3))',
            transform: 'scale(1.02)'
          },
        },
        'scan-vertical': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' }
        },
        'scan-horizontal': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
        },
        'boot-text': {
          '0%': { width: '0', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { width: '100%', opacity: '1' }
        },
        'blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        },
        'tick-up': {
          '0%': { transform: 'translateY(12px) scale(0.8)', opacity: '0' },
          '50%': { transform: 'translateY(-4px) scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'grid-pulse': {
          '0%': { backgroundPosition: '0% 50%', opacity: '0.3' },
          '50%': { backgroundPosition: '100% 50%', opacity: '0.6' },
          '100%': { backgroundPosition: '0% 50%', opacity: '0.3' },
        },
        'grid-move': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '100%': { transform: 'translate(50px, 50px) rotate(0.5deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'cyber-flicker': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.95' },
        },
        'data-flow': {
          '0%': { transform: 'translateX(-100%) scaleX(0)' },
          '50%': { transform: 'translateX(0%) scaleX(1)' },
          '100%': { transform: 'translateX(100%) scaleX(0)' },
        },
        'hologram': {
          '0%, 100%': { 
            opacity: '0.8',
            filter: 'hue-rotate(0deg) brightness(1)',
          },
          '25%': { 
            opacity: '0.9',
            filter: 'hue-rotate(90deg) brightness(1.1)',
          },
          '50%': { 
            opacity: '1',
            filter: 'hue-rotate(180deg) brightness(1.2)',
          },
          '75%': { 
            opacity: '0.9',
            filter: 'hue-rotate(270deg) brightness(1.1)',
          },
        }
      },
      
      backdropBlur: {
        'xs': '2px',
      },
      
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
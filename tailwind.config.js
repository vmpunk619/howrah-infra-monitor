/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050d19',
          900: '#0d1b2a',
          800: '#132233',
          700: '#1c3048',
          600: '#254560',
        },
        gold: {
          200: '#f5e0a0',
          300: '#e8c870',
          400: '#d4aa50',
          DEFAULT: '#c9962e',
          600: '#a97c18',
          700: '#856008',
        },
        saffron: {
          light: '#ffa040',
          DEFAULT: '#e07818',
          dark: '#c05e08',
        },
        terracotta: {
          DEFAULT: '#c04830',
          dark: '#9c3018',
        },
        cream: {
          DEFAULT: '#f5edd8',
          100: '#fdf9f0',
          200: '#f0e4c8',
          700: '#c8b898',
        },
      },
      fontFamily: {
        serif:   ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        bengali: ['"Tiro Bangla"', '"Noto Serif Bengali"', 'serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-up':      'slideUp 0.45s ease-out both',
        'fade-in':       'fadeIn 0.5s ease-out both',
        'scale-in':      'scaleIn 0.25s ease-out both',
        'pulse-dot':     'pulseDot 2s ease-in-out infinite',
        'float':         'floatY 3s ease-in-out infinite',
        'slide-in-left': 'slideInLeft 0.5s ease-out both',
        'marquee':       'marquee 45s linear infinite',
        'fade-up':       'fadeUp 0.7s ease-out both',
      },
      keyframes: {
        slideUp:     { '0%': { opacity:'0', transform:'translateY(18px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        fadeIn:      { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        scaleIn:     { '0%': { opacity:'0', transform:'scale(0.95)' }, '100%': { opacity:'1', transform:'scale(1)' } },
        pulseDot:    { '0%,100%': { opacity:'1', transform:'scale(1)' }, '50%': { opacity:'0.4', transform:'scale(0.85)' } },
        floatY:      { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-7px)' } },
        slideInLeft: { '0%': { opacity:'0', transform:'translateX(-20px)' }, '100%': { opacity:'1', transform:'translateX(0)' } },
        marquee:     { '0%': { transform:'translateX(0)' }, '100%': { transform:'translateX(-50%)' } },
        fadeUp:      { '0%': { opacity:'0', transform:'translateY(32px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        gradientMesh:{ '0%,100%': { backgroundPosition:'0% 50%' }, '50%': { backgroundPosition:'100% 50%' } },
        blobFloat:   { '0%,100%': { borderRadius:'60% 40% 30% 70%/60% 30% 70% 40%' }, '50%': { borderRadius:'30% 60% 70% 40%/50% 60% 30% 60%' } },
        shimmerSlide:{ '0%': { transform:'translateX(-100%)' }, '100%': { transform:'translateX(200%)' } },
        pulseDot2:   { '0%,100%': { opacity:'1', transform:'scale(1)' }, '50%': { opacity:'0.5', transform:'scale(0.85)' } },
      },
      boxShadow: {
        'gold':      '0 0 32px rgba(201,150,46,0.3), 0 4px 20px rgba(201,150,46,0.12)',
        'card':      '0 4px 24px rgba(30,58,138,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover':'0 14px 44px rgba(30,58,138,0.13), 0 4px 8px rgba(0,0,0,0.05)',
        'dark-card': '0 8px 32px rgba(0,0,0,0.4)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.35)',
      },
    },
  },
  plugins: [],
}

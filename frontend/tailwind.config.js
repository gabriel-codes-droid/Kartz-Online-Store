/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kartz: {
          bg: '#030303',
          panel: '#0d0d0f',
          cyan: '#00ffff',
          cyanDim: '#00b8b8',
          mute: '#9da1a5',
          line: '#1a1a1d',
        },
      },
      boxShadow: {
        glow: '0 0 16px rgba(0, 255, 255, 0.35), 0 0 32px rgba(0, 255, 255, 0.12)',
        glowSm: '0 0 6px rgba(0, 255, 255, 0.35)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

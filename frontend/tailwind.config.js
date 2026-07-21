/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kartz: {
          bg: '#0a0908',
          panel: '#15120f',
          amber: '#E8B86A',
          amberDim: '#C9933E',
          cream: '#F5E6CC',
          oxblood: '#8B3A2F',
          mute: '#9b9189',
          line: '#2a2520',
        },
        light: {
          bg: '#faf6ef',
          panel: '#ffffff',
          amber: '#C9933E',
          amberDim: '#8B6914',
          cream: '#faf6ef',
          oxblood: '#7A2E25',
          mute: '#78716c',
          line: '#e7e0d2',
        },
      },
      boxShadow: {
        glow: '0 0 16px rgba(232, 184, 106, 0.32), 0 0 32px rgba(232, 184, 106, 0.10)',
        glowSm: '0 0 6px rgba(232, 184, 106, 0.40)',
        glowLight: '0 0 16px rgba(201, 147, 62, 0.25), 0 0 32px rgba(201, 147, 62, 0.08)',
        glowSmLight: '0 0 6px rgba(201, 147, 62, 0.30)',
        frame: '0 1px 0 0 rgba(232, 184, 106, 0.08), 0 0 0 1px rgba(232, 184, 106, 0.12)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.25em',
      },
    },
  },
  plugins: [],
};

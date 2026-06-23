import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#FFFFFF',
        surface: '#F7F7F5',
        border: '#E5E5E0',
        'text-primary': '#0D0D0B',
        'text-muted': '#6F6F6F',
        accent: {
          DEFAULT: '#1A6B3C',
          light: '#E8F5EE',
        },
        warning: '#D97706',
        danger: '#DC2626',
        road: '#2C2C2A',
        'road-marking': '#FFFFFF',
      },
      animation: {
        'fade-rise':         'fade-rise 0.8s ease-out forwards',
        'fade-rise-delay':   'fade-rise 0.8s 0.2s ease-out both',
        'fade-rise-delay-2': 'fade-rise 0.8s 0.4s ease-out both',
        'fade-rise-delay-3': 'fade-rise 0.8s 0.6s ease-out both',
        'road-scroll':       'road-scroll 2s linear infinite',
        'pulse-glow':        'pulse-glow 2s ease-in-out infinite',
        'dot-bounce':        'dot-bounce 1s ease-in-out infinite',
        'spin-slow':         'spin 3s linear infinite',
        'scale-in':          'scale-in 0.4s ease-out forwards',
        'slide-up':          'slide-up 0.5s ease-out forwards',
        'slide-right':       'slide-right 0.5s ease-out forwards',
        'shimmer':           'shimmer 1.4s ease infinite',
      },
      keyframes: {
        'fade-rise': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'road-scroll': {
          from: { backgroundPosition: '0 0' },
          to:   { backgroundPosition: '0 100px' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0   rgba(26, 107, 60, 0.4)' },
          '50%':       { boxShadow: '0 0 0 12px rgba(26, 107, 60, 0)' },
        },
        'dot-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      scale: {
        '103': '1.03',
      },
    },
  },
  plugins: [forms, typography],
};

export default config;

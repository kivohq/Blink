/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488', // teal-600
          dark: '#0F766E', // teal-700
          foreground: '#ffffff',
          'high-contrast': '#00FF00', // high contrast green
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#020617',
          'high-contrast': '#000000',
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#020617',
          'high-contrast': '#000000',
        },
        border: {
          DEFAULT: '#f1f5f9',
          dark: '#1e293b',
          'high-contrast': '#FFFFFF',
        },
        success: {
          DEFAULT: '#00FF88',
          foreground: '#ffffff',
          'high-contrast': '#00FF00',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
          'high-contrast': '#FFFF00',
        },
        danger: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
          'high-contrast': '#FF0000',
        },
        text: {
          DEFAULT: '#0f172a',
          dark: '#f1f5f9',
          'high-contrast': '#FFFFFF',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'premium': '0 10px 15px -3px rgba(0, 212, 255, 0.2), 0 4px 6px -2px rgba(0, 128, 255, 0.1)',
      }
    },
  },
  plugins: [],
};

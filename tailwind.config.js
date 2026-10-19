/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#F2F2F7',
          card: '#FFFFFF',
          cardDark: '#1C1C1E',
          blue: '#007AFF',
          orange: '#FF9500',
          green: '#34C759',
          red: '#FF3B30',
          yellow: '#FFCC00',
          gray: '#8E8E93',
          border: '#E5E5EA',
          borderDark: '#2C2C2E'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'system-ui',
          'sans-serif'
        ]
      },
      boxShadow: {
        'ios': '0 2px 10px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)',
        'ios-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'sheet': '0 -8px 30px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}

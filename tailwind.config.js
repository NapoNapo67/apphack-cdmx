/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Montserrat', 'sans-serif'] },
      colors: {
        gov: {
          verde:        '#006847',
          'verde-oscuro':'#004d34',
          'verde-claro': '#e8f5ef',
          blanco:       '#FFFFFF',
          rojo:         '#CE1126',
          oro:          '#C8A217',
          gris:         '#F5F5F5',
          'gris-medio': '#E0E0E0',
          'gris-oscuro':'#333333',
          texto:        '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
}


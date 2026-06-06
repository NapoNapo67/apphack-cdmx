/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Montserrat', 'sans-serif'] },
      colors: {
        gov: {
          guinda:        '#7B1F3A',
          'guinda-oscuro':'#5a1529',
          'guinda-claro': '#f5e8ec',
          dorado:        '#B8975A',
          'dorado-claro': '#f7f0e3',
          blanco:        '#FFFFFF',
          gris:          '#F5F5F5',
          'gris-medio':  '#E0E0E0',
          'gris-oscuro': '#333333',
          texto:         '#1A1A1A',
          // aliases
          verde:         '#7B1F3A',
          'verde-oscuro':'#5a1529',
          'verde-claro': '#f5e8ec',
          oro:           '#B8975A',
        },
      },
    },
  },
  plugins: [],
}


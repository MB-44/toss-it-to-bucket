import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'show',
    'dragging',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
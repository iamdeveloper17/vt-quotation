// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };

// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}", // adjust as per your project
//   ],
//   theme: {
//     extend: {},
//   },
//   variants: {
//     extend: {
//       display: ['print'],
//     },
//   },
//   plugins: [],
// }

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // ✅ Enable print variants here
  safelist: [
    'print:hidden',
  ],
}


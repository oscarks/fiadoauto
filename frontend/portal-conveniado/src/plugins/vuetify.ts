import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1f4e79',
          secondary: '#2f6b9a',
          background: '#f6f9fc',
          surface: '#ffffff',
          error: '#c62828',
          warning: '#ef6c00',
          info: '#0288d1',
          success: '#2e7d32',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#4f8cc9',
          secondary: '#6da7db',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

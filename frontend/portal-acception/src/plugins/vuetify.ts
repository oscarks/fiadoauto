import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#0B6E4F',
          secondary: '#1F2937',
          error: '#D64545',
          success: '#2E7D32',
          warning: '#B7791F',
          info: '#1D4ED8',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
});

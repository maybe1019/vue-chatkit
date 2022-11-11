import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// Vuetify
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { mdi } from 'vuetify/iconsets/mdi'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    sets: {
      mdi,
    }
  },
})

app.use(vuetify)


// Pinia
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)


app.mount('#app')
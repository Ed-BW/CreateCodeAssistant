import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

// Import highlight.js for code syntax highlighting
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/github.css'

// Register JavaScript language for syntax highlighting
hljs.registerLanguage('javascript', javascript)

// Create Vue app
const app = createApp(App)

// Add highlight.js directive
app.directive('highlight', {
  mounted(el) {
    const blocks = el.querySelectorAll('pre code')
    blocks.forEach(block => {
      hljs.highlightElement(block)
    })
  },
  updated(el) {
    const blocks = el.querySelectorAll('pre code')
    blocks.forEach(block => {
      hljs.highlightElement(block)
    })
  }
})

// Mount the app
app.mount('#app') 
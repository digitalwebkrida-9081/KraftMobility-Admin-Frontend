import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import store from './store'
import axios from 'axios'
import { authService } from './services/authService'

// Configure Axios global interceptor for 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/login')
      if (!isLoginRequest) {
        authService.logout()
        window.location.hash = '#/login'
        window.location.reload()
      }
    }
    return Promise.reject(error)
  },
)

// Configure fetch global interceptor for 401
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const response = await originalFetch(...args)
  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : args[0] && args[0].url ? args[0].url : ''
    if (!url.includes('/login')) {
      authService.logout()
      window.location.hash = '#/login'
      window.location.reload()
    }
  }
  return response
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)

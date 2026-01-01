import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// API base URL
// - Dev default: hit backend directly (avoids relying on Vite proxy)
// - Prod default: same-origin (keep using relative /api/...)
const envBaseURL = (import.meta.env.VITE_API_URL || '').trim()
axios.defaults.baseURL = envBaseURL.length
  ? envBaseURL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

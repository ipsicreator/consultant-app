import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (!import.meta.env.VITE_POCKETBASE_URL) {
  console.error("Critical: VITE_POCKETBASE_URL is not defined.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

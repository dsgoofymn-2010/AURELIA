import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// fonts ship with the site: no third-party request before the first paint
import '@fontsource/cormorant-garamond/latin-300.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource-variable/manrope/wght.css'
import './lib/tier'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

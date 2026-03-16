import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Single switch for the whole app: set to false to re-enable drag/selection.
const DISABLE_DRAG_AND_SELECTION = true

if (DISABLE_DRAG_AND_SELECTION) {
  document.documentElement.classList.add('no-drag-select')
  document.addEventListener(
    'dragstart',
    (event) => {
      event.preventDefault()
    },
    { capture: true },
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const DISABLE_DRAG_AND_SELECTION = true

if (DISABLE_DRAG_AND_SELECTION) {
  document.documentElement.classList.add('no-drag-select')
  const canDragInTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return false
    }

    return Boolean(target.closest('.allow-drag-select'))
  }

  document.addEventListener(
    'dragstart',
    (event) => {
      if (!canDragInTarget(event.target)) {
        event.preventDefault()
      }
    },
    { capture: true },
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

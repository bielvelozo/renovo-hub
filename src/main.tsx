import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { ouvirInstalacao } from './instalacao/prompt'
import './estilo/tokens.css'
import './estilo/base.css'
import './estilo/componentes.css'
import './estilo/culto.css'

ouvirInstalacao()

registerSW({
  immediate: true,
  onRegisteredSW: (_url, registro) => {
    setInterval(() => registro?.update(), 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

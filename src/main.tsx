import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AgentsProvider } from './context/AgentsContext.tsx'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AgentsProvider>
      <App />
    </AgentsProvider>
  </React.StrictMode>,
)

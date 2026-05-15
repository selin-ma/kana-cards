import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { isSupabaseConfigured } from './lib/supabase'
import App from './App'

registerSW({ immediate: true })

const root = createRoot(document.getElementById('root')!)

if (!isSupabaseConfigured) {
  root.render(
    <StrictMode>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#F5F2EC',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <h1
          style={{
            color: '#6A9070',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            letterSpacing: '0.1em',
          }}
        >
          Kana Jump!
        </h1>
        <p style={{ color: '#C08878', fontSize: '0.9375rem' }}>
          暂时无法访问，请稍后再试。
        </p>
      </div>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

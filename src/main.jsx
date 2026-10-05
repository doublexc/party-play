import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import './index.css'

// GitHub Pages can't send X-Frame-Options / frame-ancestors, so refuse to run inside someone else's frame
if (window.top !== window.self) {
  document.body.textContent = 'ไม่สามารถแสดงหน้านี้ภายในเฟรมได้'
} else {
  createRoot(document.getElementById('root')).render(
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  )
}

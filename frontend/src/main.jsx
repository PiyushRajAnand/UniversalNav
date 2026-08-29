import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 1. Third-party UI framework styles loaded first
import 'bootstrap/dist/css/bootstrap.min.css'

// 2. Custom global theme & base styles loaded second to allow overrides
import './styles/theme.css'
import './index.css'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)


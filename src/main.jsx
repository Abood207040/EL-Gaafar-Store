import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LocalizationProvider } from './i18n/Localization.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocalizationProvider>
          <App />
        </LocalizationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { App as AntdApp } from 'antd'
import { UserProvider } from './context/UserContext'

createRoot(document.getElementById('root')!).render(
  <AntdApp>
    <StrictMode>
      <UserProvider>
        <App />
      </UserProvider>
    </StrictMode>
  </AntdApp>,
)

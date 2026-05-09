import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { router } from './routes/index'
import store from './store'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Auto-reload when new deploy is detected
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || 'dev';
const stored = localStorage.getItem('app_build_time');
if (stored && stored !== BUILD_TIME) {
  localStorage.setItem('app_build_time', BUILD_TIME);
  window.location.reload();
} else {
  localStorage.setItem('app_build_time', BUILD_TIME);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  </StrictMode>,
)

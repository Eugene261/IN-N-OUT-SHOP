import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store/store'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
      <Toaster
        theme="light"
        richColors  // This enables the new color system including destructive
        closeButton
        position="top-center"
        toastOptions={{
          // These will merge with the richColors defaults
          classNames: {
            toast: 'font-sans text-sm',
            title: 'font-bold',
          }
        }}
      />
    </Provider>
  </BrowserRouter>
);

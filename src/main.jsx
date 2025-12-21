import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 1. Import the Provider and your Store
import { Provider } from 'react-redux'
import { store } from './store' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap your App component with the Provider */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<div style="color:red;font-size:24px;padding:40px">ERROR: #root not found</div>'
} else {
  createRoot(root).render(<App />)
}

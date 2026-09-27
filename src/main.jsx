import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

/* Note: StrictMode is intentionally omitted. @react-three/fiber v9 creates
   its own internal root per <Canvas>; StrictMode's synchronous
   double-mount/unmount races with it and produces console errors. */
createRoot(document.getElementById('root')).render(<App />)

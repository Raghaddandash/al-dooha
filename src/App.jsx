import { useState, useEffect } from 'react'
import MenuPage from './MenuPage.jsx'
import AdminPage from './AdminPage.jsx'

export default function App() {
  const [route, setRoute] = useState(window.location.hash === '#admin' ? 'admin' : 'menu')

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash === '#admin' ? 'admin' : 'menu')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route === 'admin' ? <AdminPage /> : <MenuPage />
}

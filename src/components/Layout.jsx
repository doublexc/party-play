import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import './Layout.css'

export default function Layout() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return <p className="page muted">กำลังโหลด...</p>

  // First visit: no user yet -> must set up contact info first
  if (!user && pathname !== '/settings') return <Navigate to="/settings" replace />

  return (
    <>
      <header className="topbar">
        <div className="topbar__in">
          <Link to="/" className="brand">Party Play</Link>
          {user && (
            <nav>
              <NavLink to="/" end>บอร์ด</NavLink>
              <NavLink to="/my">นัดของฉัน</NavLink>
              <NavLink to="/settings">ช่องทางติดต่อ</NavLink>
            </nav>
          )}
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </>
  )
}

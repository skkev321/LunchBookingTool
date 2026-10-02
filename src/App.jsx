import { useState, useEffect } from 'react'
import { supabase, authService, userService } from './lib/supabase'
import Login from './components/Auth/Login'
import EmployeeDashboard from './components/Employee/Dashboard'
import FacilitiesDashboard from './components/Facilities/Dashboard'
import ProviderDashboard from './components/Provider/Dashboard'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { user: authUser } = await authService.getCurrentUser()
      if (authUser) {
        const { data } = await userService.getUserProfile(authUser.id)
        if (data) setUser(data)
      }
      setLoading(false)
    }

    checkAuth()

    // Real-time auth state listener (skipped in demo mode — no realtime connection)
    if (!isDemoMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          userService.getUserProfile(session.user.id).then(({ data }) => {
            if (data) setUser(data)
          })
        } else {
          setUser(null)
        }
      })
      return () => subscription?.unsubscribe()
    }
  }, [])

  const handleLogin = (userProfile) => setUser(userProfile)

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login onSuccess={handleLogin} />
  }

  if (user.role === 'employee') {
    return <EmployeeDashboard user={user} onLogout={handleLogout} />
  }

  if (user.role === 'facilities') {
    return <FacilitiesDashboard user={user} onLogout={handleLogout} />
  }

  if (user.role === 'provider') {
    return <ProviderDashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Access Denied</h1>
        <p>Your account role is not recognized. Please contact your administrator.</p>
        <button onClick={handleLogout} className="btn btn-secondary btn-block">
          Sign Out
        </button>
      </div>
    </div>
  )
}

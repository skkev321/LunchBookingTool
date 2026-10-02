import { useState } from 'react'
import { authService, userService } from '../../lib/supabase'
import { Mail, Lock, AlertCircle } from 'lucide-react'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await authService.signIn(email, password)
      
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Get user profile to determine role
      const { data: userProfile, error: profileError } = await userService.getUserProfile(data.user.id)
      
      if (profileError) {
        setError('Failed to load user profile')
        setLoading(false)
        return
      }

      onSuccess(userProfile)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Lunch Booking</h1>
        <p>Sign in to your account</p>

        {isDemoMode && (
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem',
            padding: '1rem', marginBottom: '1rem', fontSize: '0.8rem'
          }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0369a1' }}>🎭 Demo Mode — use any below (password: <code>demo</code>)</p>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {[
                { label: '👤 Employee',   email: 'alice@ifs.com' },
                { label: '🏢 Facilities', email: 'facilities@ifs.com' },
                { label: '🍱 Provider',   email: 'provider@ifs.com' },
              ].map(({ label, email: demoEmail }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => { setEmail(demoEmail); setPassword('demo') }}
                  style={{
                    textAlign: 'left', background: 'white', border: '1px solid #bae6fd',
                    borderRadius: '0.375rem', padding: '0.4rem 0.75rem', cursor: 'pointer',
                    fontSize: '0.8rem', color: '#0369a1'
                  }}
                >
                  {label} — <span style={{ fontFamily: 'monospace' }}>{demoEmail}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-light)' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-light)' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Don't have an account? <a href="#" className="auth-link">Contact your administrator</a>
        </p>
      </div>
    </div>
  )
}

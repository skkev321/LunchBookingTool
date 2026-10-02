import { LogOut } from 'lucide-react'
import Scanner from './Scanner'

export default function ProviderDashboard({ user, onLogout }) {
  return (
    <div className="sidebar-layout">
      <div className="sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h2>Lunch Provider</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            {user.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            Fulfillment Scanner
          </p>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="main-content">
        <h1>QR Code Scanner</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          Scan employee QR codes to verify and record lunch orders.
        </p>
        <Scanner />
      </div>
    </div>
  )
}

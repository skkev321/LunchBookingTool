import { useState } from 'react'
import { LogOut } from 'lucide-react'
import BookingsView from './BookingsView'
import VendorManager from './VendorManager'
import MenuManager from './MenuManager'
import ScanLog from './ScanLog'
import TeamManager from './TeamManager'

export default function FacilitiesDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('bookings')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="sidebar-layout">
      <div className="sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h2>Lunch Manager</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            {user.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            Facilities Team
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'bookings' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'bookings' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            📋 Bookings
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'vendors' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'vendors' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'vendors' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            🏪 Vendors
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'menu' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'menu' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'menu' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            🍽️ Menu Manager
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'scans' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'scans' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'scans' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            📊 Scan Log
          </button>
          <button
            onClick={() => setActiveTab('team')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'team' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'team' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'team' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            👥 Team Members
          </button>
        </nav>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'bookings' && (
          <div>
            <h1>Lunch Bookings</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              View all lunch bookings for the week.
            </p>
            <BookingsView refreshKey={refreshKey} />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div>
            <h1>Vendors</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Add or remove the lunch vendors who supply meals. Assign a vendor to each week's menu in Menu Manager.
            </p>
            <VendorManager onSuccess={() => setRefreshKey(prev => prev + 1)} />
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <h1>Menu Management</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Add or update menus for upcoming days.
            </p>
            <MenuManager onSuccess={() => setRefreshKey(prev => prev + 1)} />
          </div>
        )}

        {activeTab === 'scans' && (
          <div>
            <h1>Scan Log & Fulfillment</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Track lunch provider scans and identify no-shows.
            </p>
            <ScanLog refreshKey={refreshKey} />
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            <h1>Team Members</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Manage your facilities team members by adding employees from the system.
            </p>
            <TeamManager />
          </div>
        )}
      </div>
    </div>
  )
}

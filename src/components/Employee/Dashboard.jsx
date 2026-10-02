import { useState, useEffect } from 'react'
import { supabase, bookingService } from '../../lib/supabase'
import { LogOut } from 'lucide-react'
import BookingList from './BookingList'
import BookingForm from './BookingForm'
import QRCode from './QRCode'

export default function EmployeeDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('book')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadBookings()
  }, [refreshKey])

  const loadBookings = async () => {
    setLoading(true)
    const { data, error } = await bookingService.getBookingsByUser(user.id)
    if (!error) {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const handleBookingSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('myBookings')
  }

  return (
    <div className="sidebar-layout">
      <div className="sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h2>Lunch Booking</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            {user.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            {user.email}
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('book')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'book' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'book' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'book' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            📅 Book Lunch
          </button>
          <button
            onClick={() => setActiveTab('myBookings')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'myBookings' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'myBookings' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'myBookings' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            📋 My Bookings
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            style={{
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'qr' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'qr' ? 'var(--primary)' : 'var(--text)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: activeTab === 'qr' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            🔲 My QR Code
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
        {activeTab === 'book' && (
          <div>
            <h1>Book Your Lunch</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Select dates and your protein preference. Cutoff time is 6pm the day before.
            </p>
            <BookingForm user={user} onSuccess={handleBookingSuccess} />
          </div>
        )}

        {activeTab === 'myBookings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1>My Bookings</h1>
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="btn btn-secondary"
              >
                🔄 Refresh
              </button>
            </div>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>No bookings yet. Start by booking your lunch!</p>
              </div>
            ) : (
              <BookingList bookings={bookings} user={user} onCancel={() => setRefreshKey(prev => prev + 1)} />
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div>
            <h1>Your QR Code</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Share this QR code with the lunch provider to verify your order.
            </p>
            <QRCode email={user.email} />
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { bookingService } from '../../lib/supabase'
import { formatDateDisplay, getProteinColor } from '../../lib/utils'
import { Trash2, AlertCircle } from 'lucide-react'

export default function BookingList({ bookings, user, onCancel }) {
  const [cancelling, setCancelling] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)

  const handleCancelClick = (bookingId) => {
    setShowConfirm(bookingId)
  }

  const confirmCancel = async (bookingId) => {
    setCancelling(bookingId)
    try {
      const { error } = await bookingService.cancelBooking(bookingId)
      if (error) throw error
      onCancel()
    } catch (err) {
      alert('Failed to cancel booking: ' + err.message)
    } finally {
      setCancelling(null)
      setShowConfirm(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      booked: '#2563eb',
      scanned: '#16a34a',
      cancelled: '#dc2626',
      'no-show': '#ea580c'
    }
    return colors[status] || '#64748b'
  }

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Group bookings by status
  const activeBookings = bookings.filter(b => b.status === 'booked')
  const fulfilledBookings = bookings.filter(b => b.status === 'scanned')
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')

  return (
    <div>
      {activeBookings.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
            Active Bookings ({activeBookings.length})
          </h3>
          <div className="grid grid-2">
            {activeBookings.map(booking => (
              <div key={booking.id} className="card">
                <div className="card-header">
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {formatDateDisplay(booking.date)}
                    </h4>
                    <div
                      className="badge"
                      style={{
                        background: '#dbeafe',
                        color: '#0c4a6e',
                        display: 'inline-block'
                      }}
                    >
                      Booked
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelClick(booking.id)}
                    className="btn btn-danger btn-small"
                    disabled={cancelling === booking.id}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                    Protein Choice:
                  </p>
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--bg)',
                      borderRadius: '0.375rem',
                      borderLeft: `3px solid ${getProteinColor(booking.protein)}`
                    }}
                  >
                    <strong>{booking.protein}</strong>
                  </div>
                </div>

                {showConfirm === booking.id && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} />
                    <div>
                      <p style={{ marginBottom: '0.5rem' }}>Cancel this booking?</p>
                      <div className="flex gap-1" style={{ marginTop: '0.75rem' }}>
                        <button
                          onClick={() => confirmCancel(booking.id)}
                          className="btn btn-danger btn-small"
                          disabled={cancelling === booking.id}
                        >
                          {cancelling === booking.id ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="btn btn-secondary btn-small"
                          disabled={cancelling === booking.id}
                        >
                          No, Keep it
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {fulfilledBookings.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>
            Fulfilled ({fulfilledBookings.length})
          </h3>
          <div className="grid grid-2">
            {fulfilledBookings.map(booking => (
              <div key={booking.id} className="card" style={{ opacity: 0.8 }}>
                <div className="card-header">
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {formatDateDisplay(booking.date)}
                    </h4>
                    <div
                      className="badge"
                      style={{
                        background: '#dcfce7',
                        color: '#166534'
                      }}
                    >
                      ✓ Scanned
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  <strong>Protein:</strong> {booking.protein}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelledBookings.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>
            Cancelled ({cancelledBookings.length})
          </h3>
          <div className="grid grid-2">
            {cancelledBookings.map(booking => (
              <div key={booking.id} className="card" style={{ opacity: 0.6 }}>
                <div className="card-header">
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {formatDateDisplay(booking.date)}
                    </h4>
                    <div
                      className="badge"
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b'
                      }}
                    >
                      Cancelled
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  <strong>Protein:</strong> {booking.protein}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="empty-state">
          <p>No bookings to display</p>
        </div>
      )}
    </div>
  )
}

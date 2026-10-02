import { useState, useEffect } from 'react'
import { bookingService } from '../../lib/supabase'
import { getCurrentWeekDates, formatDateDisplay, getProteinColor } from '../../lib/utils'
import { DownloadCloud } from 'lucide-react'

export default function BookingsView({ refreshKey }) {
  const [bookings, setBookings] = useState({})
  const [loading, setLoading] = useState(true)
  const [weekDates, setWeekDates] = useState([])

  useEffect(() => {
    loadBookings()
  }, [refreshKey])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const dates = getCurrentWeekDates()
      setWeekDates(dates)

      const bookingsByDate = {}
      for (const date of dates) {
        const { data } = await bookingService.getBookingsByDate(date)
        bookingsByDate[date] = data || []
      }
      setBookings(bookingsByDate)
    } catch (err) {
      console.error('Failed to load bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const getProteinCount = (date) => {
    const dayBookings = bookings[date] || []
    const counts = {}
    dayBookings.forEach(booking => {
      counts[booking.protein] = (counts[booking.protein] || 0) + 1
    })
    return counts
  }

  const exportCSV = () => {
    let csv = 'Date,Employee Name,Email,Protein,Status\n'
    
    weekDates.forEach(date => {
      const dayBookings = bookings[date] || []
      dayBookings.forEach(booking => {
        csv += `"${formatDateDisplay(date)}","${booking.users.name}","${booking.users.email}","${booking.protein}","${booking.status}"\n`
      })
    })

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getTotalBookings = () => {
    return weekDates.reduce((sum, date) => sum + (bookings[date] || []).length, 0)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Total Bookings</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {getTotalBookings()}
          </p>
        </div>
        <div className="card">
          <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Days This Week</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
            {weekDates.length}
          </p>
        </div>
        <div className="card">
          <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Avg. Per Day</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {Math.round(getTotalBookings() / weekDates.length)}
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={exportCSV} className="btn btn-secondary">
          <DownloadCloud size={18} />
          Export to CSV
        </button>
      </div>

      {/* Daily Breakdown */}
      <div className="grid">
        {weekDates.map(date => {
          const dayBookings = bookings[date] || []
          const proteinCounts = getProteinCount(date)
          const totalProteins = Object.values(proteinCounts).reduce((a, b) => a + b, 0)

          return (
            <div key={date} className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                {formatDateDisplay(date)}
              </h3>

              {/* Protein Summary */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                  <strong>Total Bookings: {totalProteins}</strong>
                </p>
                <div className="flex" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(proteinCounts).map(([protein, count]) => (
                    <div
                      key={protein}
                      style={{
                        padding: '0.5rem 1rem',
                        background: getProteinColor(protein),
                        color: 'white',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {protein}: {count}
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee List */}
              {dayBookings.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    {dayBookings.map((booking, idx) => (
                      <div
                        key={booking.id}
                        style={{
                          padding: '0.75rem',
                          borderBottom: idx < dayBookings.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                            {booking.users.name}
                          </p>
                          <p style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                            {booking.users.email}
                          </p>
                        </div>
                        <div
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: getProteinColor(booking.protein),
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          {booking.protein}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  No bookings for this date
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

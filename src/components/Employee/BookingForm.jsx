import { useState, useEffect } from 'react'
import { bookingService, menuService } from '../../lib/supabase'
import { getAvailableBookingDates, formatDateDisplay } from '../../lib/utils'
import { AlertCircle, Check } from 'lucide-react'

const PROTEINS = ['Chicken', 'Fish', 'Egg', 'Veg']

export default function BookingForm({ user, onSuccess }) {
  const [selectedDates, setSelectedDates] = useState({})
  const [proteins, setProteins] = useState({})
  const [menus, setMenus] = useState({})
  const [availableDates, setAvailableDates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingBookings, setExistingBookings] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get available dates
      const dates = getAvailableBookingDates()
      setAvailableDates(dates)

      // Load menus for these dates
      if (dates.length > 0) {
        const menuMap = {}
        for (const date of dates) {
          const { data } = await menuService.getMenuByDate(date)
          if (data) {
            menuMap[date] = data.content
          }
        }
        setMenus(menuMap)
      }

      // Load existing bookings
      const { data: bookings } = await bookingService.getBookingsByUser(user.id)
      if (bookings) {
        const bookingMap = {}
        bookings.forEach(booking => {
          if (booking.status !== 'cancelled') {
            bookingMap[booking.date] = true
          }
        })
        setExistingBookings(bookingMap)
      }
    } catch (err) {
      setError('Failed to load booking data')
    }
  }

  const handleDateToggle = (date) => {
    if (existingBookings[date]) return

    setSelectedDates(prev => {
      const updated = { ...prev }
      if (updated[date]) {
        delete updated[date]
        delete proteins[date]
      } else {
        updated[date] = true
        if (!proteins[date]) {
          setProteins(p => ({ ...p, [date]: 'Chicken' }))
        }
      }
      return updated
    })
  }

  const handleProteinChange = (date, protein) => {
    setProteins(prev => ({ ...prev, [date]: protein }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const selectedDateList = Object.keys(selectedDates)
    if (selectedDateList.length === 0) {
      setError('Please select at least one date')
      setLoading(false)
      return
    }

    try {
      for (const date of selectedDateList) {
        const protein = proteins[date] || 'Chicken'
        const { error: bookError } = await bookingService.createBooking(user.id, date, protein)
        if (bookError) throw bookError
      }

      setSuccess(`✓ Booked for ${selectedDateList.length} day(s)!`)
      setSelectedDates({})
      setProteins({})
      
      // Reload existing bookings
      setTimeout(() => {
        loadData()
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Select Dates</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
            Click on dates to select. Grayed out dates have already been booked or cutoff has passed.
          </p>

          <div className="date-grid">
            {availableDates.map(date => (
              <div
                key={date}
                className={`date-card ${selectedDates[date] ? 'selected' : ''} ${existingBookings[date] ? 'disabled' : ''}`}
                onClick={() => !existingBookings[date] && handleDateToggle(date)}
              >
                <div className="date-card-date">
                  {new Date(date).getDate()}
                </div>
                <div className="date-card-day">
                  {formatDateDisplay(date)}
                </div>
                {existingBookings[date] && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--warning)' }}>
                    Booked
                  </div>
                )}
              </div>
            ))}
          </div>

          {availableDates.length === 0 && (
            <div className="empty-state">
              <p>No available dates for booking. Check back later!</p>
            </div>
          )}
        </div>

        {Object.keys(selectedDates).length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Select Protein Preference</h3>

            {Object.keys(selectedDates).map(date => (
              <div
                key={date}
                className="card"
                style={{ marginBottom: '1.5rem', background: 'var(--bg)' }}
              >
                <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                  {formatDateDisplay(date)}
                </h4>

                {menus[date] && (
                  <div
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-white)',
                      borderRadius: '0.375rem',
                      marginBottom: '1rem',
                      borderLeft: '3px solid var(--primary)'
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Today's Menu:
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      {menus[date]}
                    </p>
                  </div>
                )}

                <div className="radio-group">
                  {PROTEINS.map(protein => (
                    <label key={protein} className="radio-item" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`protein-${date}`}
                        value={protein}
                        checked={proteins[date] === protein}
                        onChange={(e) => handleProteinChange(date, e.target.value)}
                      />
                      <span>{protein}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || Object.keys(selectedDates).length === 0}
          className="btn btn-success btn-block"
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
          {loading ? 'Booking...' : `Book ${Object.keys(selectedDates).length} Day(s)`}
        </button>
      </form>
    </div>
  )
}

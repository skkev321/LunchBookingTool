import { useState, useEffect } from 'react'
import { scanService, bookingService } from '../../lib/supabase'
import { getCurrentWeekDates, formatDateTimeDisplay, formatDateDisplay } from '../../lib/utils'
import { DownloadCloud } from 'lucide-react'

export default function ScanLog({ refreshKey }) {
  const [scans, setScans] = useState([])
  const [bookings, setBookings] = useState({})
  const [loading, setLoading] = useState(true)
  const [filterOutcome, setFilterOutcome] = useState('all')
  const [weekDates, setWeekDates] = useState([])

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const loadData = async () => {
    setLoading(true)
    try {
      const dates = getCurrentWeekDates()
      setWeekDates(dates)

      // Load scans for the week
      const startDate = new Date(dates[0]).toISOString()
      const endDate = new Date(dates[dates.length - 1])
      endDate.setHours(23, 59, 59, 999)
      
      const { data: scansData } = await scanService.getScanLog(startDate, endDate.toISOString())
      setScans(scansData || [])

      // Load all bookings for reference
      const { data: bookingsData } = await bookingService.getBookingsForWeek(dates[0], dates[dates.length - 1])
      const bookingMap = {}
      bookingsData?.forEach(b => {
        bookingMap[b.id] = b
      })
      setBookings(bookingMap)
    } catch (err) {
      console.error('Failed to load scan log:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    const stats = {
      total: scans.length,
      fulfilled: scans.filter(s => s.outcome === 'fulfilled').length,
      'not-requested': scans.filter(s => s.outcome === 'not-requested').length,
      'duplicate': scans.filter(s => s.outcome === 'duplicate').length
    }
    return stats
  }

  const filteredScans = filterOutcome === 'all' 
    ? scans 
    : scans.filter(s => s.outcome === filterOutcome)

  const getOutcomeColor = (outcome) => {
    const colors = {
      fulfilled: '#16a34a',
      'not-requested': '#dc2626',
      'duplicate': '#ea580c'
    }
    return colors[outcome] || '#64748b'
  }

  const getOutcomeLabel = (outcome) => {
    const labels = {
      fulfilled: '✓ Fulfilled',
      'not-requested': '✗ Not Requested',
      'duplicate': '⚠ Duplicate Scan'
    }
    return labels[outcome] || outcome
  }

  const exportCSV = () => {
    let csv = 'Timestamp,Employee Email,Protein,Date Booked,Outcome,Notes\n'
    
    filteredScans.forEach(scan => {
      const booking = bookings[scan.booking_id]
      csv += `"${formatDateTimeDisplay(scan.timestamp)}","${scan.email}","${booking?.protein || 'N/A'}","${booking?.date || 'N/A'}","${scan.outcome}","${scan.notes || ''}"\n`
    })

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = `scan-log-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Total Scans</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {stats.total}
          </p>
        </div>
        <div className="card">
          <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Fulfilled</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {stats.fulfilled}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            {stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0}% fulfillment
          </p>
        </div>
        <div className="card">
          <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Issues</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
            {stats['not-requested'] + stats['duplicate']}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            {stats['not-requested']} not requested, {stats['duplicate']} duplicates
          </p>
        </div>
      </div>

      {/* Filter and Export */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}
        >
          <option value="all">All Outcomes</option>
          <option value="fulfilled">✓ Fulfilled</option>
          <option value="not-requested">✗ Not Requested</option>
          <option value="duplicate">⚠ Duplicate Scans</option>
        </select>

        <button onClick={exportCSV} className="btn btn-secondary">
          <DownloadCloud size={18} />
          Export CSV
        </button>
      </div>

      {/* Scan List */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>
          {filterOutcome === 'all' ? 'All Scans' : `${getOutcomeLabel(filterOutcome)}`}
          {' '}
          <span style={{ fontSize: '1rem', color: 'var(--text-light)', fontWeight: '400' }}>
            ({filteredScans.length})
          </span>
        </h3>

        {filteredScans.length === 0 ? (
          <div className="empty-state">
            <p>No scans recorded for this filter</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Employee Email</th>
                  <th>Protein</th>
                  <th>Date Booked</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => {
                  const booking = bookings[scan.booking_id]
                  return (
                    <tr key={scan.id}>
                      <td style={{ fontSize: '0.85rem' }}>
                        {formatDateTimeDisplay(scan.timestamp)}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {scan.email}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f0f0f0',
                          borderRadius: '0.25rem',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          {booking?.protein || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {booking ? formatDateDisplay(booking.date) : '—'}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: getOutcomeColor(scan.outcome),
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getOutcomeLabel(scan.outcome)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {scan.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

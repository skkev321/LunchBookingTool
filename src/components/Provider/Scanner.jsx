import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { bookingService, scanService, userService } from '../../lib/supabase'
import { formatDateDisplay } from '../../lib/utils'
import { AlertCircle, CheckCircle, XCircle, Camera } from 'lucide-react'

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null)
  const [email, setEmail] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const scannerRef = useRef(null)
  const htmlRef = useRef(null)

  useEffect(() => {
    if (!scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    )

    scanner.render(
      (decodedText) => {
        // QR code scanned successfully
        setScanResult(null)
        setError('')
        handleScan(decodedText.trim())
        scanner.clear()
      },
      (error) => {
        // Only log critical errors, not scanning errors
        if (error && error.includes('NotAllowedError')) {
          setError('❌ Camera permission denied. Please allow camera access and refresh.')
          setCameraReady(false)
        }
      }
    )

    scannerRef.current = scanner
    setCameraReady(true)

    return () => {
      if (scannerRef.current) {
        try {
          scanner.clear()
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }
  }, [])

  const handleScan = async (scannedEmail) => {
    setLoading(true)
    setScanResult(null)
    setError('')

    try {
      // Get employee details
      const { data: userData, error: userError } = await userService.getUserByEmail(scannedEmail)
      if (userError || !userData) {
        setScanResult({
          outcome: 'error',
          message: 'Employee not found in system'
        })
        setLoading(false)
        return
      }

      // Check for booking today
      const today = new Date().toISOString().split('T')[0]
      const { data: booking, error: bookingError } = await bookingService.getBookingByUserAndDate(userData.id, today)

      if (bookingError && bookingError.code !== 'PGRST116') {
        throw bookingError
      }

      if (!booking) {
        // No booking for today
        await scanService.recordScan(scannedEmail, null, 'not-requested')
        setScanResult({
          outcome: 'not-requested',
          message: 'Lunch Not Requested',
          email: scannedEmail,
          protein: null,
          date: today,
          employeeName: userData.name
        })
      } else {
        // Booking exists, check for duplicate scans
        const { data: existingScans } = await scanService.getScansByBooking(booking.id)
        const recentScans = existingScans?.filter(scan => {
          const scanTime = new Date(scan.timestamp)
          const now = new Date()
          return (now.getTime() - scanTime.getTime()) < (5 * 60 * 1000) // 5 minutes
        }) || []

        const outcome = recentScans.length > 0 ? 'duplicate' : 'fulfilled'
        
        await scanService.recordScan(scannedEmail, booking.id, outcome)

        if (outcome === 'duplicate') {
          setScanResult({
            outcome: 'duplicate',
            message: 'Duplicate Scan!',
            email: scannedEmail,
            protein: booking.protein,
            date: booking.date,
            employeeName: userData.name,
            warning: 'This order was already scanned recently'
          })
        } else {
          setScanResult({
            outcome: 'fulfilled',
            message: `Lunch Requested - ${booking.protein}`,
            email: scannedEmail,
            protein: booking.protein,
            date: booking.date,
            employeeName: userData.name
          })
        }
      }

      // Restart scanner after a delay
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.render(
            (decodedText) => {
              setScanResult(null)
              setError('')
              handleScan(decodedText.trim())
              scannerRef.current?.clear()
            },
            () => {}
          )
        }
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to process scan')
    } finally {
      setLoading(false)
    }
  }

  const handleManualScan = async (e) => {
    e.preventDefault()
    if (!manualEmail.trim()) {
      setError('Please enter an email address')
      return
    }
    setManualEmail('')
    await handleScan(manualEmail)
  }

  return (
    <div className="scanner-container">
      {/* Scanner */}
      <div
        id="qr-reader"
        style={{
          width: '100%',
          marginBottom: '2rem',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        ref={htmlRef}
      >
        {!cameraReady && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
            <Camera size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Initializing camera...</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Please allow camera access when prompted
            </p>
          </div>
        )}
      </div>

      {/* Camera Permission Error */}
      {error && error.includes('Camera permission') && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <div>
            <span>{error}</span>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Use the email fallback below instead.
            </p>
          </div>
        </div>
      )}

      {/* Manual Entry Fallback */}
      <div className="card" style={{ marginBottom: '2rem', background: '#f9fafb', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
          Or Type Email Address
        </h3>
        <form onSubmit={handleManualScan}>
          <div className="form-group">
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="employee@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={!manualEmail.trim()}
            className="btn btn-primary btn-block"
          >
            Process
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div
          className="scan-result"
          style={{
            background:
              scanResult.outcome === 'fulfilled'
                ? '#dcfce7'
                : scanResult.outcome === 'not-requested'
                ? '#fee2e2'
                : '#fef3c7',
            color:
              scanResult.outcome === 'fulfilled'
                ? '#166534'
                : scanResult.outcome === 'not-requested'
                ? '#991b1b'
                : '#92400e',
            border:
              scanResult.outcome === 'fulfilled'
                ? '2px solid #16a34a'
                : scanResult.outcome === 'not-requested'
                ? '2px solid #dc2626'
                : '2px solid #ea580c'
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            {scanResult.outcome === 'fulfilled' && <CheckCircle size={48} style={{ margin: '0 auto 1rem' }} />}
            {scanResult.outcome === 'not-requested' && <XCircle size={48} style={{ margin: '0 auto 1rem' }} />}
            {scanResult.outcome === 'duplicate' && <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />}
            {scanResult.outcome === 'error' && <XCircle size={48} style={{ margin: '0 auto 1rem' }} />}
          </div>

          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'inherit' }}>
            {scanResult.message}
          </h2>

          {scanResult.employeeName && (
            <p style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              <strong>{scanResult.employeeName}</strong>
            </p>
          )}

          {scanResult.email && (
            <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', opacity: 0.9 }}>
              {scanResult.email}
            </p>
          )}

          {scanResult.protein && (
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '0.375rem',
                marginBottom: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <strong>Protein:</strong> {scanResult.protein}
            </div>
          )}

          {scanResult.warning && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: '500', marginBottom: 0 }}>
              ⚠️ {scanResult.warning}
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      {!scanResult && (
        <div className="card" style={{ background: 'var(--bg)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📱 Instructions</h3>
          <ol style={{ marginLeft: '1.5rem', color: 'var(--text-light)', fontSize: '0.875rem', gap: '0.75rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Point camera at employee's QR code</strong> to scan automatically
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Or <strong>type their email</strong> in the fallback field if QR won't scan
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              System checks if they have a booking for today
            </li>
            <li>
              Result shows <strong>Lunch Requested (+ protein)</strong> or{' '}
              <strong>Lunch Not Requested</strong>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}

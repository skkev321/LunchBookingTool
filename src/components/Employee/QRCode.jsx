import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Copy } from 'lucide-react'

export default function QRCodeDisplay({ email }) {
  const qrRef = useRef()

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas')
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${email}-qr-code.png`
    link.click()
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email)
    alert('Email copied to clipboard!')
  }

  return (
    <div className="card">
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          This QR code encodes your email address. The lunch provider will scan this to verify your order.
        </p>

        <div className="qr-container" ref={qrRef}>
          <QRCodeCanvas
            value={email}
            size={256}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#1e293b"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button onClick={handleDownload} className="btn btn-primary btn-block">
          <Download size={18} />
          Download
        </button>
        <button onClick={handleCopyEmail} className="btn btn-secondary btn-block">
          <Copy size={18} />
          Copy Email
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg)', borderRadius: '0.375rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
          <strong>Fallback Email:</strong>
        </p>
        <p style={{ fontSize: '1rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {email}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
          If the QR code won't scan, provider can type this email manually.
        </p>
      </div>
    </div>
  )
}

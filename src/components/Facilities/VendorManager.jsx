import { useState, useEffect } from 'react'
import { vendorService } from '../../lib/supabase'
import { Store, Plus, Trash2, AlertCircle, Check, Copy } from 'lucide-react'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export default function VendorManager({ onSuccess }) {
  const [vendors, setVendors] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [removing, setRemoving] = useState(null)
  const [newCredentials, setNewCredentials] = useState(null)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    const { data } = await vendorService.getVendors()
    setVendors(data || [])
  }

  const handleAddVendor = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please enter a vendor name and email')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setNewCredentials(null)

    try {
      const { data, error: addError } = await vendorService.addVendor(name.trim(), email.trim())
      if (addError) throw addError

      if (data?.tempPassword) {
        setNewCredentials({ name: data.name, email: data.email, password: data.tempPassword })
      } else {
        setSuccess(`✓ ${name} added as a vendor`)
        setTimeout(() => setSuccess(''), 2000)
      }
      setName('')
      setEmail('')
      await loadVendors()
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Failed to add vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!newCredentials) return
    navigator.clipboard.writeText(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`)
  }

  const handleRemoveVendor = async (vendorId, vendorName) => {
    if (!window.confirm(`Remove ${vendorName} as a vendor? They will lose login access.`)) return

    setRemoving(vendorId)
    try {
      const { error: removeError } = await vendorService.removeVendor(vendorId)
      if (removeError) throw removeError
      await loadVendors()
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Failed to remove vendor')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="grid grid-2">
      {/* Add Vendor Section */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Add Vendor</h3>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <Check size={20} />
            <span>{success}</span>
          </div>
        )}

        {newCredentials && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <Check size={20} />
            <div style={{ flex: 1 }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{newCredentials.name}</strong> added — share this login with them now, it won't be shown again:
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-white)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  flexWrap: 'wrap'
                }}
              >
                <span>{newCredentials.email} · {newCredentials.password}</span>
                <button type="button" onClick={handleCopyCredentials} className="btn btn-secondary btn-small">
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewCredentials(null)}
                className="btn btn-secondary btn-small"
                style={{ marginTop: '0.75rem' }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAddVendor}>
          <div className="form-group">
            <label htmlFor="vendor-name">Vendor Name</label>
            <input
              id="vendor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spice Route Catering"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendor-email">Vendor Login Email</label>
            <input
              id="vendor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
            />
          </div>

          {isDemoMode && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              A one-time password will be generated for this vendor to log in with — you'll need to pass it on to them yourself.
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-success btn-block">
            <Plus size={18} />
            {loading ? 'Adding...' : 'Add Vendor'}
          </button>
        </form>
      </div>

      {/* Vendor List */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>
          Vendors ({vendors.length})
        </h3>

        {vendors.length === 0 ? (
          <div className="empty-state">
            <p>No vendors added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--bg)',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Store size={14} />
                    {vendor.name}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    {vendor.email}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveVendor(vendor.id, vendor.name)}
                  className="btn btn-danger btn-small"
                  disabled={removing === vendor.id}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

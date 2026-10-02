import { useState, useEffect } from 'react'
import { menuService, vendorService } from '../../lib/supabase'
import { getAvailableBookingDates, formatDateDisplay } from '../../lib/utils'
import { AlertCircle, Trash2, Check } from 'lucide-react'

export default function MenuManager({ onSuccess }) {
  const [menus, setMenus] = useState({})
  const [vendors, setVendors] = useState([])
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [menuText, setMenuText] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const dates = getAvailableBookingDates()
      setAvailableDates(dates)

      const { data: vendorData } = await vendorService.getVendors()
      setVendors(vendorData || [])

      const menuMap = {}
      for (const date of dates) {
        const { data } = await menuService.getMenuByDate(date)
        if (data) {
          menuMap[date] = data
        }
      }
      setMenus(menuMap)

      if (dates.length > 0) {
        setSelectedDate(dates[0])
      }
    } catch (err) {
      setError('Failed to load menus')
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setMenuText(menus[date]?.content || '')
    setSelectedVendorId(menus[date]?.vendor_id || '')
    setError('')
    setSuccess('')
  }

  const handleSaveMenu = async () => {
    if (!selectedDate || !menuText.trim()) {
      setError('Please select a date and enter menu text')
      return
    }

    setSaving(selectedDate)
    try {
      const { error: saveError } = await menuService.addMenu(selectedDate, menuText, selectedVendorId || null)
      if (saveError) throw saveError

      setMenus(prev => ({
        ...prev,
        [selectedDate]: { date: selectedDate, content: menuText, vendor_id: selectedVendorId || null }
      }))
      setSuccess(`✓ Menu saved for ${formatDateDisplay(selectedDate)}`)
      
      setTimeout(() => {
        setSuccess('')
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to save menu')
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteMenu = async (date) => {
    if (!window.confirm(`Delete menu for ${formatDateDisplay(date)}?`)) return

    setDeleting(date)
    try {
      const { error: delError } = await menuService.deleteMenu(date)
      if (delError) throw delError

      setMenus(prev => {
        const updated = { ...prev }
        delete updated[date]
        return updated
      })

      if (selectedDate === date) {
        setMenuText('')
        setSelectedVendorId('')
        setSelectedDate('')
      }

      setSuccess(`✓ Menu deleted for ${formatDateDisplay(date)}`)
      setTimeout(() => setSuccess(''), 1500)
    } catch (err) {
      setError(err.message || 'Failed to delete menu')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="grid grid-2">
      {/* Date Selection */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Available Dates</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
          Click on a date to add or edit its menu.
        </p>

        <div className="grid" style={{ gap: '0.5rem' }}>
          {availableDates.map(date => (
            <div
              key={date}
              onClick={() => handleDateSelect(date)}
              style={{
                padding: '0.75rem',
                background: selectedDate === date ? 'var(--primary-light)' : 'var(--bg)',
                border: `2px solid ${selectedDate === date ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>
                  {formatDateDisplay(date)}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  {menus[date]
                    ? `✓ Menu set${vendors.find(v => v.id === menus[date].vendor_id) ? ` · ${vendors.find(v => v.id === menus[date].vendor_id).name}` : ''}`
                    : 'No menu'}
                </p>
              </div>
              {menus[date] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteMenu(date)
                  }}
                  className="btn btn-danger btn-small"
                  disabled={deleting === date}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Editor */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>
          {selectedDate ? `Menu for ${formatDateDisplay(selectedDate)}` : 'Select a Date'}
        </h3>

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

        {selectedDate && (
          <div className="form-group">
            <label htmlFor="menu-vendor">Vendor</label>
            <select
              id="menu-vendor"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              style={{ marginBottom: '1rem' }}
            >
              <option value="">No vendor assigned</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>

            <label htmlFor="menu">Menu Text</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
              Write a short description of the day's menu (e.g., "Grilled chicken with rice and salad")
            </p>
            <textarea
              id="menu"
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder="Enter today's menu..."
              style={{ minHeight: '120px', fontFamily: 'inherit' }}
            />

            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
              <button
                onClick={handleSaveMenu}
                disabled={saving === selectedDate || !menuText.trim()}
                className="btn btn-success btn-block"
              >
                <Check size={18} />
                {saving === selectedDate ? 'Saving...' : 'Save Menu'}
              </button>
              <button
                onClick={() => setMenuText('')}
                className="btn btn-secondary btn-block"
                disabled={!menuText}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {!selectedDate && (
          <div className="empty-state">
            <p>Select a date to add a menu</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { facilityTeamService } from '../../lib/supabase'
import { X, Plus, AlertCircle, Check } from 'lucide-react'

export default function TeamManager() {
  const [employees, setEmployees] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: empData } = await facilityTeamService.getAllEmployees()
      const { data: teamData } = await facilityTeamService.getTeamMembers()

      setEmployees(empData || [])
      setTeamMembers(teamData || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: err } = await facilityTeamService.addTeamMember(selectedEmployee)
      if (err) throw err

      setSuccess('✓ Team member added!')
      setSelectedEmployee('')
      setTimeout(() => {
        loadData()
        setSuccess('')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to add team member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (employeeId) => {
    if (!window.confirm('Remove this team member?')) return

    setLoading(true)
    setError('')

    try {
      const { error: err } = await facilityTeamService.removeTeamMember(employeeId)
      if (err) throw err

      setSuccess('✓ Team member removed!')
      setTimeout(() => {
        loadData()
        setSuccess('')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to remove team member')
    } finally {
      setLoading(false)
    }
  }

  const teamMemberIds = new Set(teamMembers.map(m => m.users?.id || m.user_id))
  const availableEmployees = employees.filter(e => !teamMemberIds.has(e.id))

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      {/* Add Member Section */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Add Team Member</h3>

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

        <div className="form-group">
          <label>Select Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            disabled={loading || availableEmployees.length === 0}
          >
            <option value="">
              {availableEmployees.length === 0
                ? 'All employees are team members'
                : 'Choose an employee...'}
            </option>
            {availableEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddMember}
          disabled={!selectedEmployee || loading}
          className="btn btn-success btn-block"
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>
          Team Members ({teamMembers.length})
        </h3>

        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <p>No team members added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teamMembers.map(member => {
              const userData = member.users || {}
              return (
                <div
                  key={member.user_id}
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
                    <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {userData.name}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      {userData.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="btn btn-danger btn-small"
                    disabled={loading}
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

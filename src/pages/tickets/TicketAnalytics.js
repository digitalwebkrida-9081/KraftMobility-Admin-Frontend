import React, { useEffect, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CModalFooter,
  CRow,
  CFormSelect,
  CForm,
  CFormLabel,
  CFormTextarea,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilClock,
  cilWarning,
  cilList,
  cilImage,
  cilDescription,
  cilPencil,
  cilTrash,
  cilUser,
  cilOptions,
  cilSettings,
  cilTask,
  cilDrop,
  cilBrush,
  cilBolt,
} from '@coreui/icons'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import UserService from '../../services/userService'

const MySwal = withReactContent(Swal)

import TicketService from '../../services/ticketService'
import { authService } from '../../services/authService'

const TicketAnalytics = () => {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  })

  // Modal State
  const [notesVisible, setNotesVisible] = useState(false)
  const [currentTicketNotes, setCurrentTicketNotes] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [noteText, setNoteText] = useState('')

  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // Assign Modal State
  const [assignVisible, setAssignVisible] = useState(false)
  const [operators, setOperators] = useState([])
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [assignTicketId, setAssignTicketId] = useState(null)

  const [userRole, setUserRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await TicketService.getTickets()
        const data = response.data
        setTickets(data)

        // Calculate Stats
        const counts = {
          total: data.length,
          pending: data.filter((t) => t.status === 'Pending').length,
          inProgress: data.filter((t) => t.status === 'In Progress').length,
          completed: data.filter((t) => t.status === 'Completed').length,
        }
        setStats(counts)
      } catch (error) {
        console.error('Error fetching tickets for dashboard', error)
      }
    }

    fetchTickets()

    const user = authService.getCurrentUser()
    if (user) {
      setUserRole(user.role)
      setCurrentUserId(user.id)

      if (user.role === 'Admin') {
        UserService.getUsers()
          .then((res) => {
            const ops = res.data.filter((u) => u.role === 'Operator')
            setOperators(ops)
          })
          .catch((err) => console.log(err))
      }
    }
  }, [])

  const isExtended = (ticket) => {
    // Default 8 days. If diff > 8 days + buffer, it's extended.
    const created = new Date(ticket.createdAt)
    const expires = new Date(ticket.expiresAt)
    const diffTime = Math.abs(expires - created)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    // Allow small buffer for execution time, say 8.1 days
    return diffDays > 9
  }

  const isResponded = (ticket) => {
    // Check if any note author is 'Admin' or 'Operator'
    if (!ticket.notes || ticket.notes.length === 0) return false
    return ticket.notes.some((n) => n.author === 'Admin' || n.author === 'Operator')
  }

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-soft-success'
      case 'In Progress':
        return 'badge-soft-warning'
      case 'Pending':
        return 'badge-soft-danger'
      default:
        return 'badge-soft-secondary'
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(/[\s@.]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getServiceIcon = (service) => {
    // Return icon based on service name (mock logic)
    if (!service) return cilSettings
    const s = service.toLowerCase()
    if (s.includes('plumb')) return cilDrop
    if (s.includes('elect')) return cilBolt // Changed to Bolt (standard free icon)
    if (s.includes('paint')) return cilBrush // Changed to Brush (standard free icon)
    return cilTask
  }

  // --- Handlers ---

  const handleStatusChange = (id, newStatus) => {
    TicketService.updateTicketStatus(id, newStatus)
      .then(() => {
        // Refresh tickets
        const fetchTickets = async () => {
          const response = await TicketService.getTickets()
          setTickets(response.data)
          // Re-calc stats locally for speed
          const data = response.data
          const counts = {
            total: data.length,
            pending: data.filter((t) => t.status === 'Pending').length,
            inProgress: data.filter((t) => t.status === 'In Progress').length,
            completed: data.filter((t) => t.status === 'Completed').length,
          }
          setStats(counts)
        }
        fetchTickets()
        toast.success(`Ticket status updated to ${newStatus}`)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const retrieveTickets = async () => {
    try {
      const response = await TicketService.getTickets()
      const data = response.data
      setTickets(data)
      const counts = {
        total: data.length,
        pending: data.filter((t) => t.status === 'Pending').length,
        inProgress: data.filter((t) => t.status === 'In Progress').length,
        completed: data.filter((t) => t.status === 'Completed').length,
      }
      setStats(counts)
    } catch (error) {
      console.error('Error fetching tickets', error)
    }
  }

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e55353',
      cancelButtonColor: '#secondary',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        TicketService.deleteTicket(id)
          .then(() => {
            retrieveTickets()
            toast.success('Ticket deleted successfully')
          })
          .catch((e) => {
            console.log(e)
            toast.error('Failed to delete ticket')
          })
      }
    })
  }

  const openAssignModal = (ticket) => {
    setAssignTicketId(ticket.id)
    setSelectedOperatorId(ticket.assignedTo || '')
    setAssignVisible(true)
  }

  const handleAssignSubmit = () => {
    if (!selectedOperatorId) {
      toast.error('Please select an operator')
      return
    }
    const operator = operators.find((o) => String(o.id || o._id) === String(selectedOperatorId))
    const operatorName = operator ? operator.username : ''

    TicketService.assignTicket(assignTicketId, selectedOperatorId, operatorName)
      .then(() => {
        setAssignVisible(false)
        retrieveTickets()
        toast.success(`Ticket assigned to ${operatorName}`)
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to assign ticket')
      })
  }

  // Notes
  const openNotesModal = (ticket) => {
    setSelectedTicketId(ticket.id)
    setCurrentTicketNotes(ticket.notes || [])
    setNoteText('')
    setNotesVisible(true)
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!noteText.trim()) return

    TicketService.addNote(selectedTicketId, noteText)
      .then(() => {
        setNoteText('')
        retrieveTickets()
        toast.success('Note added successfully')
        setNotesVisible(false)
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to add note')
      })
  }

  const openImageModal = (ticket) => {
    const imageUrl = ticket.image
    const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${imageUrl}`
    setCurrentImageUrl(fullUrl)
    setImageModalVisible(true)
  }

  return (
    <div className="container-fluid px-4 fade-in">
      {/* Used text-body to adapt to theme */}
      <h2 className="mb-4 fw-bold">Analytics Dashboard</h2>

      {/* Stats Cards */}
      <CRow className="mb-5 g-4">
        <CCol sm={6} lg={3}>
          <div className="glass-card-stat stat-primary p-4 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <p className="text-uppercase fw-bold small mb-1 opacity-75">Total Tickets</p>
                <h3 className="fw-bold mb-0 display-5">{stats.total}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                <CIcon icon={cilList} size="xl" />
              </div>
            </div>
            <div className="small opacity-75 mt-2">All time tickets</div>
          </div>
        </CCol>
        <CCol sm={6} lg={3}>
          <div className="glass-card-stat stat-danger p-4 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <p className="text-uppercase fw-bold small mb-1 opacity-75">Pending</p>
                <h3 className="fw-bold mb-0 display-5">{stats.pending}</h3>
              </div>
              <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger">
                <CIcon icon={cilWarning} size="xl" />
              </div>
            </div>
            <div className="small opacity-75 mt-2">Requires attention</div>
          </div>
        </CCol>
        <CCol sm={6} lg={3}>
          <div className="glass-card-stat stat-warning p-4 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <p className="text-uppercase fw-bold small mb-1 opacity-75">In Progress</p>
                <h3 className="fw-bold mb-0 display-5">{stats.inProgress}</h3>
              </div>
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning">
                <CIcon icon={cilClock} size="xl" />
              </div>
            </div>
            <div className="small opacity-75 mt-2">Currently active</div>
          </div>
        </CCol>
        <CCol sm={6} lg={3}>
          <div className="glass-card-stat stat-success p-4 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <p className="text-uppercase fw-bold small mb-1 opacity-75">Completed</p>
                <h3 className="fw-bold mb-0 display-5">{stats.completed}</h3>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success">
                <CIcon icon={cilCheckCircle} size="xl" />
              </div>
            </div>
            <div className="small opacity-75 mt-2">Successfully closed</div>
          </div>
        </CCol>
      </CRow>

      <div className="dashboard-table-card p-0 mb-5">
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1">Ticket Overview</h4>
            <p className="small mb-0 opacity-75">Detailed view of all system tickets and status.</p>
          </div>
          <CButton
            color="primary"
            className="d-flex align-items-center gap-2 rounded-pill px-4"
            onClick={retrieveTickets}
          >
            <CIcon icon={cilTask} /> Refresh Data
          </CButton>
        </div>

        <div className="table-responsive">
          <table className="ticket-table align-middle">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>Ticket & Service</th>
                <th>Created By</th>
                <th>Assigned Operator</th>
                <th>Status</th>
                <th>Timeline</th>
                <th className="text-center">Details</th>
                <th className="text-end" style={{ paddingRight: '1.5rem' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((item, index) => (
                <tr key={index}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <div className="d-flex align-items-center">
                      <div className="ticket-service-icon">
                        <CIcon icon={getServiceIcon(item.service)} />
                      </div>
                      <div>
                        {/* removed text-dark to allow inheritance */}
                        <div className="fw-bold">{item.service}</div>
                        <div className="small opacity-75">ID: #{item.id}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="d-flex align-items-center">
                      <div
                        className="avatar-circle me-2"
                        style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
                      >
                        {getInitials(item.userEmail)}
                      </div>
                      <div>
                        <div
                          className="fw-semibold text-truncate"
                          style={{ maxWidth: '150px' }}
                          title={item.userEmail}
                        >
                          {item.userEmail}
                        </div>
                        <div className="small opacity-75">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    {item.assignedToName ? (
                      <div className="d-flex align-items-center">
                        <div
                          className="avatar-circle me-2"
                          style={{
                            background: 'linear-gradient(135deg, #17ead9 0%, #6078ea 100%)',
                            width: '28px',
                            height: '28px',
                          }}
                        >
                          {getInitials(item.assignedToName)}
                        </div>
                        {/* removed text-dark */}
                        <span className="fw-medium">{item.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-10 text-secondary fw-normal px-3 py-1 rounded-pill">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td>
                    <CDropdown>
                      <CDropdownToggle
                        caret={false}
                        className={`border-0 p-0 badge-pill ${getBadgeClass(item.status)} text-decoration-none`}
                        disabled={
                          !(
                            userRole === 'Admin' ||
                            authService.getPermissions()['tickets']?.includes('action')
                          )
                        }
                        style={{
                          cursor:
                            userRole === 'Admin' ||
                            authService.getPermissions()['tickets']?.includes('action')
                              ? 'pointer'
                              : 'default',
                        }}
                      >
                        {item.status}
                      </CDropdownToggle>
                      {(userRole === 'Admin' ||
                        authService.getPermissions()['tickets']?.includes('action')) && (
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => handleStatusChange(item.id, 'Pending')}>
                            Pending
                          </CDropdownItem>
                          <CDropdownItem onClick={() => handleStatusChange(item.id, 'In Progress')}>
                            In Progress
                          </CDropdownItem>
                          <CDropdownItem onClick={() => handleStatusChange(item.id, 'Completed')}>
                            Completed
                          </CDropdownItem>
                        </CDropdownMenu>
                      )}
                    </CDropdown>
                  </td>

                  <td>
                    <div className="small">
                      <div className="d-flex align-items-center gap-1 mb-1 opacity-75">
                        <CIcon icon={cilClock} size="sm" /> Expires:{' '}
                        <span className={isExtended(item) ? 'text-primary fw-bold' : ''}>
                          {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="opacity-75" style={{ fontSize: '0.75rem' }}>
                        Last Update: {new Date(item.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>

                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      {item.image && (
                        <button
                          className="btn-icon-soft text-primary"
                          onClick={() => openImageModal(item)}
                          title="View Attachment"
                        >
                          <CIcon icon={cilImage} />
                        </button>
                      )}
                      <button
                        className={`btn-icon-soft ${item.notes && item.notes.length > 0 ? 'text-info' : 'text-secondary'}`}
                        onClick={() => openNotesModal(item)}
                        title="View Notes"
                      >
                        <CIcon icon={cilDescription} />
                        {item.notes && item.notes.length > 0 && (
                          <span
                            className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                            style={{ width: '6px', height: '6px' }}
                          ></span>
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="text-end" style={{ paddingRight: '1.5rem' }}>
                    {/* Actions Dropdown */}
                    <CDropdown alignment="end">
                      <CDropdownToggle
                        color="transparent"
                        size="sm"
                        className="btn-icon-soft text-secondary p-0 rotate-icon"
                      >
                        <CIcon icon={cilOptions} size="lg" className="rotate-90" />
                      </CDropdownToggle>
                      <CDropdownMenu>
                        {(userRole === 'Admin' ||
                          item.userId === currentUserId ||
                          authService.getPermissions()['tickets']?.includes('delete')) && (
                          <CDropdownItem
                            onClick={() => handleDelete(item.id)}
                            className="text-danger"
                          >
                            <CIcon icon={cilTrash} className="me-2" /> Delete Ticket
                          </CDropdownItem>
                        )}
                        {userRole === 'Admin' && (
                          <CDropdownItem onClick={() => openAssignModal(item)}>
                            <CIcon icon={cilUser} className="me-2" /> Assign Operator
                          </CDropdownItem>
                        )}
                        <CDropdownItem onClick={() => openNotesModal(item)}>
                          <CIcon icon={cilDescription} className="me-2" /> Manage Notes
                        </CDropdownItem>
                      </CDropdownMenu>
                    </CDropdown>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="mb-3">
                      <CIcon icon={cilList} size="4xl" className="text-light-emphasis" />
                    </div>
                    No tickets found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Modal */}
      <CModal visible={notesVisible} onClose={() => setNotesVisible(false)} size="lg">
        <CModalHeader onClose={() => setNotesVisible(false)} className="bg-light border-bottom-0">
          <CModalTitle className="fw-bold text-dark">Ticket Notes</CModalTitle>
        </CModalHeader>
        <CModalBody className="bg-light text-dark">
          <div
            className="mb-4 d-flex flex-column gap-3"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {currentTicketNotes.length === 0 ? (
              <div className="text-center py-4 text-secondary border rounded-3 bg-white">
                No notes available yet.
              </div>
            ) : (
              currentTicketNotes.map((note, idx) => (
                <div key={idx} className="bg-white p-3 rounded-3 shadow-sm border border-light">
                  <div className="d-flex justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="avatar-circle"
                        style={{ width: '24px', height: '24px', fontSize: '0.6rem' }}
                      >
                        {getInitials(note.author)}
                      </div>
                      <strong className="text-dark">{note.author}</strong>
                    </div>
                    <small className="text-secondary text-opacity-75">
                      {new Date(note.timestamp).toLocaleString()}
                    </small>
                  </div>
                  <p className="mb-0 text-dark">{note.content}</p>
                </div>
              ))
            )}
          </div>
          {(userRole === 'Admin' || userRole === 'Operator') && (
            <CForm onSubmit={handleAddNote} className="bg-white p-3 rounded-3 border text-dark">
              <div className="mb-3">
                <CFormLabel className="fw-bold small text-dark">Add New Note</CFormLabel>
                <CFormTextarea
                  rows={2}
                  className="text-dark bg-white"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type your note here..."
                  style={{ color: '#000' }}
                />
              </div>
              <div className="d-flex justify-content-end">
                <CButton
                  type="submit"
                  color="primary"
                  className="px-4 rounded-pill"
                  disabled={!noteText.trim()}
                >
                  Post Note
                </CButton>
              </div>
            </CForm>
          )}
        </CModalBody>
        <CModalFooter className="border-top-0 bg-light">
          <CButton color="secondary" onClick={() => setNotesVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Assign Modal */}
      <CModal visible={assignVisible} onClose={() => setAssignVisible(false)} alignment="center">
        <CModalHeader onClose={() => setAssignVisible(false)}>
          <CModalTitle>Assign Operator</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel className="fw-bold">Select Operator</CFormLabel>
              <CFormSelect
                size="lg"
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
              >
                <option value="">Select an Operator</option>
                {operators.map((op) => (
                  <option key={op.id || op._id} value={op.id || op._id}>
                    {op.username}
                  </option>
                ))}
              </CFormSelect>
              <div className="form-text mt-2">
                The selected operator will be notified and assigned ownership of this ticket.
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setAssignVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" className="rounded-pill px-4" onClick={handleAssignSubmit}>
            Confirm Assignment
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Image Modal */}
      <CModal
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        size="xl"
        alignment="center"
        className="bg-dark bg-opacity-75"
      >
        <CModalHeader onClose={() => setImageModalVisible(false)} className="border-bottom-0">
          <CModalTitle className="text-white">Attachment</CModalTitle>
        </CModalHeader>
        <CModalBody
          className="text-center p-0 bg-black d-flex justify-content-center align-items-center"
          style={{ minHeight: '80vh' }}
        >
          <img
            src={currentImageUrl}
            alt="Attachment"
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </CModalBody>
      </CModal>
    </div>
  )
}

export default TicketAnalytics

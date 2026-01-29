import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CRow,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormSelect as CSelect, // Alias if needed, but CFormSelect is fine
  CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilClock, cilImage } from '@coreui/icons'
import TicketService from '../../services/ticketService'
import { authService } from '../../services/authService'
import UserService from '../../services/userService'

const MySwal = withReactContent(Swal)

const TicketList = () => {
  const [tickets, setTickets] = useState([])
  const [userRole, setUserRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  // Modal State
  const [visible, setVisible] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [formData, setFormData] = useState({ service: '', description: '' })

  // Assign Modal State
  const [assignVisible, setAssignVisible] = useState(false)
  const [operators, setOperators] = useState([])
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [assignTicketId, setAssignTicketId] = useState(null)

  // Notes Modal State
  const [notesVisible, setNotesVisible] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [currentTicketNotes, setCurrentTicketNotes] = useState([])
  const [noteText, setNoteText] = useState('')

  // Image Modal State
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  useEffect(() => {
    retrieveTickets()
    const user = authService.getCurrentUser()
    if (user) {
      setUserRole(user.role)
      setCurrentUserId(user.id)

      if (user.role === 'Admin') {
        UserService.getUsers()
          .then((res) => {
            // Filter for operators.
            // Ensure we handle inconsistent role naming if any, but backend says 'Operator'
            const ops = res.data.filter((u) => u.role === 'Operator')
            setOperators(ops)
          })
          .catch((err) => console.log(err))
      }
    }
  }, [])

  // Update notes in modal if tickets change (e.g. after adding a note)
  useEffect(() => {
    if (selectedTicketId && visible === false) {
      const t = tickets.find((x) => x.id === selectedTicketId)
      if (t) setCurrentTicketNotes(t.notes || [])
    }
  }, [tickets, selectedTicketId, visible])

  const retrieveTickets = () => {
    TicketService.getTickets()
      .then((response) => {
        setTickets(response.data)
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to retrieve tickets')
      })
  }

  const handleStatusChange = (id, newStatus) => {
    TicketService.updateTicketStatus(id, newStatus)
      .then(() => {
        retrieveTickets()
        toast.success(`Ticket status updated to ${newStatus}`)
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to update ticket status')
      })
  }

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
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

  const handleExtend = (id) => {
    MySwal.fire({
      title: 'Extend Ticket?',
      text: 'Select the number of days to extend:',
      icon: 'question',
      input: 'range',
      inputLabel: 'Days',
      inputAttributes: {
        min: 1,
        max: 30,
        step: 1,
      },
      inputValue: 8,
      showCancelButton: true,
      confirmButtonColor: '#f0ad4e',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, extend it!',
      didOpen: () => {
        const range = Swal.getInput()
        const output = document.createElement('output')
        output.style.display = 'block'
        output.style.marginTop = '10px'
        output.style.fontWeight = 'bold'
        output.textContent = range.value + ' Days'
        range.parentNode.insertBefore(output, range.nextSibling)
        range.addEventListener('input', () => {
          output.textContent = range.value + ' Days'
        })
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const days = result.value
        TicketService.extendTicket(id, days)
          .then(() => {
            retrieveTickets()
            toast.success(`Ticket extended by ${days} days`)
          })
          .catch((e) => {
            console.log(e)
            toast.error('Failed to extend ticket')
          })
      }
    })
  }

  const openEditModal = (ticket) => {
    setEditingTicket(ticket)
    setFormData({ service: ticket.service, description: ticket.description })
    setVisible(true)
  }

  const handleEditSubmit = () => {
    TicketService.updateTicket(editingTicket.id, formData)
      .then(() => {
        setVisible(false)
        retrieveTickets()
        toast.success('Ticket updated successfully')
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to update ticket')
      })
  }

  // --- Assign Logic ---
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
    // Find operator to get name
    const operator = operators.find(
      (o) => o.id === parseInt(selectedOperatorId) || o._id === parseInt(selectedOperatorId),
    )
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
  // --------------------

  const getBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'warning'
      case 'Pending':
        return 'secondary'
      default:
        return 'primary'
    }
  }

  const isExpired = (dateString) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  const canEdit = (ticket) => {
    // ONLY the ticket creator can edit the ticket details.
    if (ticket.userId === currentUserId) return true
    return false
  }

  const canUpdateStatus =
    userRole === 'Admin' || authService.getPermissions()['tickets']?.includes('action')

  // --- Notes Logic ---
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
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to add note')
      })
  }

  const openImageModal = (imageUrl) => {
    const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/../${imageUrl}`
    setCurrentImageUrl(fullUrl)
    setImageModalVisible(true)
  }
  // -------------------

  return (
    <>
      <CRow>
        {tickets.map((ticket) => (
          <CCol xs={12} md={6} lg={4} key={ticket.id} className="mb-4">
            <CCard className={`h-100 ${isExpired(ticket.expiresAt) ? 'border-danger' : ''}`}>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>
                  #{ticket.id} - {ticket.service}
                </strong>
                <CBadge color={getBadge(ticket.status)}>{ticket.status}</CBadge>
              </CCardHeader>
              <CCardBody>
                <p className="card-text">{ticket.description}</p>
                <small className="text-muted">
                  Created: {new Date(ticket.createdAt).toLocaleDateString()}
                </small>
                <br />
                {ticket.expiresAt && (
                  <small
                    className={isExpired(ticket.expiresAt) ? 'text-danger fw-bold' : 'text-muted'}
                  >
                    Expires: {new Date(ticket.expiresAt).toLocaleDateString()}
                  </small>
                )}
                {ticket.userEmail && (
                  <div>
                    <small className="text-muted">User: {ticket.userEmail}</small>
                  </div>
                )}
                {ticket.assignedToName && (
                  <div className="mt-2 text-info">
                    <small>
                      Assigned to: <strong>{ticket.assignedToName}</strong>
                    </small>
                  </div>
                )}
              </CCardBody>
              <CCardFooter className="bg-transparent border-top-0">
                <div className="d-flex justify-content-between align-items-center">
                  {canUpdateStatus ? (
                    <CFormSelect
                      size="sm"
                      className="me-2"
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      options={['Pending', 'In Progress', 'Completed']}
                      style={{ width: 'auto' }}
                    />
                  ) : (
                    <span></span>
                  )}

                  <div className="btn-group">
                    <CButton
                      color="secondary"
                      variant="ghost"
                      size="sm"
                      onClick={() => openNotesModal(ticket)}
                      title="View/Add Notes"
                    >
                      Notes ({ticket.notes ? ticket.notes.length : 0})
                    </CButton>

                    {ticket.image && (
                      <CButton
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() => openImageModal(ticket.image)}
                        title="View Attachment"
                      >
                        <CIcon icon={cilImage} />
                      </CButton>
                    )}

                    {userRole === 'Admin' && (
                      <CButton
                        color="primary"
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignModal(ticket)}
                        title="Assign Operator"
                      >
                        Assign
                      </CButton>
                    )}

                    {canEdit(ticket) && (
                      <>
                        <CButton
                          color="info"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(ticket)}
                          title="Edit"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="warning"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExtend(ticket.id)}
                          title="Extend Expiry"
                        >
                          <CIcon icon={cilClock} />
                        </CButton>
                      </>
                    )}

                    {(userRole === 'Admin' ||
                      canEdit(ticket) ||
                      authService.getPermissions()['tickets']?.includes('delete')) && (
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ticket.id)}
                        title="Delete"
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    )}
                  </div>
                </div>
              </CCardFooter>
            </CCard>
          </CCol>
        ))}
        {tickets.length === 0 && (
          <CCol>
            <p className="text-center text-muted">No tickets found.</p>
          </CCol>
        )}
      </CRow>

      {/* Assign Modal */}
      <CModal visible={assignVisible} onClose={() => setAssignVisible(false)}>
        <CModalHeader onClose={() => setAssignVisible(false)}>
          <CModalTitle>Assign Ticket to Operator</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>Select Operator</CFormLabel>
              <CFormSelect
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
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setAssignVisible(false)}>
            Close
          </CButton>
          <CButton color="primary" onClick={handleAssignSubmit}>
            Assign
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Modal */}
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader onClose={() => setVisible(false)}>
          <CModalTitle>Edit Ticket</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>Service</CFormLabel>
              <CFormSelect
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                options={['Visa Renewal', 'Household', 'Furniture Service', 'Maintenance', 'Other']}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Description</CFormLabel>
              <CFormTextarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Close
          </CButton>
          <CButton color="primary" onClick={handleEditSubmit}>
            Save changes
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Notes Modal */}
      <CModal visible={notesVisible} onClose={() => setNotesVisible(false)}>
        <CModalHeader onClose={() => setNotesVisible(false)}>
          <CModalTitle>Ticket Notes</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {currentTicketNotes.length === 0 ? (
              <p className="text-muted">No notes yet.</p>
            ) : (
              currentTicketNotes.map((note, idx) => (
                <div key={idx} className="border-bottom mb-2 pb-2">
                  <div className="d-flex justify-content-between">
                    <strong>{note.author}</strong>
                    <small className="text-muted">
                      {new Date(note.timestamp).toLocaleString()}
                    </small>
                  </div>
                  <p className="mb-0">{note.content}</p>
                </div>
              ))
            )}
          </div>

          {(userRole === 'Admin' || userRole === 'Operator') && (
            <CForm onSubmit={handleAddNote}>
              <div className="mb-3">
                <CFormLabel>Add Note</CFormLabel>
                <CFormTextarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter note..."
                />
              </div>
              <div className="d-flex justify-content-end">
                <CButton type="submit" color="primary" disabled={!noteText.trim()}>
                  Add Note
                </CButton>
              </div>
            </CForm>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setNotesVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Image View Modal */}
      <CModal
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        size="lg"
        alignment="center"
      >
        <CModalHeader onClose={() => setImageModalVisible(false)}>
          <CModalTitle>Attachment View</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center">
          <img
            src={currentImageUrl}
            alt="Attachment"
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </CModalBody>
      </CModal>
    </>
  )
}

export default TicketList

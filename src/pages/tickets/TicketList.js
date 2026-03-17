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
import { cilPencil, cilTrash, cilClock, cilImage, cilStar, cilUser } from '@coreui/icons'
import TicketService from '../../services/ticketService'
import { authService } from '../../services/authService'
import UserService from '../../services/userService'
import RatingModal from '../../components/RatingModal'
import RatingService from '../../services/ratingService'
import { hasPermission } from '../../utils/rolePermissions'

const MySwal = withReactContent(Swal)

const TicketList = () => {
  const [tickets, setTickets] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const [userRole, setUserRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  // Modal State
  const [visible, setVisible] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [formData, setFormData] = useState({ service: '', description: '' })

  // Assign Modal State
  const [assignVisible, setAssignVisible] = useState(false)
  const [fieldExecutives, setFieldExecutives] = useState([])
  const [selectedFieldExecutiveId, setSelectedFieldExecutiveId] = useState('')
  const [assignTicketId, setAssignTicketId] = useState(null)

  // Notes Modal State
  const [notesVisible, setNotesVisible] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [currentTicketNotes, setCurrentTicketNotes] = useState([])
  const [noteText, setNoteText] = useState('')

  // Image Modal State
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // Rating Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [ratingTicketId, setRatingTicketId] = useState(null)
  const [ratedTicketIds, setRatedTicketIds] = useState(new Set())

  useEffect(() => {
    retrieveTickets(currentPage)
    const user = authService.getCurrentUser()
    if (user) {
      setUserRole(user.role)
      setCurrentUserId(user.id)

      if (user.role === 'Admin') {
        UserService.getUsers()
          .then((res) => {
            // Filter for field executives.
            const ops = res.data.filter((u) => u.role === 'Field Executive')
            setFieldExecutives(ops)
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

  const retrieveTickets = (page = 1) => {
    TicketService.getTickets(page, limit)
      .then((response) => {
        if (response.data && response.data.data) {
          setTickets(response.data.data)
          setCurrentPage(response.data.currentPage)
          setTotalPages(response.data.totalPages)
          checkRatedTickets(response.data.data)
        } else {
          setTickets(response.data)
          checkRatedTickets(response.data)
        }
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to retrieve tickets')
      })
  }

  const handleStatusChange = (id, newStatus) => {
    TicketService.updateTicketStatus(id, newStatus)
      .then(() => {
        retrieveTickets(currentPage)
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
      confirmButtonColor: '#ff0000',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        confirmButton: 'swal2-confirm-danger',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        TicketService.deleteTicket(id)
          .then(() => {
            retrieveTickets(currentPage)
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
            retrieveTickets(currentPage)
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
    if (ticket.status === 'In Progress') {
      MySwal.fire({
        title: 'Notice',
        text: 'You cannot edit a ticket while it is in progress.',
        icon: 'info',
        confirmButtonColor: '#3085d6',
      })
      return
    }
    setEditingTicket(ticket)
    setFormData({ service: ticket.service, description: ticket.description })
    setVisible(true)
  }

  const handleEditSubmit = () => {
    TicketService.updateTicket(editingTicket.id, formData)
      .then(() => {
        setVisible(false)
        retrieveTickets(currentPage)
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
    setSelectedFieldExecutiveId(ticket.assignedTo || '')
    setAssignVisible(true)
  }

  const handleAssignSubmit = () => {
    if (!selectedFieldExecutiveId) {
      toast.error('Please select a Field Executive')
      return
    }
    // Find field executive to get name
    const fieldExecutive = fieldExecutives.find(
      (o) => String(o.id || o._id) === String(selectedFieldExecutiveId),
    )
    const fieldExecutiveName = fieldExecutive ? fieldExecutive.username : ''

    TicketService.assignTicket(assignTicketId, selectedFieldExecutiveId, fieldExecutiveName)
      .then(() => {
        setAssignVisible(false)
        retrieveTickets(currentPage)
        toast.success(`Ticket assigned to ${fieldExecutiveName}`)
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
    if (String(ticket.userId) === String(currentUserId)) return true
    return false
  }

  const canUpdateStatus =
    userRole === 'Admin' ||
    hasPermission(userRole, 'canChangeTicketStatus') ||
    authService.getPermissions()['tickets']?.includes('action')

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
        retrieveTickets(currentPage)
        toast.success('Note added successfully')
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to add note')
      })
  }

  const openImageModal = (imageUrl) => {
    const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${imageUrl}`
    setCurrentImageUrl(fullUrl)
    setImageModalVisible(true)
  }

  // --- Rating Logic ---
  const checkRatedTickets = async (ticketsToCheck) => {
    if (!ticketsToCheck || ticketsToCheck.length === 0) return
    const completedTickets = ticketsToCheck.filter(
      (t) => t.status === 'Completed' && String(t.userId) === String(currentUserId),
    )

    if (completedTickets.length === 0) return

    try {
      const ticketIds = completedTickets.map((t) => t.id)
      const res = await RatingService.checkRatedTicketsBatch(ticketIds)
      if (res.data) {
        setRatedTicketIds(new Set(res.data))
      }
    } catch (e) {
      console.error('Error checking ratings batch', e)
    }
  }

  const openRatingModal = (ticketId) => {
    setRatingTicketId(ticketId)
    setRatingModalVisible(true)
  }

  const handleRatingSubmit = (ticketId, rating, feedback) => {
    RatingService.createRating(ticketId, rating, feedback)
      .then(() => {
        setRatingModalVisible(false)
        toast.success('Thank you for your rating!')
        setRatedTicketIds((prev) => new Set(prev).add(ticketId)) // Update local state
      })
      .catch((e) => {
        console.error(e)
        if (e.response && e.response.data && e.response.data.message) {
          toast.error(e.response.data.message)
        } else {
          toast.error('Failed to submit rating')
        }
      })
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
                {['Admin', 'Field Executive', 'HR'].includes(userRole) && ticket.userDetails ? (
                  <div
                    className="mt-2 p-2 bg-light rounded border border-info border-opacity-25"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <div className="fw-semibold text-info mb-1">
                      <CIcon icon={cilUser} size="sm" className="me-1" />
                      Customer Details
                    </div>
                    <div>
                      <span className="text-muted">Name:</span>{' '}
                      {ticket.userDetails.username || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted">Phone:</span>{' '}
                      {ticket.userDetails.phoneNumber || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted">Email:</span>{' '}
                      {ticket.userDetails.email || ticket.userEmail || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted">Location:</span>{' '}
                      {ticket.userDetails.location || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted">Property Address:</span>{' '}
                      {ticket.userDetails.propertyAddress || 'N/A'}
                    </div>
                  </div>
                ) : ticket.userEmail ? (
                  <div>
                    <small className="text-muted">User: {ticket.userEmail}</small>
                  </div>
                ) : null}
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
                        title="Assign Field Executive"
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
                          disabled={ticket.status === 'Completed'}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="warning"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExtend(ticket.id)}
                          title="Extend Expiry"
                          disabled={ticket.status === 'Completed'}
                        >
                          <CIcon icon={cilClock} />
                        </CButton>
                      </>
                    )}

                    {(userRole === 'Admin' ||
                      userRole === 'Field Executive' ||
                      hasPermission(userRole, 'canDeleteTicket') ||
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

                    {/* Rating Button - Only for Completed tickets and Owner */}
                    {(() => {
                      const isCompleted = ticket.status === 'Completed'
                      const isOwner = String(ticket.userId) === String(currentUserId)
                      const isNotRated = !ratedTicketIds.has(ticket.id)
                      const canRate = hasPermission(userRole, 'canRateTicket')
                      return isCompleted && isOwner && isNotRated && canRate ? (
                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          onClick={() => openRatingModal(ticket.id)}
                          title="Rate Service"
                        >
                          <CIcon icon={cilStar} /> Rate
                        </CButton>
                      ) : null
                    })()}

                    {ticket.status === 'Completed' &&
                      String(ticket.userId) === String(currentUserId) &&
                      ratedTicketIds.has(ticket.id) && (
                        <CButton color="success" variant="ghost" size="sm" disabled title="Rated">
                          <CIcon icon={cilStar} /> Rated
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
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3 mb-4">
          <CButton
            color="primary"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(currentPage - 1)
              retrieveTickets(currentPage - 1)
            }}
            className="me-2"
          >
            Previous
          </CButton>
          <span className="align-self-center mx-3 fw-bold">
            Page {currentPage} of {totalPages}
          </span>
          <CButton
            color="primary"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(currentPage + 1)
              retrieveTickets(currentPage + 1)
            }}
            className="ms-2"
          >
            Next
          </CButton>
        </div>
      )}

      {/* Assign Modal */}
      <CModal visible={assignVisible} onClose={() => setAssignVisible(false)}>
        <CModalHeader onClose={() => setAssignVisible(false)}>
          <CModalTitle>Assign Ticket to Field Executive</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>Select Field Executive</CFormLabel>
              <CFormSelect
                value={selectedFieldExecutiveId}
                onChange={(e) => setSelectedFieldExecutiveId(e.target.value)}
              >
                <option value="">Select a Field Executive</option>
                {fieldExecutives.map((op) => (
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
                options={['Plumbing', 'Electrical', 'Carpentry', 'Gas', 'Others']}
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

          {(userRole === 'Admin' || userRole === 'Field Executive') && (
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

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
        ticketId={ratingTicketId}
      />
    </>
  )
}

export default TicketList

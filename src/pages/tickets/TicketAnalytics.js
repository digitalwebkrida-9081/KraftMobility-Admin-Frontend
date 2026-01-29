import React, { useEffect, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CModalFooter,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilClock,
  cilWarning,
  cilList,
  cilImage,
  cilDescription,
} from '@coreui/icons'

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
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

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

  const getBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'warning'
      case 'Pending':
        return 'danger'
      default:
        return 'primary'
    }
  }

  const openNotesModal = (ticket) => {
    setCurrentTicketNotes(ticket.notes || [])
    setNotesVisible(true)
  }

  const openImageModal = (imageUrl) => {
    const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/../${imageUrl}`
    setCurrentImageUrl(fullUrl)
    setImageModalVisible(true)
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4 text-white bg-primary">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-4 fw-semibold">{stats.total}</div>
                <div>Total Tickets</div>
              </div>
              <CIcon icon={cilList} size="3xl" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4 text-white bg-danger">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-4 fw-semibold">{stats.pending}</div>
                <div>Pending</div>
              </div>
              <CIcon icon={cilWarning} size="3xl" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4 text-white bg-warning">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-4 fw-semibold">{stats.inProgress}</div>
                <div>In Progress</div>
              </div>
              <CIcon icon={cilClock} size="3xl" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4 text-white bg-success">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-4 fw-semibold">{stats.completed}</div>
                <div>Completed</div>
              </div>
              <CIcon icon={cilCheckCircle} size="3xl" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Detailed Ticket Overview</strong>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Service</CTableHeaderCell>
                <CTableHeaderCell>Created By</CTableHeaderCell>
                <CTableHeaderCell>Assigned To</CTableHeaderCell>
                <CTableHeaderCell>Expires At</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Extended?</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Responded?</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Attachment</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Notes</CTableHeaderCell>
                <CTableHeaderCell>Last Update</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {tickets.map((item, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>#{item.id}</CTableDataCell>
                  <CTableDataCell>
                    <div className="fw-semibold">{item.service}</div>
                    <div className="small text-body-secondary">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>{item.userEmail}</CTableDataCell>
                  <CTableDataCell>
                    {item.assignedToName ? (
                      <div className="d-flex align-items-center">
                        <span className="fw-bold text-info">{item.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="text-muted fst-italic">Unassigned</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell>
                    {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'N/A'}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {isExtended(item) ? (
                      <CBadge color="info">Yes</CBadge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {isResponded(item) ? (
                      <CIcon icon={cilCheckCircle} className="text-success" />
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {item.image ? (
                      <CButton
                        color="light"
                        size="sm"
                        onClick={() => openImageModal(item.image)}
                        title="View Attachment"
                      >
                        <CIcon icon={cilImage} />
                      </CButton>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {item.notes && item.notes.length > 0 ? (
                      <CButton
                        color="light"
                        size="sm"
                        onClick={() => openNotesModal(item)}
                        title="View Notes"
                      >
                        <CIcon icon={cilDescription} />
                      </CButton>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="small text-body-secondary">
                      {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={getBadgeColor(item.status)}>{item.status}</CBadge>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {tickets.length === 0 && (
                <CTableRow>
                  <CTableDataCell colSpan="8" className="text-center">
                    No tickets found
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

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
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setNotesVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Image Modal */}
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

export default TicketAnalytics

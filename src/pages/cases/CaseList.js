import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  cilHistory,
  cilSearch,
  cilTrash,
  cilChartPie,
  cilPlus,
  cilX,
  cilFilter,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CButton,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTooltip,
  CPagination,
  CPaginationItem,
  CFormSelect,
} from '@coreui/react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const CaseList = () => {
  const [cases, setCases] = useState([])
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const loading = useSelector((state) => state.loading)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCases, setSelectedCases] = useState([])
  const [showTimeline, setShowTimeline] = useState(false)
  const [selectedTimelineCase, setSelectedTimelineCase] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const statusFilter = searchParams.get('status')
  const assignedFilter = searchParams.get('assigned')

  // In Vite: process.env is import.meta.env
  // .env has: VITE_API_URL=https://.../api
  // The ticket system simply uses VITE_API_URL + '/tickets'
  // So we must use VITE_API_URL + '/cases'
  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      dispatch({ type: 'set_loading', loading: true })
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const response = await axios.get(`${BASE_API_URL}/cases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setCases(response.data)
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast.error('Failed to load cases')
    } finally {
      dispatch({ type: 'set_loading', loading: false })
    }
  }

  const filteredCases = cases.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false
    if (assignedFilter === 'unassigned' && c.assignedCaseManager) return false
    return true
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredCases.length / pageSize)
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleDelete = async (caseId) => {
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          dispatch({ type: 'set_loading', loading: true })
          const token = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')).token
            : null
          await axios.delete(`${BASE_API_URL}/cases/${caseId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          toast.success('Case deleted successfully')
          fetchCases()
        } catch (error) {
          console.error('Error deleting case:', error)
          toast.error(error.response?.data?.message || 'Failed to delete case')
        } finally {
          dispatch({ type: 'set_loading', loading: false })
        }
      }
    })
  }

  const handleBulkDelete = async () => {
    if (selectedCases.length === 0) return

    MySwal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedCases.length} cases. This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff0000',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Yes, delete ${selectedCases.length} cases!`,
      customClass: {
        confirmButton: 'swal2-confirm-danger',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          dispatch({ type: 'set_loading', loading: true })
          const token = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')).token
            : null
          await axios.post(
            `${BASE_API_URL}/cases/bulk-delete`,
            { ids: selectedCases },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
          toast.success(`${selectedCases.length} cases deleted successfully`)
          setSelectedCases([])
          fetchCases()
        } catch (error) {
          console.error('Error bulk deleting cases:', error)
          toast.error(error.response?.data?.message || 'Failed to bulk delete cases')
        } finally {
          dispatch({ type: 'set_loading', loading: false })
        }
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedCases.length === filteredCases.length) {
      setSelectedCases([])
    } else {
      setSelectedCases(filteredCases.map((c) => c.id))
    }
  }

  const toggleSelectCase = (id) => {
    setSelectedCases((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Initiated':
        return 'primary'
      case 'In Progress':
        return 'warning'
      case 'Completed':
        return 'success'
      case 'Cancelled':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  // Get user role logic (simplified)
  const userStr = localStorage.getItem('user')
  let isHR = false
  let isAdmin = false
  if (userStr) {
    try {
      const parsedUser = JSON.parse(userStr)
      const user = parsedUser?.user || parsedUser
      isHR = user?.role === 'HR'
      isAdmin = user?.role === 'Admin'
    } catch (e) {}
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Case Management</strong>
              {(statusFilter || assignedFilter) && (
                <CBadge color="info" className="ms-2">
                  Filtered: {statusFilter || (assignedFilter === 'unassigned' ? 'Unassigned' : '')}
                </CBadge>
              )}
            </div>
            <div className="d-flex gap-2">
              {(statusFilter || assignedFilter) && (
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({})}
                  className="d-flex align-items-center"
                >
                  <CIcon icon={cilX} className="me-1" />
                  Clear Filters
                </CButton>
              )}
              <CButton
                color="info"
                variant="outline"
                size="sm"
                onClick={() => navigate('/cases/analytics')}
                className="d-flex align-items-center"
              >
                <CIcon icon={cilChartPie} className="me-1" />
                Analytics Dashboard
              </CButton>
              {isAdmin && selectedCases.length > 0 && (
                <CButton
                  color="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="d-flex align-items-center"
                >
                  <CIcon icon={cilTrash} className="me-1" />
                  Bulk Delete ({selectedCases.length})
                </CButton>
              )}
              {isHR || isAdmin ? (
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => navigate('/cases/create')}
                  className="d-flex align-items-center"
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Initiate New Case
                </CButton>
              ) : null}
            </div>
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" variant="grow" />
                <p className="mt-2 text-muted">Loading cases...</p>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="text-muted small">
                    Showing {Math.min(filteredCases.length, (currentPage - 1) * pageSize + 1)} to{' '}
                    {Math.min(filteredCases.length, currentPage * pageSize)} of{' '}
                    {filteredCases.length} entries
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">Show:</span>
                    <CFormSelect
                      size="sm"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      style={{ width: '80px' }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </CFormSelect>
                  </div>
                </div>

                {filteredCases.length === 0 ? (
                  <p className="text-center text-muted">No cases found matching the criteria.</p>
                ) : (
                  <>
                    <CTable hover responsive align="middle">
                      <CTableHead color="light">
                        <CTableRow>
                          {isAdmin && (
                            <CTableHeaderCell style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={
                                  filteredCases.length > 0 &&
                                  selectedCases.length === filteredCases.length
                                }
                                onChange={toggleSelectAll}
                              />
                            </CTableHeaderCell>
                          )}
                          <CTableHeaderCell>Assignee Name</CTableHeaderCell>
                          <CTableHeaderCell>Relocation ID</CTableHeaderCell>
                          <CTableHeaderCell>Billing Entity</CTableHeaderCell>
                          <CTableHeaderCell>From &rarr; To</CTableHeaderCell>
                          <CTableHeaderCell>Status</CTableHeaderCell>
                          <CTableHeaderCell>Case Manager</CTableHeaderCell>
                          <CTableHeaderCell>Created Date</CTableHeaderCell>
                          <CTableHeaderCell className="text-center" style={{ width: '120px' }}>
                            Actions
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {paginatedCases.map((caseItem) => (
                          <CTableRow key={caseItem.id}>
                            {isAdmin && (
                              <CTableDataCell>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedCases.includes(caseItem.id)}
                                  onChange={() => toggleSelectCase(caseItem.id)}
                                />
                              </CTableDataCell>
                            )}
                            <CTableDataCell>
                              <strong>{caseItem.assigneeName}</strong>
                              <div className="small text-medium-emphasis">
                                {caseItem.officialEmailAddress}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <strong>{caseItem.relocationId || '-'}</strong>
                            </CTableDataCell>
                            <CTableDataCell>{caseItem.billingEntity || '-'}</CTableDataCell>
                            <CTableDataCell>
                              {caseItem.relocationType === 'Domestic' ? (
                                <>
                                  {caseItem.movingFromCity || '?'} &rarr; {caseItem.city || '?'}
                                </>
                              ) : (
                                <>
                                  {caseItem.movingFromCountry || '?'} &rarr;{' '}
                                  {caseItem.movingToCountry || '?'}
                                </>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={getStatusBadge(caseItem.status)}>
                                {caseItem.status}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {caseItem.assignedCaseManager?.username || (
                                <span className="text-muted">Unassigned</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {new Date(caseItem.createdAt).toLocaleDateString()}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="d-flex gap-1 justify-content-center">
                                <CTooltip content="View Details">
                                  <CButton
                                    color="info"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                                  >
                                    <CIcon icon={cilSearch} />
                                  </CButton>
                                </CTooltip>
                                <CTooltip content="Case Timeline">
                                  <CButton
                                    color="secondary"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTimelineCase(caseItem)
                                      setShowTimeline(true)
                                    }}
                                  >
                                    <CIcon icon={cilHistory} />
                                  </CButton>
                                </CTooltip>
                                {isAdmin && (
                                  <CTooltip content="Delete Case">
                                    <CButton
                                      color="danger"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(caseItem.id)}
                                    >
                                      <CIcon icon={cilTrash} />
                                    </CButton>
                                  </CTooltip>
                                )}
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>

                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <CPagination aria-label="Page navigation example">
                          <CPaginationItem
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            style={{ cursor: currentPage === 1 ? 'default' : 'pointer' }}
                          >
                            Previous
                          </CPaginationItem>
                          {[...Array(totalPages)].map((_, i) => (
                            <CPaginationItem
                              key={i + 1}
                              active={currentPage === i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              style={{ cursor: 'pointer' }}
                            >
                              {i + 1}
                            </CPaginationItem>
                          ))}
                          <CPaginationItem
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            style={{ cursor: currentPage === totalPages ? 'default' : 'pointer' }}
                          >
                            Next
                          </CPaginationItem>
                        </CPagination>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Timeline Modal */}
      <CModal visible={showTimeline} onClose={() => setShowTimeline(false)} size="lg">
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilHistory} className="me-2" />
            Case Timeline: {selectedTimelineCase?.assigneeName}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {/* Summary Dates at Top */}
          {selectedTimelineCase && (
            <CRow className="mb-4 g-3">
              <CCol md={6}>
                <div className="p-3 bg-light rounded border-start border-primary border-4 shadow-sm">
                  <div className="small text-muted text-uppercase fw-bold mb-1">Created On</div>
                  <div className="fs-5 fw-bold text-dark">
                    {new Date(selectedTimelineCase.createdAt).toLocaleDateString(undefined, {
                      dateStyle: 'long',
                    })}
                  </div>
                  <div className="small text-muted">
                    {new Date(selectedTimelineCase.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </CCol>
              <CCol md={6}>
                <div
                  className={`p-3 rounded border-start border-4 shadow-sm ${
                    selectedTimelineCase.status === 'Completed'
                      ? 'bg-light border-success'
                      : 'bg-white border-light text-muted'
                  }`}
                >
                  <div className="small text-muted text-uppercase fw-bold mb-1">Completed On</div>
                  {selectedTimelineCase.status === 'Completed' ? (
                    <>
                      <div className="fs-5 fw-bold text-success">
                        {new Date(
                          selectedTimelineCase.timeline?.find(
                            (t) =>
                              t.event === 'Status Updated' && t.description.includes('Completed'),
                          )?.timestamp || selectedTimelineCase.updatedAt,
                        ).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </div>
                      <div className="small text-muted">
                        {new Date(
                          selectedTimelineCase.timeline?.find(
                            (t) =>
                              t.event === 'Status Updated' && t.description.includes('Completed'),
                          )?.timestamp || selectedTimelineCase.updatedAt,
                        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  ) : (
                    <div className="fs-5 fw-bold text-muted italic">In Progress...</div>
                  )}
                </div>
              </CCol>
            </CRow>
          )}

          <div
            className="timeline-container px-3"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {selectedTimelineCase?.timeline && selectedTimelineCase.timeline.length > 0 ? (
              <div className="position-relative">
                <div
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    backgroundColor: '#dee2e6',
                  }}
                ></div>

                {[...selectedTimelineCase.timeline].reverse().map((item, index) => (
                  <div key={index} className="ps-4 pb-4 position-relative">
                    <div
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#0d6efd',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 1px #dee2e6',
                        zIndex: 1,
                      }}
                    ></div>

                    <div className="card border-0 shadow-sm">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="fw-bold mb-0 text-primary">{item.event}</h6>
                          <small className="text-muted bg-light px-2 py-1 rounded">
                            {new Date(item.timestamp).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </small>
                        </div>
                        <p className="mb-2 text-dark" style={{ fontSize: '0.9rem' }}>
                          {item.description}
                        </p>
                        <div className="d-flex align-items-center mt-2 pt-2 border-top">
                          <small className="text-secondary fw-medium">
                            <span className="badge bg-light text-dark me-1">
                              {(item.user?.username || 'S')[0].toUpperCase()}
                            </span>
                            {item.user ? `${item.user.username} (${item.user.role})` : 'System'}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <CIcon icon={cilHistory} size="xl" className="text-muted mb-3" />
                <p className="text-muted">No timeline events recorded yet for this case.</p>
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowTimeline(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default CaseList

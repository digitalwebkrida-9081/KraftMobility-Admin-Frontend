import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CBadge,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilHistory } from '@coreui/icons'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const CaseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [trackingLoading, setTrackingLoading] = useState(false)

  // Tracking data state per service
  const [trackingData, setTrackingData] = useState({
    homeSearch: {},
    orientation: {},
    schoolSearch: {},
    visa: {},
    tenancyManagement: {},
    aadharCard: {},
    homeSearchBudget: '',
    householdGoodsLimit: '',
    visaDetails: {},
    servicesAuthorized: {},
    hostPhoneNumber: '',
  })

  const [documents, setDocuments] = useState([])
  const [documentType, setDocumentType] = useState('Milestone Update')
  const [caseManagers, setCaseManagers] = useState([])
  const [assigningCaseManager, setAssigningCaseManager] = useState(false)
  const [selectedCaseManagerId, setSelectedCaseManagerId] = useState('')
  const [showTimeline, setShowTimeline] = useState(false)

  // Current User Context
  const userStr = localStorage.getItem('user')
  let isCaseManagerOrAdmin = false
  let canEditTracking = false
  let isAdmin = false
  let user = null
  if (userStr) {
    try {
      const parsedUser = JSON.parse(userStr)
      user = parsedUser?.user || parsedUser
      isCaseManagerOrAdmin = user?.role === 'Case Manager' || user?.role === 'Admin'
      canEditTracking = isCaseManagerOrAdmin || user?.role === 'Field Executive'
      isAdmin = user?.role === 'Admin'
    } catch (e) {}
  }

  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

  useEffect(() => {
    fetchCaseDetails()
    if (isAdmin) {
      fetchCaseManagers()
    }
  }, [id, isAdmin])

  const fetchCaseManagers = async () => {
    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const response = await axios.get(`${BASE_API_URL}/users/case-managers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCaseManagers(response.data)
    } catch (error) {
      console.error('Error fetching case managers:', error)
    }
  }

  const fetchCaseDetails = async () => {
    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'
      const response = await axios.get(`${BASE_API_URL}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data
      setCaseData(data)
      setSelectedCaseManagerId(data.assignedCaseManager?._id || data.assignedCaseManager?.id || '')

      // Init tracking data from backend
      setTrackingData({
        homeSearch: data.serviceTracking?.homeSearch || {},
        orientation: data.serviceTracking?.orientation || {},
        schoolSearch: data.serviceTracking?.schoolSearch || {},
        visa: data.serviceTracking?.visa || {},
        tenancyManagement: data.serviceTracking?.tenancyManagement || {},
        aadharCard: data.serviceTracking?.aadharCard || {},
        homeSearchBudget: data.homeSearchBudget || '',
        householdGoodsLimit: data.householdGoodsLimit || '',
        visaDetails: data.visaDetails || {},
        servicesAuthorized: data.servicesAuthorized || {},
        hostPhoneNumber: data.hostPhoneNumber || '',
      })
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
      navigate('/cases')
    } finally {
      setLoading(false)
    }
  }

  const handleTrackingChange = (service, field, value) => {
    setTrackingData((prev) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value,
      },
    }))
  }

  const handleRootTrackingChange = (field, value) => {
    setTrackingData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedRootChange = (parentField, field, value) => {
    setTrackingData((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value,
      },
    }))
  }

  const handleDocumentChange = (e) => {
    setDocuments(Array.from(e.target.files))
  }

  const handleUpdateTracking = async (e, serviceKey) => {
    e.preventDefault()
    setTrackingLoading(true)

    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const submitData = new FormData()

      // We only payload the specific service we are updating
      const updates = {
        serviceTracking: {
          [serviceKey]: trackingData[serviceKey],
        },
      }

      submitData.append('serviceTracking', JSON.stringify(updates.serviceTracking))

      if (serviceKey === 'homeSearch') {
        if (trackingData.homeSearchBudget !== undefined) {
          submitData.append('homeSearchBudget', trackingData.homeSearchBudget)
        }
        submitData.append('servicesAuthorized', JSON.stringify(trackingData.servicesAuthorized))
      }

      if (serviceKey === 'visa') {
        submitData.append('visaDetails', JSON.stringify(trackingData.visaDetails))
      }

      if (serviceKey === 'schoolSearch') {
        submitData.append('kids', JSON.stringify(caseData.kids))
      }

      if (documents.length > 0) {
        submitData.append('documentType', documentType)
        documents.forEach((file) => {
          submitData.append('documents', file)
        })
      }

      const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'
      const response = await axios.put(`${BASE_API_URL}/cases/${id}/tracking`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success(`${serviceKey} details updated successfully!`)
      setDocuments([]) // clear temp files

      // Refresh
      fetchCaseDetails()
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update tracking details.')
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleUpdateMetadata = async (e) => {
    e.preventDefault()
    setTrackingLoading(true)

    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null

      await axios.put(`${BASE_API_URL}/cases/${id}/tracking`, {
        hostPhoneNumber: trackingData.hostPhoneNumber
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success('Case metadata updated!')
      fetchCaseDetails()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update metadata.')
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'
      await axios.put(
        `${BASE_API_URL}/cases/${id}/tracking`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success('Status updated!')
      fetchCaseDetails()
    } catch (err) {
      toast.error('Could not update status')
    }
  }

  const handleAssignCaseManager = async (managerId) => {
    setAssigningCaseManager(true)
    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      await axios.put(
        `${BASE_API_URL}/cases/${id}/tracking`,
        { assignedCaseManager: managerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success('Case Manager assigned!')
      fetchCaseDetails()
    } catch (err) {
      toast.error('Could not assign Case Manager')
    } finally {
      setAssigningCaseManager(false)
    }
  }

  const handleDeleteCase = async () => {
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
          const token = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')).token
            : null
          await axios.delete(`${BASE_API_URL}/cases/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          toast.success('Case deleted successfully')
          navigate('/cases')
        } catch (error) {
          console.error('Error deleting case:', error)
          toast.error(error.response?.data?.message || 'Failed to delete case')
        }
      }
    })
  }

  if (loading || !caseData) {
    return (
      <div className="text-center mt-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  const services = caseData.servicesAuthorized || {}

  // Format dates for inputs (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const StatusStepper = ({ currentStatus }) => {
    const steps = ['Initiated', 'In Progress', 'Completed']
    const currentIndex = steps.indexOf(currentStatus)
    const cancelled = currentStatus === 'Cancelled'

    if (cancelled) {
      return (
        <div className="d-flex align-items-center justify-content-center p-3 mb-4 bg-light rounded border border-danger">
          <CBadge color="danger" className="p-2 fs-6">
            THIS CASE IS CANCELLED
          </CBadge>
        </div>
      )
    }

    return (
      <div className="mb-5 mt-2">
        <div className="d-flex justify-content-between position-relative">
          {/* Progress Bar Background */}
          <div
            className="position-absolute w-100"
            style={{
              height: '4px',
              backgroundColor: '#e0e0e0',
              top: '18px',
              zIndex: 0,
            }}
          ></div>
          {/* Active Progress Bar */}
          <div
            className="position-absolute transition-all"
            style={{
              height: '4px',
              backgroundColor: '#0d6efd',
              top: '18px',
              width: `${(currentIndex / (steps.length - 1)) * 100}%`,
              zIndex: 1,
              transition: 'width 0.5s ease',
            }}
          ></div>

          {steps.map((step, index) => {
            const isActive = index <= currentIndex
            const isCurrent = index === currentIndex
            return (
              <div
                key={step}
                className="d-flex flex-column align-items-center position-relative"
                style={{ zIndex: 2, width: '100px' }}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center border-3 transition-all ${
                    isActive ? 'bg-primary border-primary text-white' : 'bg-white border-light text-muted'
                  }`}
                  style={{
                    width: '40px',
                    height: '40px',
                    boxShadow: isCurrent ? '0 0 15px rgba(13, 110, 253, 0.5)' : 'none',
                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isActive && index < currentIndex ? (
                    <CIcon icon={cilCheckCircle} />
                  ) : (
                    <span className="fw-bold">{index + 1}</span>
                  )}
                </div>
                <div
                  className={`mt-2 small fw-bold text-center ${isActive ? 'text-primary' : 'text-muted'}`}
                >
                  {step}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Case: {caseData.assigneeName}</strong>
            <div>
              <CBadge
                color={
                  caseData.status === 'Completed'
                    ? 'success'
                    : caseData.status === 'In Progress'
                      ? 'warning'
                      : 'primary'
                }
                className="me-2 fs-6"
              >
                {caseData.status}
              </CBadge>
              <CButton
                color="info"
                size="sm"
                variant="outline"
                onClick={() => setShowTimeline(true)}
                className="me-2"
              >
                <CIcon icon={cilHistory} className="me-2" />
                Timeline
              </CButton>
              {isCaseManagerOrAdmin && (
                <CFormSelect
                  size="sm"
                  className="d-inline-block w-auto me-2 border-primary text-primary fw-bold"
                  value={caseData.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Initiated">Initiated</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </CFormSelect>
              )}
              {isAdmin && (
                <CButton color="danger" size="sm" variant="outline" onClick={handleDeleteCase}>
                  Delete Case
                </CButton>
              )}
            </div>
          </CCardHeader>
          <CCardBody>
            <StatusStepper currentStatus={caseData.status} />
            <CNav variant="tabs" className="mb-4">
              <CNavItem>
                <CNavLink
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  style={{ cursor: 'pointer' }}
                >
                  Overview & Details
                </CNavLink>
              </CNavItem>

              {/* Dynamic Tabs based on authorized services */}
              {services.homeSearch && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'homeSearch'}
                    onClick={() => setActiveTab('homeSearch')}
                    style={{ cursor: 'pointer' }}
                  >
                    Home Search
                  </CNavLink>
                </CNavItem>
              )}
              {services.orientationProgram && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'orientation'}
                    onClick={() => setActiveTab('orientation')}
                    style={{ cursor: 'pointer' }}
                  >
                    Orientation
                  </CNavLink>
                </CNavItem>
              )}
              {services.schoolSearch && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'schoolSearch'}
                    onClick={() => setActiveTab('schoolSearch')}
                    style={{ cursor: 'pointer' }}
                  >
                    School Search
                  </CNavLink>
                </CNavItem>
              )}
              {services.visaApplication && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'visa'}
                    onClick={() => setActiveTab('visa')}
                    style={{ cursor: 'pointer' }}
                  >
                    Visa
                  </CNavLink>
                </CNavItem>
              )}
              {services.tenancyManagement && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'tenancyManagement'}
                    onClick={() => setActiveTab('tenancyManagement')}
                    style={{ cursor: 'pointer' }}
                  >
                    Tenancy Management
                  </CNavLink>
                </CNavItem>
              )}
              {services.aadharCard && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'aadharCard'}
                    onClick={() => setActiveTab('aadharCard')}
                    style={{ cursor: 'pointer' }}
                  >
                    Aadhar Card
                  </CNavLink>
                </CNavItem>
              )}
              <CNavItem>
                <CNavLink
                  active={activeTab === 'documents'}
                  onClick={() => setActiveTab('documents')}
                  style={{ cursor: 'pointer' }}
                >
                  All Documents
                </CNavLink>
              </CNavItem>
            </CNav>

            <CTabContent>
              {/* OVERVIEW TAB */}
              <CTabPane visible={activeTab === 'overview'}>
                {isAdmin && (
                  <CRow className="mb-4">
                    <CCol md={6}>
                      <h6 className="border-bottom pb-2">Assign Case Manager</h6>
                      <div className="d-flex align-items-center">
                        <CFormSelect
                          className="me-2"
                          style={{
                            borderRadius: '8px',
                            height: '48px',
                            paddingTop: '0',
                            paddingBottom: '0',
                          }}
                          value={selectedCaseManagerId}
                          onChange={(e) => setSelectedCaseManagerId(e.target.value)}
                          disabled={assigningCaseManager}
                        >
                          <option value="">Select Case Manager...</option>
                          {caseManagers.map((cm) => (
                            <option key={cm.id} value={cm.id}>
                              {cm.username} ({cm.email})
                            </option>
                          ))}
                        </CFormSelect>
                        <CButton
                          className="px-4 d-flex align-items-center justify-content-center"
                          style={{
                            background: 'linear-gradient(45deg, #0d6efd 0%, #004dc0 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 15px rgba(13, 110, 253, 0.2)',
                            transition: 'all 0.3s ease',
                            fontWeight: '600',
                            color: 'white',
                            height: '46px',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 110, 253, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(13, 110, 253, 0.2)'
                          }}
                          onClick={() => handleAssignCaseManager(selectedCaseManagerId)}
                          disabled={assigningCaseManager || !selectedCaseManagerId}
                        >
                          {assigningCaseManager ? (
                            <CSpinner size="sm" className="me-2" />
                          ) : (
                            <CIcon icon={cilCheckCircle} className="me-2" />
                          )}
                          Assign Case
                        </CButton>
                      </div>
                    </CCol>
                  </CRow>
                )}
                {isCaseManagerOrAdmin && (
                  <CRow className="mb-4">
                    <CCol md={6}>
                      <h6 className="border-bottom pb-2">Host Contact Details</h6>
                      <div className="d-flex align-items-center">
                        <CFormInput
                          className="me-2"
                          placeholder="Host Phone Number..."
                          value={trackingData.hostPhoneNumber}
                          onChange={(e) => handleRootTrackingChange('hostPhoneNumber', e.target.value)}
                          style={{ borderRadius: '8px', height: '48px' }}
                        />
                        <CButton
                          color="primary"
                          className="px-4 d-flex align-items-center justify-content-center"
                          style={{
                            borderRadius: '8px',
                            height: '46px',
                            whiteSpace: 'nowrap',
                            fontWeight: '600',
                          }}
                          onClick={(e) => handleUpdateMetadata(e)}
                          disabled={trackingLoading}
                        >
                          {trackingLoading ? <CSpinner size="sm" /> : 'Update Host Phone'}
                        </CButton>
                      </div>
                    </CCol>
                  </CRow>
                )}
                <CRow>
                  <CCol md={6}>
                    <h6 className="border-bottom pb-2">Assignee Information</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted w-25">Entity</td>
                          <td>{caseData.billingEntity || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Origin</td>
                          <td>
                            {caseData.movingFromCity || ''}
                            {caseData.movingFromCity && caseData.movingFromCountry ? ', ' : ''}
                            {caseData.movingFromCountry || ''}
                            &nbsp;&rarr;&nbsp;
                            {caseData.city || ''}
                            {caseData.city && caseData.movingToCountry ? ', ' : ''}
                            {caseData.movingToCountry || ''}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted w-25">Relocation Type</td>
                          <td>
                            <CBadge
                              color={
                                caseData.relocationType === 'International' ? 'info' : 'secondary'
                              }
                            >
                              {caseData.relocationType || 'Not specified'}
                            </CBadge>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted">Phone</td>
                          <td>{caseData.mobileNumber || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Host Phone</td>
                          <td>{caseData.hostPhoneNumber || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Emails</td>
                          <td>
                            {caseData.officialEmailAddress}
                            <br />
                            {caseData.personalEmailAddress}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted">Case Manager</td>
                          <td>
                            <strong>
                              {caseData.assignedCaseManager?.username || 'Not assigned'}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </CCol>
                  <CCol md={6}>
                    <h6 className="border-bottom pb-2">Family & Budget</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted w-25">Family</td>
                          <td>
                            {caseData.movingWithFamily} ({caseData.kids?.length || 0} Kids)
                            {caseData.kids && caseData.kids.length > 0 && (
                              <div className="mt-2 small text-muted">
                                {caseData.kids.map((kid, idx) => (
                                  <div key={idx}>
                                    Kid {idx + 1}: {kid.name || 'N/A'} (Age: {kid.age || 'N/A'})
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                        {services.homeSearch && (
                          <>
                            <tr>
                              <td className="text-muted">Housing Budget</td>
                              <td>₹ {caseData.homeSearchBudget || 'Not specified'}</td>
                            </tr>
                            <tr>
                              <td className="text-muted">Lease Type</td>
                              <td>
                                {caseData.servicesAuthorized?.personalLease && (
                                  <CBadge color="info" className="me-1">
                                    Personal Lease
                                  </CBadge>
                                )}
                                {caseData.servicesAuthorized?.corporateLease && (
                                  <CBadge color="info">Corporate Lease</CBadge>
                                )}
                                {!caseData.servicesAuthorized?.personalLease &&
                                  !caseData.servicesAuthorized?.corporateLease &&
                                  'Not specified'}
                              </td>
                            </tr>
                          </>
                        )}
                        {services.visaApplication && (
                          <tr>
                            <td className="text-muted">Visa Details</td>
                            <td>
                              {(caseData.visaDetails?.businessVisa && 'Business ') || ''}
                              {(caseData.visaDetails?.employmentVisa && 'Employment ') || ''}
                              {(caseData.visaDetails?.touristVisa && 'Tourist ') || ''}
                              {(caseData.visaDetails?.frro && 'FRRO ') || ''}
                              {(caseData.visaDetails?.visaExtension && 'Extension ') || ''}
                            </td>
                          </tr>
                        )}
                        {services.householdGoodsMovement && (
                          <tr>
                            <td className="text-muted">HHG Limit</td>
                            <td>{caseData.householdGoodsLimit || 'Not specified'}</td>
                          </tr>
                        )}
                        {services.other && caseData.otherServiceRequest && (
                          <tr>
                            <td className="text-muted">Other Req</td>
                            <td>{caseData.otherServiceRequest}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </CCol>
                </CRow>
                <CRow className="mt-3">
                  <CCol>
                    <h6 className="border-bottom pb-2">Additional Comments (HR)</h6>
                    <p className="p-3 bg-light rounded text-muted">
                      {caseData.additionalComments || 'No comments provided.'}
                    </p>
                  </CCol>
                </CRow>
              </CTabPane>

              {/* HOME SEARCH TAB */}
              <CTabPane visible={activeTab === 'homeSearch'}>
                <CForm onSubmit={(e) => handleUpdateTracking(e, 'homeSearch')}>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Home Search Start Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.homeSearch.startDate)}
                        onChange={(e) =>
                          handleTrackingChange('homeSearch', 'startDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>Home Search End Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.homeSearch.endDate)}
                        onChange={(e) =>
                          handleTrackingChange('homeSearch', 'endDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>
                  <CRow className="mb-3">
                    <CCol md={12}>
                      {!caseData.servicesAuthorized?.personalLease &&
                      !caseData.servicesAuthorized?.corporateLease ? (
                        <div className="p-3 bg-light rounded border border-warning">
                          <CFormLabel className="fw-bold text-warning mb-2">
                            Select Authorized Lease Type (Required):
                          </CFormLabel>
                          <div className="d-flex gap-4">
                            <CFormCheck
                              id="personalLeaseSelect"
                              label="Personal Lease"
                              checked={trackingData.servicesAuthorized?.personalLease || false}
                              onChange={(e) =>
                                handleNestedRootChange(
                                  'servicesAuthorized',
                                  'personalLease',
                                  e.target.checked,
                                )
                              }
                              disabled={!canEditTracking}
                            />
                            <CFormCheck
                              id="corporateLeaseSelect"
                              label="Corporate Lease"
                              checked={trackingData.servicesAuthorized?.corporateLease || false}
                              onChange={(e) =>
                                handleNestedRootChange(
                                  'servicesAuthorized',
                                  'corporateLease',
                                  e.target.checked,
                                )
                              }
                              disabled={!canEditTracking}
                            />
                          </div>
                          <small className="text-muted d-block mt-2">
                            * This selection will be locked after saving.
                          </small>
                        </div>
                      ) : (
                        <div className="p-2 bg-light rounded d-flex align-items-center">
                          <span className="me-2 fw-bold text-muted small">
                            AUTHORIZED LEASE TYPE:
                          </span>
                          {caseData.servicesAuthorized?.personalLease && (
                            <CBadge color="primary" className="me-2">
                              Personal Lease
                            </CBadge>
                          )}
                          {caseData.servicesAuthorized?.corporateLease && (
                            <CBadge color="primary">Corporate Lease</CBadge>
                          )}
                        </div>
                      )}
                    </CCol>
                  </CRow>
                  <CRow className="mb-3">
                    <CCol md={12}>
                      <CFormLabel>Property Address</CFormLabel>
                      <CFormInput
                        value={trackingData.homeSearch.propertyAddress || ''}
                        onChange={(e) =>
                          handleTrackingChange('homeSearch', 'propertyAddress', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>
                  <CRow className="mb-3">
                    <CCol md={3}>
                      <CFormLabel>Monthly Rent</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>₹</CInputGroupText>
                        <CFormInput
                          type="number"
                          value={trackingData.homeSearch.monthlyRent || ''}
                          onChange={(e) =>
                            handleTrackingChange('homeSearch', 'monthlyRent', e.target.value)
                          }
                          disabled={!canEditTracking}
                        />
                      </CInputGroup>
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Budget</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>₹</CInputGroupText>
                        <CFormInput
                          type="number"
                          value={trackingData.homeSearchBudget || ''}
                          onChange={(e) =>
                            handleRootTrackingChange('homeSearchBudget', e.target.value)
                          }
                          disabled={!canEditTracking}
                        />
                      </CInputGroup>
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Deposit</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>₹</CInputGroupText>
                        <CFormInput
                          type="number"
                          value={trackingData.homeSearch.deposit || ''}
                          onChange={(e) =>
                            handleTrackingChange('homeSearch', 'deposit', e.target.value)
                          }
                          disabled={!canEditTracking}
                        />
                      </CInputGroup>
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Lease Start Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.homeSearch.leaseStartDate)}
                        onChange={(e) =>
                          handleTrackingChange('homeSearch', 'leaseStartDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Lease End Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.homeSearch.leaseEndDate)}
                        onChange={(e) =>
                          handleTrackingChange('homeSearch', 'leaseEndDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>

                  {canEditTracking && (
                    <div className="bg-light p-3 rounded mt-4">
                      <h6>Upload Home Search Milestone Documents</h6>
                      <CRow className="align-items-end">
                        <CCol md={4}>
                          <CFormLabel>Document Type</CFormLabel>
                          <CFormSelect
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                          >
                            <option value="House Lease">House Lease</option>
                            <option value="Property Listing">Property Listing</option>
                            <option value="Other">Other</option>
                          </CFormSelect>
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel>File(s)</CFormLabel>
                          <CFormInput type="file" multiple onChange={handleDocumentChange} />
                        </CCol>
                        <CCol md={2}>
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={trackingLoading}
                            className="w-100"
                          >
                            {trackingLoading ? <CSpinner size="sm" /> : 'Save & Upload'}
                          </CButton>
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </CForm>
              </CTabPane>

              {/* VISA TAB */}
              <CTabPane visible={activeTab === 'visa'}>
                <CForm onSubmit={(e) => handleUpdateTracking(e, 'visa')}>
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel>Visa Start Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.visa.startDate)}
                        onChange={(e) => handleTrackingChange('visa', 'startDate', e.target.value)}
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Visa End Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.visa.endDate)}
                        onChange={(e) => handleTrackingChange('visa', 'endDate', e.target.value)}
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Visa Type</CFormLabel>
                      <CFormInput
                        value={trackingData.visa.type || ''}
                        onChange={(e) => handleTrackingChange('visa', 'type', e.target.value)}
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={2}>
                      <CFormCheck
                        label="Business Visa"
                        checked={trackingData.visaDetails?.businessVisa || false}
                        onChange={(e) =>
                          handleNestedRootChange('visaDetails', 'businessVisa', e.target.checked)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={2}>
                      <CFormCheck
                        label="Employment Visa"
                        checked={trackingData.visaDetails?.employmentVisa || false}
                        onChange={(e) =>
                          handleNestedRootChange('visaDetails', 'employmentVisa', e.target.checked)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={2}>
                      <CFormCheck
                        label="Tourist Visa"
                        checked={trackingData.visaDetails?.touristVisa || false}
                        onChange={(e) =>
                          handleNestedRootChange('visaDetails', 'touristVisa', e.target.checked)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={2}>
                      <CFormCheck
                        label="FRRO"
                        checked={trackingData.visaDetails?.frro || false}
                        onChange={(e) =>
                          handleNestedRootChange('visaDetails', 'frro', e.target.checked)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormCheck
                        label="Visa Extension"
                        checked={trackingData.visaDetails?.visaExtension || false}
                        onChange={(e) =>
                          handleNestedRootChange('visaDetails', 'visaExtension', e.target.checked)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>

                  {trackingData.visaDetails?.frro && (
                    <CRow className="mb-3">
                      <CCol md={4}>
                        <CFormLabel>FRRO Start Date</CFormLabel>
                        <CFormInput
                          type="date"
                          value={formatDateForInput(trackingData.visa.frroStartDate)}
                          onChange={(e) =>
                            handleTrackingChange('visa', 'frroStartDate', e.target.value)
                          }
                          disabled={!canEditTracking}
                        />
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel>FRRO End Date</CFormLabel>
                        <CFormInput
                          type="date"
                          value={formatDateForInput(trackingData.visa.frroEndDate)}
                          onChange={(e) =>
                            handleTrackingChange('visa', 'frroEndDate', e.target.value)
                          }
                          disabled={!canEditTracking}
                        />
                      </CCol>
                    </CRow>
                  )}

                  {canEditTracking && (
                    <div className="bg-light p-3 rounded mt-4">
                      <h6>Upload Visa Milestone Documents</h6>
                      <CRow className="align-items-end">
                        <CCol md={4}>
                          <CFormLabel>Document Type</CFormLabel>
                          <CFormSelect
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                          >
                            <option value="Visa Copy">Visa Copy</option>
                            <option value="Passport Copy">Passport Copy</option>
                            <option value="FRRO Document">FRRO Document</option>
                            <option value="Visa Extension Document">Visa Extension Document</option>
                          </CFormSelect>
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel>File(s)</CFormLabel>
                          <CFormInput type="file" multiple onChange={handleDocumentChange} />
                        </CCol>
                        <CCol md={2}>
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={trackingLoading}
                            className="w-100"
                          >
                            {trackingLoading ? <CSpinner size="sm" /> : 'Save & Upload'}
                          </CButton>
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </CForm>
              </CTabPane>

              {/* ORIENTATION TAB */}
              <CTabPane visible={activeTab === 'orientation'}>
                <CForm onSubmit={(e) => handleUpdateTracking(e, 'orientation')}>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Start Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.orientation.startDate)}
                        onChange={(e) =>
                          handleTrackingChange('orientation', 'startDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>End Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.orientation.endDate)}
                        onChange={(e) =>
                          handleTrackingChange('orientation', 'endDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>
                  {canEditTracking && (
                    <div className="bg-light p-3 rounded mt-4">
                      <CRow className="align-items-end">
                        <CCol md={4}>
                          <CFormLabel>Document Type</CFormLabel>
                          <CFormSelect
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                          >
                            <option value="Itinerary Upload">Itinerary Upload</option>
                          </CFormSelect>
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel>File</CFormLabel>
                          <CFormInput type="file" onChange={handleDocumentChange} />
                        </CCol>
                        <CCol md={2}>
                          <CButton type="submit" color="primary" className="w-100">
                            Save
                          </CButton>
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </CForm>
              </CTabPane>

              {/* SCHOOL SEARCH TAB */}
              <CTabPane visible={activeTab === 'schoolSearch'}>
                <CForm onSubmit={(e) => handleUpdateTracking(e, 'schoolSearch')}>
                  <CRow className="mb-3">
                    <CCol md={3}>
                      <CFormLabel>Start Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.schoolSearch.startDate)}
                        onChange={(e) =>
                          handleTrackingChange('schoolSearch', 'startDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>End Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.schoolSearch.endDate)}
                        onChange={(e) =>
                          handleTrackingChange('schoolSearch', 'endDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>

                  {caseData && caseData.kids && caseData.kids.length > 0 && (
                    <div className="mt-4 p-3 border rounded bg-white">
                      <h6 className="mb-3">Children Details for Schooling</h6>
                      {caseData.kids.map((kid, index) => (
                        <div key={index} className="mb-4 pb-3 border-bottom">
                          <strong className="d-block mb-3 text-secondary">
                            Kid {index + 1} Profile
                          </strong>
                          <CRow className="mb-3 align-items-end">
                            <CCol md={4}>
                              <CFormLabel className="small">Name</CFormLabel>
                              <CFormInput
                                size="sm"
                                value={kid.name || ''}
                                disabled={!canEditTracking}
                                onChange={(e) => {
                                  const newKids = [...caseData.kids]
                                  newKids[index].name = e.target.value
                                  setCaseData((prev) => ({ ...prev, kids: newKids }))
                                }}
                              />
                            </CCol>
                            <CCol md={2}>
                              <CFormLabel className="small">Age</CFormLabel>
                              <CFormInput
                                size="sm"
                                type="number"
                                value={kid.age || ''}
                                disabled={!canEditTracking}
                                onChange={(e) => {
                                  const newKids = [...caseData.kids]
                                  newKids[index].age = e.target.value
                                  setCaseData((prev) => ({ ...prev, kids: newKids }))
                                }}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel className="small">Admitting Grade</CFormLabel>
                              <CFormInput
                                size="sm"
                                value={kid.grade || ''}
                                disabled={!canEditTracking}
                                onChange={(e) => {
                                  const newKids = [...caseData.kids]
                                  newKids[index].grade = e.target.value
                                  setCaseData((prev) => ({ ...prev, kids: newKids }))
                                }}
                                placeholder="e.g. 5th Grade"
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel className="small">Type of School</CFormLabel>
                              <CFormSelect
                                size="sm"
                                value={kid.typeOfSchool || ''}
                                disabled={!canEditTracking}
                                onChange={(e) => {
                                  const newKids = [...caseData.kids]
                                  newKids[index].typeOfSchool = e.target.value
                                  setCaseData((prev) => ({ ...prev, kids: newKids }))
                                }}
                              >
                                <option value="">Select...</option>
                                <option value="CBSE">CBSE</option>
                                <option value="ICSE">ICSE</option>
                                <option value="International Board">Intl Board</option>
                                <option value="Other">Other</option>
                              </CFormSelect>
                            </CCol>
                          </CRow>
                          <CRow>
                            <CCol md={4}>
                              <CFormLabel className="small">School Name</CFormLabel>
                              <CFormInput
                                size="sm"
                                value={kid.schoolName || ''}
                                disabled={!canEditTracking}
                                onChange={(e) => {
                                  const newKids = [...caseData.kids]
                                  newKids[index].schoolName = e.target.value
                                  setCaseData((prev) => ({ ...prev, kids: newKids }))
                                }}
                                placeholder="Enter school name"
                              />
                            </CCol>
                            <CCol md={8}>
                              <CFormLabel className="small">School Address</CFormLabel>
                              <CFormInput
                                size="sm"
                                value={kid.schoolAddress || ''}
                                disabled={!canEditTracking}
                                onChange={(e) => {
                                  const newKids = [...caseData.kids]
                                  newKids[index].schoolAddress = e.target.value
                                  setCaseData((prev) => ({ ...prev, kids: newKids }))
                                }}
                                placeholder="Enter school address"
                              />
                            </CCol>
                          </CRow>
                        </div>
                      ))}
                    </div>
                  )}
                  {canEditTracking && (
                    <div className="bg-light p-3 rounded mt-4">
                      <CRow className="align-items-end">
                        <CCol md={4}>
                          <CFormLabel>Document Type</CFormLabel>
                          <CFormSelect
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                          >
                            <option value="School Listing">School Listing</option>
                          </CFormSelect>
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel>File</CFormLabel>
                          <CFormInput type="file" onChange={handleDocumentChange} />
                        </CCol>
                        <CCol md={2}>
                          <CButton type="submit" color="primary" className="w-100">
                            Save
                          </CButton>
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </CForm>
              </CTabPane>

              {/* TENANCY MANAGEMENT TAB */}
              <CTabPane visible={activeTab === 'tenancyManagement'}>
                <CForm onSubmit={(e) => handleUpdateTracking(e, 'tenancyManagement')}>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Start Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.tenancyManagement.startDate)}
                        onChange={(e) =>
                          handleTrackingChange('tenancyManagement', 'startDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>End Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.tenancyManagement.endDate)}
                        onChange={(e) =>
                          handleTrackingChange('tenancyManagement', 'endDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>
                  {canEditTracking && (
                    <CButton type="submit" color="primary" className="mt-2">
                      Save Dates
                    </CButton>
                  )}
                </CForm>
              </CTabPane>

              {/* AADHAR CARD TAB */}
              <CTabPane visible={activeTab === 'aadharCard'}>
                <CForm onSubmit={(e) => handleUpdateTracking(e, 'aadharCard')}>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Expiry Date</CFormLabel>
                      <CFormInput
                        type="date"
                        value={formatDateForInput(trackingData.aadharCard.expiryDate)}
                        onChange={(e) =>
                          handleTrackingChange('aadharCard', 'expiryDate', e.target.value)
                        }
                        disabled={!canEditTracking}
                      />
                    </CCol>
                  </CRow>
                  {canEditTracking && (
                    <div className="bg-light p-3 rounded mt-4">
                      <h6>Upload Aadhar Card Documents</h6>
                      <CRow className="align-items-end">
                        <CCol md={4}>
                          <CFormLabel>Document Type</CFormLabel>
                          <CFormSelect
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                          >
                            <option value="Aadhar Card Document">Aadhar Card Document</option>
                          </CFormSelect>
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel>File</CFormLabel>
                          <CFormInput type="file" onChange={handleDocumentChange} />
                        </CCol>
                        <CCol md={2}>
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={trackingLoading}
                            className="w-100"
                          >
                            {trackingLoading ? <CSpinner size="sm" /> : 'Save & Upload'}
                          </CButton>
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </CForm>
              </CTabPane>

              {/* DOCUMENTS REPOSITORY TAB */}
              <CTabPane visible={activeTab === 'documents'}>
                {caseData.documents && caseData.documents.length > 0 ? (
                  <CListGroup>
                    {caseData.documents.map((doc) => (
                      <CListGroupItem
                        key={doc._id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{doc.originalName}</strong>{' '}
                          <CBadge color="secondary" className="ms-2">
                            {doc.documentType}
                          </CBadge>
                          <div className="small text-muted mt-1">
                            Uploaded by {doc.uploadedByRole} on{' '}
                            {new Date(doc.uploadDate).toLocaleString()}
                          </div>
                        </div>
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          href={`${BASE_API_URL.replace('/api', '')}/${doc.path}`}
                          target="_blank"
                        >
                          View/Download
                        </CButton>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                ) : (
                  <p className="text-muted text-center pt-3">No documents uploaded yet.</p>
                )}
              </CTabPane>
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>
      {/* Timeline Modal */}
      <CModal visible={showTimeline} onClose={() => setShowTimeline(false)} size="lg">
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilHistory} className="me-2" />
            Case Timeline & History
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {/* Summary Dates at Top */}
          <CRow className="mb-4 g-3">
            <CCol md={6}>
              <div className="p-3 bg-light rounded border-start border-primary border-4 shadow-sm">
                <div className="small text-muted text-uppercase fw-bold mb-1">Created On</div>
                <div className="fs-5 fw-bold text-dark">
                  {new Date(caseData.createdAt).toLocaleDateString(undefined, {
                    dateStyle: 'long',
                  })}
                </div>
                <div className="small text-muted">
                  {new Date(caseData.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </CCol>
            <CCol md={6}>
              <div
                className={`p-3 rounded border-start border-4 shadow-sm ${
                  caseData.status === 'Completed'
                    ? 'bg-light border-success'
                    : 'bg-white border-light text-muted'
                }`}
              >
                <div className="small text-muted text-uppercase fw-bold mb-1">Completed On</div>
                {caseData.status === 'Completed' ? (
                  <>
                    <div className="fs-5 fw-bold text-success">
                      {new Date(
                        caseData.timeline?.find(
                          (t) => t.event === 'Status Updated' && t.description.includes('Completed'),
                        )?.timestamp || caseData.updatedAt,
                      ).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </div>
                    <div className="small text-muted">
                      {new Date(
                        caseData.timeline?.find(
                          (t) => t.event === 'Status Updated' && t.description.includes('Completed'),
                        )?.timestamp || caseData.updatedAt,
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </>
                ) : (
                  <div className="fs-5 fw-bold text-muted italic">In Progress...</div>
                )}
              </div>
            </CCol>
          </CRow>

          <div
            className="timeline-container px-3"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {caseData.timeline && caseData.timeline.length > 0 ? (
              <div className="position-relative">
                {/* Vertical Line */}
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

                {[...caseData.timeline].reverse().map((item, index) => (
                  <div key={index} className="ps-4 pb-4 position-relative">
                    {/* Dot */}
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
                        <p className="mb-2 text-dark" style={{ fontSize: '0.95rem' }}>
                          {item.description}
                        </p>
                        <div className="d-flex align-items-center mt-2 pt-2 border-top">
                          <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                            style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
                          >
                            {(item.user?.username || 'S')[0].toUpperCase()}
                          </div>
                          <small className="text-secondary fw-medium">
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
                <p className="text-muted">No timeline events recorded yet.</p>
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

export default CaseDetails

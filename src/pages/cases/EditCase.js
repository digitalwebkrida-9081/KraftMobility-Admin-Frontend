import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormCheck,
  CFormTextarea,
  CRow,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authService } from 'src/services/authService'

const COUNTRY_LIST = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
  'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China',
  'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
]

const EMPLOYER_ORGANIZATIONS = [
  'Tata Electronics Products and Solutions Private Limited (TEPS)',
  'TATA Electronics Pvt Ltd(TEPL)',
  'TATA ELECTRONICS SYSTEMS SOLUTIONS PRIVATE LIMITED',
  'TATA SemiConductor and Assembly and Test Pvt Ltd(TSAT)',
  'TATA SemiConductor Manufacturing Pvt Ltd(TSMPL)',
]

const EditCase = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const loading = useSelector((state) => state.loading)
  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

  const [activeTab, setActiveTab] = useState('basics')

  const [formData, setFormData] = useState({
    relocationId: '',
    assigneeName: '',
    assignmentStartDate: '',
    billingEntity: '',
    employer: '',
    gender: '',
    maritalStatus: '',
    movingWithFamily: '',
    movingFromCountry: '',
    movingFromCity: '',
    movingToCountry: '',
    city: '',
    currentHomeTelephoneNumber: '',
    mobileNumber: '',
    hostPhoneNumber: '',
    officialEmailAddress: '',
    personalEmailAddress: '',
    currentHomeAddress: '',
    empNumber: '',
    spouseName: '',
    numberOfKids: 0,
    kids: [],
    relocationType: '',
    servicesAuthorized: {
      homeSearch: false,
      personalLease: false,
      corporateLease: false,
      orientationProgram: false,
      householdGoodsMovement: false,
      schoolSearch: false,
      simCardConnection: false,
      tenancyManagement: false,
      visaApplication: false,
      departure: false,
      aadharCard: false,
      cForm: false,
      petShipment: false,
      other: false,
    },
    homeSearchBudget: '',
    householdGoodsLimit: '',
    visaDetails: {
      businessVisa: false,
      employmentVisa: false,
      touristVisa: false,
      frro: false,
      visaExtension: false,
    },
    otherServiceRequest: '',
    additionalComments: '',
    status: '',
  })

  const [isManualEmployer, setIsManualEmployer] = useState(false)

  useEffect(() => {
    fetchCaseDetails()
  }, [id])

  const fetchCaseDetails = async () => {
    try {
      dispatch({ type: 'set_loading', loading: true })
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null

      const response = await axios.get(`${BASE_API_URL}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data
      setFormData({
        relocationId: data.relocationId || '',
        assigneeName: data.assigneeName || '',
        assignmentStartDate: data.assignmentStartDate ? new Date(data.assignmentStartDate).toISOString().split('T')[0] : '',
        billingEntity: data.billingEntity || '',
        employer: data.employer || '',
        gender: data.gender || '',
        maritalStatus: data.maritalStatus || '',
        movingWithFamily: data.movingWithFamily || '',
        movingFromCountry: data.movingFromCountry || '',
        movingFromCity: data.movingFromCity || '',
        movingToCountry: data.movingToCountry || '',
        city: data.city || '',
        currentHomeTelephoneNumber: data.currentHomeTelephoneNumber || '',
        mobileNumber: data.mobileNumber || '',
        hostPhoneNumber: data.hostPhoneNumber || '',
        officialEmailAddress: data.officialEmailAddress || '',
        personalEmailAddress: data.personalEmailAddress || '',
        currentHomeAddress: data.currentHomeAddress || '',
        empNumber: data.empNumber || '',
        spouseName: data.spouseName || '',
        numberOfKids: data.numberOfKids || 0,
        kids: data.kids || [],
        relocationType: data.relocationType || '',
        servicesAuthorized: {
          homeSearch: data.servicesAuthorized?.homeSearch || false,
          personalLease: data.servicesAuthorized?.personalLease || false,
          corporateLease: data.servicesAuthorized?.corporateLease || false,
          orientationProgram: data.servicesAuthorized?.orientationProgram || false,
          householdGoodsMovement: data.servicesAuthorized?.householdGoodsMovement || false,
          schoolSearch: data.servicesAuthorized?.schoolSearch || false,
          simCardConnection: data.servicesAuthorized?.simCardConnection || false,
          tenancyManagement: data.servicesAuthorized?.tenancyManagement || false,
          visaApplication: data.servicesAuthorized?.visaApplication || false,
          departure: data.servicesAuthorized?.departure || false,
          aadharCard: data.servicesAuthorized?.aadharCard || false,
          cForm: data.servicesAuthorized?.cForm || false,
          petShipment: data.servicesAuthorized?.petShipment || false,
          other: data.servicesAuthorized?.other || false,
        },
        homeSearchBudget: data.homeSearchBudget || '',
        householdGoodsLimit: data.householdGoodsLimit || '',
        visaDetails: {
          businessVisa: data.visaDetails?.businessVisa || false,
          employmentVisa: data.visaDetails?.employmentVisa || false,
          touristVisa: data.visaDetails?.touristVisa || false,
          frro: data.visaDetails?.frro || false,
          visaExtension: data.visaDetails?.visaExtension || false,
        },
        otherServiceRequest: data.otherServiceRequest || '',
        additionalComments: data.additionalComments || '',
        status: data.status || '',
      })

      const isManual = data.employer && !EMPLOYER_ORGANIZATIONS.includes(data.employer)
      setIsManualEmployer(isManual)
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
      navigate('/cases')
    } finally {
      dispatch({ type: 'set_loading', loading: false })
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox' && name.startsWith('visa_')) {
      const visaKey = name.split('_')[1]
      setFormData((prev) => ({
        ...prev,
        visaDetails: { ...prev.visaDetails, [visaKey]: checked },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (name === 'maritalStatus' && value === 'Single') {
        if (activeTab === 'family') {
          setActiveTab('basics')
        }
      }
    }
  }

  const handleEmployerChange = (e) => {
    const { value } = e.target
    if (value === 'OTHER') {
      setIsManualEmployer(true)
      setFormData((prev) => ({ ...prev, employer: '' }))
    } else {
      setIsManualEmployer(false)
      setFormData((prev) => ({ ...prev, employer: value }))
    }
  }

  const handleServiceChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      servicesAuthorized: { ...prev.servicesAuthorized, [name]: checked },
    }))
  }

  const handleKidChange = (index, field, value) => {
    const updatedKids = [...formData.kids]
    updatedKids[index] = { ...updatedKids[index], [field]: value }
    setFormData((prev) => ({ ...prev, kids: updatedKids }))
  }

  const handleNumberOfKidsChange = (e) => {
    const num = parseInt(e.target.value, 10) || 0
    let updatedKids = [...formData.kids]
    if (num > updatedKids.length) {
      for (let i = updatedKids.length; i < num; i++)
        updatedKids.push({
          name: '',
          age: '',
          grade: '',
          schoolName: '',
          schoolAddress: '',
          typeOfSchool: '',
        })
    } else {
      updatedKids = updatedKids.slice(0, num)
    }
    setFormData((prev) => ({ ...prev, numberOfKids: num, kids: updatedKids }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (!formData.assigneeName) {
      toast.error('Please enter Assignee Name')
      return
    }
    if (!formData.relocationType) {
      toast.error('Please select Relocation Type')
      return
    }

    dispatch({ type: 'set_loading', loading: true })

    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null

      await axios.put(`${BASE_API_URL}/cases/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      toast.success('Case updated successfully!')
      navigate(`/cases/${id}`)
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update case.')
    } finally {
      dispatch({ type: 'set_loading', loading: false })
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm border-0 rounded-3 overflow-hidden">
          <CCardHeader className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <strong className="fs-5 text-dark">Edit Case: {formData.assigneeName}</strong>
            <CButton
              color="secondary"
              size="sm"
              variant="outline"
              onClick={() => navigate(`/cases/${id}`)}
            >
              Cancel
            </CButton>
          </CCardHeader>
          <CCardBody className="p-4">
            <CNav variant="tabs" className="mb-4">
              <CNavItem>
                <CNavLink
                  active={activeTab === 'basics'}
                  onClick={() => setActiveTab('basics')}
                  style={{ cursor: 'pointer' }}
                >
                  Basics
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'relocation'}
                  onClick={() => setActiveTab('relocation')}
                  style={{ cursor: 'pointer' }}
                >
                  Relocation & Contact
                </CNavLink>
              </CNavItem>
              {formData.maritalStatus !== 'Single' && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'family'}
                    onClick={() => setActiveTab('family')}
                    style={{ cursor: 'pointer' }}
                  >
                    Family
                  </CNavLink>
                </CNavItem>
              )}
              <CNavItem>
                <CNavLink
                  active={activeTab === 'services'}
                  onClick={() => setActiveTab('services')}
                  style={{ cursor: 'pointer' }}
                >
                  Services & Budget
                </CNavLink>
              </CNavItem>
            </CNav>

            <CForm onSubmit={handleSubmit}>
              <CTabContent>
                {/* BASICS TAB */}
                <CTabPane visible={activeTab === 'basics'}>
                  <div className="fade-in">
                    <CRow className="mb-4">
                      <CCol md={6}>
                        <CFormLabel className="fw-bold">Relocation Category *</CFormLabel>
                        <div className="d-flex gap-3">
                          <div
                            className={`p-3 border rounded-3 flex-fill text-center ${formData.relocationType === 'Domestic' ? 'border-primary bg-light' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              setFormData(prev => ({ ...prev, relocationType: 'Domestic' }))
                            }
                          >
                            <CFormCheck
                              type="radio"
                              label={<span className="fw-bold">Domestic</span>}
                              checked={formData.relocationType === 'Domestic'}
                              onChange={() => {}}
                            />
                          </div>
                          <div
                            className={`p-3 border rounded-3 flex-fill text-center ${formData.relocationType === 'International' ? 'border-primary bg-light' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              setFormData(prev => ({ ...prev, relocationType: 'International' }))
                            }
                          >
                            <CFormCheck
                              type="radio"
                              label={<span className="fw-bold">International</span>}
                              checked={formData.relocationType === 'International'}
                              onChange={() => {}}
                            />
                          </div>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="fw-bold">Relocation ID (Read-only)</CFormLabel>
                        <CFormInput
                          value={formData.relocationId || '-'}
                          disabled
                          className="bg-light"
                        />
                      </CCol>
                    </CRow>
                    <CRow className="mb-3">
                      <CCol md={8}>
                        <CFormLabel className="small fw-bold text-muted">Assignee Full Name *</CFormLabel>
                        <CFormInput
                          required
                          name="assigneeName"
                          value={formData.assigneeName}
                          onChange={handleInputChange}
                          placeholder="Name as per passport/ID"
                        />
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Employee #</CFormLabel>
                        <CFormInput
                          name="empNumber"
                          value={formData.empNumber}
                          onChange={handleInputChange}
                          placeholder="ID Number"
                        />
                      </CCol>
                    </CRow>
                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel className="small fw-bold text-muted">Employer Organization</CFormLabel>
                        <div className="d-flex flex-column gap-2">
                          <CFormSelect
                            name="employerDropdown"
                            value={
                              isManualEmployer
                                ? 'OTHER'
                                : EMPLOYER_ORGANIZATIONS.includes(formData.employer)
                                  ? formData.employer
                                  : formData.employer === ''
                                    ? ''
                                    : 'OTHER'
                            }
                            onChange={handleEmployerChange}
                          >
                            <option value="">Select Employer...</option>
                            {EMPLOYER_ORGANIZATIONS.map((org) => (
                              <option key={org} value={org}>
                                {org}
                              </option>
                            ))}
                            <option value="OTHER">Other / Type Manually...</option>
                          </CFormSelect>
                          {isManualEmployer && (
                            <CFormInput
                              name="employer"
                              value={formData.employer}
                              onChange={handleInputChange}
                              placeholder="Enter Company Name"
                            />
                          )}
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="small fw-bold text-muted">Billing Entity</CFormLabel>
                        <CFormInput
                          name="billingEntity"
                          value={formData.billingEntity}
                          onChange={handleInputChange}
                        />
                      </CCol>
                    </CRow>
                    <CRow className="mb-3">
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Gender</CFormLabel>
                        <CFormSelect
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </CFormSelect>
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Marital Status</CFormLabel>
                        <CFormSelect
                          name="maritalStatus"
                          value={formData.maritalStatus}
                          onChange={handleInputChange}
                        >
                          <option value="">Select...</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Other">Other</option>
                        </CFormSelect>
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Case Status</CFormLabel>
                        <CFormSelect
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Initiated">Initiated</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </CFormSelect>
                      </CCol>
                    </CRow>
                  </div>
                </CTabPane>

                {/* RELOCATION TAB */}
                <CTabPane visible={activeTab === 'relocation'}>
                  <div className="fade-in">
                    <CRow className="mb-3">
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Family Relocating?</CFormLabel>
                        <CFormSelect
                          name="movingWithFamily"
                          value={formData.movingWithFamily}
                          onChange={handleInputChange}
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </CFormSelect>
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Origin Country</CFormLabel>
                        <CFormSelect
                          name="movingFromCountry"
                          value={formData.movingFromCountry}
                          onChange={handleInputChange}
                        >
                          <option value="">Select...</option>
                          {COUNTRY_LIST.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Destination Country</CFormLabel>
                        <CFormSelect
                          name="movingToCountry"
                          value={formData.movingToCountry}
                          onChange={handleInputChange}
                        >
                          <option value="">Select...</option>
                          {COUNTRY_LIST.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                    </CRow>
                    <CRow className="mb-3">
                       <CCol md={4}>
                         <CFormLabel className="small fw-bold text-muted">Origin City</CFormLabel>
                         <CFormInput
                           name="movingFromCity"
                           value={formData.movingFromCity}
                           onChange={handleInputChange}
                         />
                       </CCol>
                       <CCol md={4}>
                         <CFormLabel className="small fw-bold text-muted">Destination City</CFormLabel>
                         <CFormInput
                           name="city"
                           value={formData.city}
                           onChange={handleInputChange}
                         />
                       </CCol>
                       <CCol md={4}>
                         <CFormLabel className="small fw-bold text-muted">Assignment Start Date</CFormLabel>
                         <CFormInput
                           type="date"
                           name="assignmentStartDate"
                           value={formData.assignmentStartDate}
                           onChange={handleInputChange}
                         />
                       </CCol>
                     </CRow>
                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel className="small fw-bold text-muted">Primary Work Email</CFormLabel>
                        <CFormInput
                          type="email"
                          name="officialEmailAddress"
                          value={formData.officialEmailAddress}
                          onChange={handleInputChange}
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="small fw-bold text-muted">Personal Email</CFormLabel>
                        <CFormInput
                          type="email"
                          name="personalEmailAddress"
                          value={formData.personalEmailAddress}
                          onChange={handleInputChange}
                        />
                      </CCol>
                    </CRow>
                    <CRow className="mb-3">
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Mobile Number</CFormLabel>
                        <CFormInput
                          name="mobileNumber"
                          value={formData.mobileNumber}
                          onChange={handleInputChange}
                        />
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Home Phone</CFormLabel>
                        <CFormInput
                          name="currentHomeTelephoneNumber"
                          value={formData.currentHomeTelephoneNumber}
                          onChange={handleInputChange}
                        />
                      </CCol>
                      <CCol md={4}>
                        <CFormLabel className="small fw-bold text-muted">Local Host Phone</CFormLabel>
                        <CFormInput
                          name="hostPhoneNumber"
                          value={formData.hostPhoneNumber}
                          onChange={handleInputChange}
                        />
                      </CCol>
                    </CRow>
                    <CRow className="mb-3">
                      <CCol md={12}>
                        <CFormLabel className="small fw-bold text-muted">Current Address</CFormLabel>
                        <CFormTextarea
                          rows={2}
                          name="currentHomeAddress"
                          value={formData.currentHomeAddress}
                          onChange={handleInputChange}
                        />
                      </CCol>
                    </CRow>
                  </div>
                </CTabPane>

                {/* FAMILY TAB */}
                {formData.maritalStatus !== 'Single' && (
                  <CTabPane visible={activeTab === 'family'}>
                    <div className="fade-in">
                      <h6 className="mb-3 border-bottom pb-2 fw-bold text-secondary">Spouse & Children Detail</h6>
                      <div className="bg-light p-4 rounded-3 border">
                        <CRow className="mb-3">
                          <CCol md={6}>
                            <CFormLabel className="fw-bold">Spouse Name</CFormLabel>
                            <CFormInput
                              name="spouseName"
                              value={formData.spouseName}
                              onChange={handleInputChange}
                            />
                          </CCol>
                          <CCol md={6}>
                            <CFormLabel className="fw-bold">Number of Children</CFormLabel>
                            <CFormInput
                              type="number"
                              min="0"
                              value={formData.numberOfKids}
                              onChange={handleNumberOfKidsChange}
                            />
                          </CCol>
                        </CRow>
                        {formData.kids && formData.kids.length > 0 ? (
                          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="pe-2 mt-3">
                            {formData.kids.map((kid, idx) => (
                              <div key={idx} className="mb-4 p-3 bg-white border rounded shadow-sm">
                                <p className="fw-bold text-primary small border-bottom mb-3 pb-1">
                                  CHILD #{idx + 1} PROFILE
                                </p>
                                <CRow className="g-3">
                                  <CCol md={6}>
                                    <CFormLabel className="small fw-bold">Name</CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      value={kid.name || ''}
                                      onChange={(e) => handleKidChange(idx, 'name', e.target.value)}
                                    />
                                  </CCol>
                                  <CCol md={3}>
                                    <CFormLabel className="small fw-bold">Age</CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      type="number"
                                      value={kid.age || ''}
                                      onChange={(e) => handleKidChange(idx, 'age', e.target.value)}
                                    />
                                  </CCol>
                                  <CCol md={3}>
                                    <CFormLabel className="small fw-bold">Grade</CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      value={kid.grade || ''}
                                      onChange={(e) => handleKidChange(idx, 'grade', e.target.value)}
                                    />
                                  </CCol>
                                  <CCol md={6}>
                                    <CFormLabel className="small fw-bold">Current School</CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      value={kid.schoolName || ''}
                                      onChange={(e) => handleKidChange(idx, 'schoolName', e.target.value)}
                                    />
                                  </CCol>
                                  <CCol md={6}>
                                    <CFormLabel className="small fw-bold">Board Preference</CFormLabel>
                                    <CFormSelect
                                      size="sm"
                                      value={kid.typeOfSchool || ''}
                                      onChange={(e) => handleKidChange(idx, 'typeOfSchool', e.target.value)}
                                    >
                                      <option value="">Select...</option>
                                      <option value="CBSE">CBSE</option>
                                      <option value="ICSE">ICSE</option>
                                      <option value="International Board">International Board</option>
                                      <option value="Other">Other</option>
                                    </CFormSelect>
                                  </CCol>
                                </CRow>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted bg-white rounded border">
                            No children profiles registered. Adjust "Number of Children" count to add profiles.
                          </div>
                        )}
                      </div>
                    </div>
                  </CTabPane>
                )}

                {/* SERVICES TAB */}
                <CTabPane visible={activeTab === 'services'}>
                  <div className="fade-in">
                    <h6 className="mb-4 border-bottom pb-2 fw-bold text-secondary">Authorized Services & Details</h6>
                    <CRow className="mb-4">
                      {Object.keys(formData.servicesAuthorized)
                        .filter((k) => !['personalLease', 'corporateLease'].includes(k))
                        .map((sk) => (
                          <CCol md={6} xl={4} key={sk} className="mb-3">
                            <div
                              className={`p-3 border rounded-3 h-100 ${formData.servicesAuthorized[sk] ? 'bg-light border-primary shadow-sm' : ''}`}
                            >
                              <CFormCheck
                                label={
                                  <span className="fw-bold">
                                    {sk.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                  </span>
                                }
                                name={sk}
                                checked={formData.servicesAuthorized[sk]}
                                onChange={handleServiceChange}
                              />
                              {sk === 'homeSearch' && formData.servicesAuthorized.homeSearch && (
                                <div className="mt-3 ms-4 border-start ps-3 py-2 bg-white rounded border">
                                  <CFormLabel className="small fw-bold text-primary mb-2">
                                    Lease Structure
                                  </CFormLabel>
                                  <CFormCheck
                                    label="Personal Lease"
                                    className="small"
                                    name="personalLease"
                                    checked={formData.servicesAuthorized.personalLease}
                                    onChange={handleServiceChange}
                                  />
                                  <CFormCheck
                                    label="Corporate Lease"
                                    className="small mb-3"
                                    name="corporateLease"
                                    checked={formData.servicesAuthorized.corporateLease}
                                    onChange={handleServiceChange}
                                  />
                                  <CFormLabel className="small fw-bold">
                                    Max Monthly Budget
                                  </CFormLabel>
                                  <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput
                                      placeholder="Amount"
                                      value={formData.homeSearchBudget}
                                      onChange={(e) =>
                                        setFormData({ ...formData, homeSearchBudget: e.target.value })
                                      }
                                    />
                                  </CInputGroup>
                                </div>
                              )}
                              {sk === 'visaApplication' &&
                                formData.servicesAuthorized.visaApplication && (
                                  <div className="mt-3 ms-4 border-start ps-3 py-2 bg-white rounded border">
                                    <CFormLabel className="small fw-bold text-info mb-2">
                                      Immigration Scope
                                    </CFormLabel>
                                    {Object.keys(formData.visaDetails).map((vk) => (
                                      <CFormCheck
                                        key={vk}
                                        label={vk
                                          .replace(/([A-Z])/g, ' $1')
                                          .replace(/^./, (s) => s.toUpperCase())}
                                        name={`visa_${vk}`}
                                        checked={formData.visaDetails[vk]}
                                        onChange={handleInputChange}
                                        size="sm"
                                      />
                                    ))}
                                  </div>
                                )}
                              {sk === 'householdGoodsMovement' &&
                                formData.servicesAuthorized.householdGoodsMovement && (
                                  <div className="mt-3 ms-4 border-start ps-3 py-2 bg-white rounded border">
                                    <CFormLabel className="small fw-bold mb-2">
                                      HHG Entitlement
                                    </CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      placeholder="e.g. 1 Full 20ft Container"
                                      value={formData.householdGoodsLimit}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          householdGoodsLimit: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                )}
                            </div>
                          </CCol>
                        ))}
                    </CRow>

                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel className="small fw-bold text-muted">Other Service Request</CFormLabel>
                        <CFormInput
                          name="otherServiceRequest"
                          value={formData.otherServiceRequest}
                          onChange={handleInputChange}
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="small fw-bold text-muted">Additional Comments (HR)</CFormLabel>
                        <CFormTextarea
                          rows={2}
                          name="additionalComments"
                          value={formData.additionalComments}
                          onChange={handleInputChange}
                        />
                      </CCol>
                    </CRow>
                  </div>
                </CTabPane>
              </CTabContent>

              <div className="border-top pt-3 d-flex justify-content-end gap-2">
                <CButton
                  color="secondary"
                  onClick={() => navigate(`/cases/${id}`)}
                  disabled={loading}
                >
                  Cancel
                </CButton>
                <CButton
                  type="submit"
                  color="primary"
                  className="px-4 d-flex align-items-center"
                  disabled={loading}
                >
                  {loading && <CSpinner size="sm" className="me-2" />}
                  Save Changes
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EditCase

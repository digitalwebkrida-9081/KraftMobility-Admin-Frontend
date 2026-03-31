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
} from '@coreui/react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const COUNTRY_LIST = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
]

const CreateCase = () => {
  const [formData, setFormData] = useState({
    relocationId: '',
    assigneeName: '',
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
    numberOfKids: '',
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
      other: false,
    },
    serviceTracking: {
      homeSearch: {
        startDate: '',
        endDate: '',
        propertyAddress: '',
        monthlyRent: '',
        deposit: '',
        leaseStartDate: '',
        leaseEndDate: '',
      },
      orientation: { startDate: '', endDate: '' },
      schoolSearch: {
        startDate: '',
        endDate: '',
        noOfKids: '',
        grade: '',
        typeOfSchool: '',
        schoolName: '',
        schoolAddress: '',
      },
      visa: { startDate: '', endDate: '', type: '', frroStartDate: '', frroEndDate: '' },
      tenancyManagement: { startDate: '', endDate: '' },
      departure: { propertyClosureDate: '' },
      aadharCard: { expiryDate: '' },
    },
    homeSearchBudget: '',
    householdGoodsLimit: '',
    householdGoodsContainerSize: '',
    householdGoodsContainerSizeOther: '',
    visaDetails: {
      businessVisa: false,
      employmentVisa: false,
      touristVisa: false,
      frro: false,
      visaExtension: false,
    },
    otherServiceRequest: '',
    additionalComments: '',
  })

  const [categorizedDocuments, setCategorizedDocuments] = useState({
    homeSearch_houseLease: null,
    homeSearch_propertyListing: null,
    orientation_itinerary: null,
    schoolSearch_schoolListing: null,
    departure_propertyClosure: null,
    visa_visaCopy: null,
    visa_passportCopy: null,
    visa_frroDocument: null,
    visa_extensionDocument: null,
    aadharCard_document: null,
  })

  const [currentStep, setCurrentStep] = useState(1)
  const steps = ['Basics', 'Relocation', 'Family', 'Services', 'Tracking', 'Documents']

  const [generalDocuments, setGeneralDocuments] = useState([])
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const loading = useSelector((state) => state.loading)
  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

  const userStr = localStorage.getItem('user')
  let userRole = ''
  if (userStr) {
    try {
      const parsedUser = JSON.parse(userStr)
      userRole = (parsedUser?.user || parsedUser)?.role || ''
    } catch (e) {}
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
    setFormData((prev) => ({ ...prev, numberOfKids: e.target.value, kids: updatedKids }))
  }

  const handleServiceTrackingChange = (service, field, value) => {
    setFormData((prev) => ({
      ...prev,
      serviceTracking: {
        ...prev.serviceTracking,
        [service]: { ...prev.serviceTracking[service], [field]: value },
      },
    }))
  }

  const handleGeneralDocumentChange = (index, field, value) => {
    const newDocs = [...generalDocuments]
    newDocs[index] = { ...newDocs[index], [field]: value }
    setGeneralDocuments(newDocs)
  }

  const addGeneralDocument = () =>
    setGeneralDocuments([...generalDocuments, { type: '', file: null }])
  const removeGeneralDocument = (index) =>
    setGeneralDocuments(generalDocuments.filter((_, i) => i !== index))

  const nextStep = () => {
    if (currentStep === 1 && !formData.assigneeName) {
      toast.error('Please enter Assignee Name')
      return
    }
    if (currentStep === 1 && !formData.relocationType) {
      toast.error('Please select Relocation Type')
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    dispatch({ type: 'set_loading', loading: true })

    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const submitData = new FormData()

      Object.keys(formData).forEach((key) => {
        if (['servicesAuthorized', 'serviceTracking', 'kids', 'visaDetails'].includes(key)) {
          submitData.append(key, JSON.stringify(formData[key]))
        } else {
          submitData.append(key, formData[key] === null ? '' : formData[key])
        }
      })

      const appendDoc = (fileList, docType) => {
        if (fileList && fileList.length > 0) {
          submitData.append('documents', fileList[0])
          submitData.append('documentTypes', docType)
        }
      }

      if (formData.servicesAuthorized.homeSearch) {
        appendDoc(categorizedDocuments.homeSearch_houseLease, 'House Lease')
        appendDoc(categorizedDocuments.homeSearch_propertyListing, 'Property Listing')
      }
      if (formData.servicesAuthorized.orientationProgram)
        appendDoc(categorizedDocuments.orientation_itinerary, 'Orientation Itinerary')
      if (formData.servicesAuthorized.schoolSearch)
        appendDoc(categorizedDocuments.schoolSearch_schoolListing, 'School Listing')
      if (formData.servicesAuthorized.departure)
        appendDoc(categorizedDocuments.departure_propertyClosure, 'Property Closure Doc')
      if (formData.servicesAuthorized.visaApplication) {
        appendDoc(categorizedDocuments.visa_visaCopy, 'Visa Copy')
        appendDoc(categorizedDocuments.visa_passportCopy, 'Passport Copy')
        appendDoc(categorizedDocuments.visa_frroDocument, 'FRRO Document')
        appendDoc(categorizedDocuments.visa_extensionDocument, 'Visa Extension Document')
      }
      if (formData.servicesAuthorized.aadharCard)
        appendDoc(categorizedDocuments.aadharCard_document, 'Aadhar Card Document')

      generalDocuments.forEach((doc) => {
        if (doc.type && doc.file && doc.file.length > 0) {
          submitData.append('documents', doc.file[0])
          submitData.append('documentTypes', doc.type)
        }
      })

      await axios.post(`${BASE_API_URL}/cases`, submitData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Case Initiated successfully!')
      navigate('/cases')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to initiate case.')
    } finally {
      dispatch({ type: 'set_loading', loading: false })
    }
  }

  const StatusStepper = ({ currentStep }) => {
    const currentIndex = currentStep - 1
    return (
      <div className="mb-5 mt-2 px-2">
        <div className="d-flex justify-content-between position-relative">
          <div
            className="position-absolute w-100"
            style={{ height: '2px', backgroundColor: '#e0e0e0', top: '18px', zIndex: 0 }}
          ></div>
          <div
            className="position-absolute"
            style={{
              height: '2px',
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
                style={{ zIndex: 2, width: '60px' }}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center border-2 transition-all ${isActive ? 'bg-primary border-primary text-white' : 'bg-white border-light text-muted'}`}
                  style={{
                    width: '36px',
                    height: '36px',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(13, 110, 253, 0.15)' : 'none',
                    fontWeight: 'bold',
                  }}
                >
                  {index < currentIndex ? '✓' : index + 1}
                </div>
                <div
                  className={`mt-2 small fw-bold text-center ${isActive ? 'text-primary' : 'text-muted'}`}
                  style={{ fontSize: '12px', textTransform: 'uppercase' }}
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
        <CCard className="mb-4 shadow-sm border-0 rounded-3 overflow-hidden">
          <CCardHeader className="bg-white py-3 border-bottom shadow-sm">
            <strong className="fs-5 text-dark">Case Initiation Workflow</strong>
          </CCardHeader>
          <CCardBody className="p-4">
            <StatusStepper currentStep={currentStep} />
            <CForm onSubmit={(e) => e.preventDefault()}>
              {currentStep === 1 && (
                <div className="fade-in">
                  <h6 className="mb-4 border-bottom pb-2 fw-bold text-primary text-uppercase tracking-wider">
                    Step 1: Assignee & Company Basics
                  </h6>
                  <CRow className="mb-4">
                    <CCol md={6}>
                      <CFormLabel className="fw-bold">Relocation Category *</CFormLabel>
                      <div className="d-flex gap-3">
                        <div
                          className={`p-3 border rounded-3 flex-fill text-center ${formData.relocationType === 'Domestic' ? 'border-primary bg-light' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            handleInputChange({
                              target: { name: 'relocationType', value: 'Domestic' },
                            })
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
                            handleInputChange({
                              target: { name: 'relocationType', value: 'International' },
                            })
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
                  </CRow>
                  {formData.relocationType && (
                    <div className="fade-in">
                      <CRow className="mb-3">
                        <CCol md={8}>
                          <CFormLabel className="small fw-bold text-muted">
                            Assignee Full Name *
                          </CFormLabel>
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
                          <CFormLabel className="small fw-bold text-muted">
                            Billing Entity (Client Company)
                          </CFormLabel>
                          <CFormInput
                            name="billingEntity"
                            value={formData.billingEntity}
                            onChange={handleInputChange}
                          />
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel className="small fw-bold text-muted">
                            Employer Organization
                          </CFormLabel>
                          <CFormInput
                            name="employer"
                            value={formData.employer}
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
                          <CFormLabel className="small fw-bold text-muted">
                            Marital Status
                          </CFormLabel>
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
                      </CRow>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="fade-in">
                  <h6 className="mb-4 border-bottom pb-2 fw-bold text-primary text-uppercase tracking-wider">
                    Step 2: Relocation Route & Contact
                  </h6>
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel className="small fw-bold text-muted">
                        Family Relocating?
                      </CFormLabel>
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
                    {formData.relocationType === 'International' && (
                      <>
                        <CCol md={4}>
                          <CFormLabel className="small fw-bold text-muted">
                            Origin Country
                          </CFormLabel>
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
                          <CFormLabel className="small fw-bold text-muted">
                            Destination Country
                          </CFormLabel>
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
                      </>
                    )}
                  </CRow>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel className="small fw-bold text-muted">Source City</CFormLabel>
                      <CFormInput
                        name="movingFromCity"
                        value={formData.movingFromCity}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel className="small fw-bold text-muted">Target City</CFormLabel>
                      <CFormInput name="city" value={formData.city} onChange={handleInputChange} />
                    </CCol>
                  </CRow>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel className="small fw-bold text-muted">
                        Primary Work Email
                      </CFormLabel>
                      <CFormInput
                        type="email"
                        name="officialEmailAddress"
                        value={formData.officialEmailAddress}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel className="small fw-bold text-muted">
                        Secondary/Personal Email
                      </CFormLabel>
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
                      <CFormLabel className="small fw-bold text-muted">
                        Current Residence Address
                      </CFormLabel>
                      <CFormTextarea
                        rows={2}
                        name="currentHomeAddress"
                        value={formData.currentHomeAddress}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>
                </div>
              )}

              {currentStep === 3 && (
                <div className="fade-in">
                  <h6 className="mb-4 border-bottom pb-2 fw-bold text-primary text-uppercase tracking-wider">
                    Step 3: Spouse & Kids Detail
                  </h6>
                  {formData.movingWithFamily === 'Yes' || formData.maritalStatus === 'Married' ? (
                    <div className="bg-light p-4 rounded-3 border">
                      {formData.maritalStatus === 'Married' && (
                        <CRow className="mb-4">
                          <CCol md={6}>
                            <CFormLabel className="fw-bold">Spouse Name</CFormLabel>
                            <CFormInput
                              name="spouseName"
                              value={formData.spouseName}
                              onChange={handleInputChange}
                            />
                          </CCol>
                        </CRow>
                      )}
                      {formData.movingWithFamily === 'Yes' && (
                        <>
                          <CRow className="mb-4">
                            <CCol md={3}>
                              <CFormLabel className="fw-bold">Number of Children</CFormLabel>
                              <CFormInput
                                type="number"
                                min="0"
                                value={formData.numberOfKids}
                                onChange={handleNumberOfKidsChange}
                              />
                            </CCol>
                          </CRow>
                          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="pe-2">
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
                                      value={kid.name}
                                      onChange={(e) => handleKidChange(idx, 'name', e.target.value)}
                                    />
                                  </CCol>
                                  <CCol md={3}>
                                    <CFormLabel className="small fw-bold">Age</CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      type="number"
                                      value={kid.age}
                                      onChange={(e) => handleKidChange(idx, 'age', e.target.value)}
                                    />
                                  </CCol>
                                  <CCol md={3}>
                                    <CFormLabel className="small fw-bold">Grade</CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      value={kid.grade}
                                      onChange={(e) =>
                                        handleKidChange(idx, 'grade', e.target.value)
                                      }
                                    />
                                  </CCol>
                                  <CCol md={6}>
                                    <CFormLabel className="small fw-bold">
                                      Current School
                                    </CFormLabel>
                                    <CFormInput
                                      size="sm"
                                      value={kid.schoolName}
                                      onChange={(e) =>
                                        handleKidChange(idx, 'schoolName', e.target.value)
                                      }
                                    />
                                  </CCol>
                                  <CCol md={6}>
                                    <CFormLabel className="small fw-bold">
                                      Board Preferance
                                    </CFormLabel>
                                    <CFormSelect
                                      size="sm"
                                      value={kid.typeOfSchool}
                                      onChange={(e) =>
                                        handleKidChange(idx, 'typeOfSchool', e.target.value)
                                      }
                                    >
                                      <option value="">Select...</option>
                                      <option value="CBSE">CBSE</option>
                                      <option value="ICSE">ICSE</option>
                                      <option value="International Board">
                                        International Board
                                      </option>
                                      <option value="Other">Other</option>
                                    </CFormSelect>
                                  </CCol>
                                </CRow>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-5 bg-light rounded">
                      <p className="mb-0 text-muted">
                        No family members identified for this relocation.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="fade-in">
                  <h6 className="mb-4 border-bottom pb-2 fw-bold text-primary text-uppercase tracking-wider">
                    Step 4: Scope of Authorized Services
                  </h6>
                  <CRow>
                    {Object.keys(formData.servicesAuthorized)
                      .filter((k) => !['personalLease', 'corporateLease'].includes(k))
                      .filter(
                        (k) =>
                          formData.relocationType === 'International' ||
                          ['homeSearch', 'schoolSearch', 'householdGoodsMovement'].includes(k),
                      )
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
                </div>
              )}

              {currentStep === 5 && (
                <div className="fade-in">
                  <h6 className="mb-4 border-bottom pb-2 fw-bold text-primary text-uppercase tracking-wider">
                    Step 5: Initial Milestones & Tracking
                  </h6>
                  <div style={{ maxHeight: '450px', overflowY: 'auto' }} className="pe-2">
                    {formData.servicesAuthorized.homeSearch && (
                      <div className="mb-3 p-3 border rounded bg-light border-primary-subtle">
                        <strong className="text-primary small d-block mb-3 border-bottom pb-1">
                          HOME SEARCH PIPELINE
                        </strong>
                        <CRow className="g-3">
                          <CCol md={6}>
                            <CFormLabel className="small fw-bold">
                              Field-visit Start Date
                            </CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.homeSearch.startDate}
                              onChange={(e) =>
                                handleServiceTrackingChange(
                                  'homeSearch',
                                  'startDate',
                                  e.target.value,
                                )
                              }
                            />
                          </CCol>
                          <CCol md={6}>
                            <CFormLabel className="small fw-bold">Expected Handover</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.homeSearch.endDate}
                              onChange={(e) =>
                                handleServiceTrackingChange('homeSearch', 'endDate', e.target.value)
                              }
                            />
                          </CCol>
                          <CCol md={12}>
                            <CFormLabel className="small fw-bold">
                              Property Address (if locked)
                            </CFormLabel>
                            <CFormInput
                              size="sm"
                              value={formData.serviceTracking.homeSearch.propertyAddress}
                              onChange={(e) =>
                                handleServiceTrackingChange(
                                  'homeSearch',
                                  'propertyAddress',
                                  e.target.value,
                                )
                              }
                            />
                          </CCol>
                        </CRow>
                      </div>
                    )}
                    {formData.servicesAuthorized.orientationProgram && (
                      <div className="mb-3 p-3 border rounded bg-white">
                        <strong className="text-secondary small d-block mb-3 border-bottom pb-1">
                          ORIENTATION WINDOW
                        </strong>
                        <CRow className="g-3">
                          <CCol md={6}>
                            <CFormLabel className="small fw-bold">Program Start</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.orientation.startDate}
                              onChange={(e) =>
                                handleServiceTrackingChange(
                                  'orientation',
                                  'startDate',
                                  e.target.value,
                                )
                              }
                            />
                          </CCol>
                          <CCol md={6}>
                            <CFormLabel className="small fw-bold">Program End</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.orientation.endDate}
                              onChange={(e) =>
                                handleServiceTrackingChange(
                                  'orientation',
                                  'endDate',
                                  e.target.value,
                                )
                              }
                            />
                          </CCol>
                        </CRow>
                      </div>
                    )}
                    {formData.servicesAuthorized.visaApplication && (
                      <div className="mb-3 p-3 border rounded bg-light border-info-subtle">
                        <strong className="text-info small d-block mb-3 border-bottom pb-1">
                          IMMIGRATION TIMELINE
                        </strong>
                        <CRow className="g-3">
                          <CCol md={4}>
                            <CFormLabel className="small fw-bold">App Submission</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.visa.startDate}
                              onChange={(e) =>
                                handleServiceTrackingChange('visa', 'startDate', e.target.value)
                              }
                            />
                          </CCol>
                          <CCol md={4}>
                            <CFormLabel className="small fw-bold">Visa Expiry Date</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.visa.endDate}
                              onChange={(e) =>
                                handleServiceTrackingChange('visa', 'endDate', e.target.value)
                              }
                            />
                          </CCol>
                          <CCol md={4}>
                            <CFormLabel className="small fw-bold">FRRO Extension</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.visa.frroEndDate}
                              onChange={(e) =>
                                handleServiceTrackingChange('visa', 'frroEndDate', e.target.value)
                              }
                            />
                          </CCol>
                        </CRow>
                      </div>
                    )}
                    {formData.servicesAuthorized.aadharCard && (
                      <div className="mb-3 p-3 border rounded bg-white">
                        <strong className="text-secondary small d-block mb-3 border-bottom pb-1">
                          AADHAR VALIDITY
                        </strong>
                        <CRow className="mb-3">
                          <CCol md={6}>
                            <CFormLabel className="small fw-bold">Expiry/Renewal Date</CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.aadharCard.expiryDate}
                              onChange={(e) =>
                                handleServiceTrackingChange(
                                  'aadharCard',
                                  'expiryDate',
                                  e.target.value,
                                )
                              }
                            />
                          </CCol>
                        </CRow>
                      </div>
                    )}
                    {formData.servicesAuthorized.departure && (
                      <div className="mb-3 p-3 border rounded bg-white">
                        <strong className="text-secondary small d-block mb-3 border-bottom pb-1">
                          DEPARTURE LOGISTICS
                        </strong>
                        <CRow className="mb-3">
                          <CCol md={6}>
                            <CFormLabel className="small fw-bold">
                              Property Handover Date
                            </CFormLabel>
                            <CFormInput
                              size="sm"
                              type="date"
                              value={formData.serviceTracking.departure.propertyClosureDate}
                              onChange={(e) =>
                                handleServiceTrackingChange(
                                  'departure',
                                  'propertyClosureDate',
                                  e.target.value,
                                )
                              }
                            />
                          </CCol>
                        </CRow>
                      </div>
                    )}
                    {!Object.values(formData.servicesAuthorized).some((v) => v === true) && (
                      <div className="text-center py-5 text-muted">
                        Configure services in the previous step to enable tracking milestones.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="fade-in">
                  <h6 className="mb-4 border-bottom pb-2 fw-bold text-primary text-uppercase tracking-wider">
                    Step 6: Attached Documents & Remarks
                  </h6>
                  <div className="bg-light p-4 rounded-3 border mb-4 shadow-inner">
                    <p className="fw-bold small text-muted border-bottom pb-2 mb-3 tracking-widest text-uppercase">
                      Generic Documents Management
                    </p>
                    <div className="mb-4">
                      {generalDocuments.map((doc, idx) => (
                        <div
                          key={idx}
                          className="mb-3 p-2 bg-white border rounded d-flex align-items-center gap-3 fade-in shadow-sm"
                        >
                          <div className="flex-grow-1">
                            <CFormSelect
                              size="sm"
                              value={doc.type}
                              onChange={(e) =>
                                handleGeneralDocumentChange(idx, 'type', e.target.value)
                              }
                            >
                              <option value="">Select Document Type</option>
                              <option value="Passport">Passport</option>
                              <option value="Offer Letter">Offer Letter</option>
                              <option value="Auth Letter">Client Authorization</option>
                              <option value="ID Proof">ID Proof (Aadhar/PAN)</option>
                              <option value="Other">Other</option>
                            </CFormSelect>
                          </div>
                          <div className="flex-grow-2 w-50">
                            <CFormInput
                              size="sm"
                              type="file"
                              onChange={(e) =>
                                handleGeneralDocumentChange(idx, 'file', e.target.files)
                              }
                            />
                          </div>
                          <div>
                            <CButton
                              color="danger"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGeneralDocument(idx)}
                            >
                              ✕
                            </CButton>
                          </div>
                        </div>
                      ))}
                      <CButton
                        color="primary"
                        variant="ghost"
                        size="sm"
                        className="fw-bold"
                        onClick={addGeneralDocument}
                      >
                        + Add New Document Attachment
                      </CButton>
                    </div>
                  </div>
                  <div className="mb-3">
                    <CFormLabel className="fw-bold">
                      Other Service Requirements / Requests
                    </CFormLabel>
                    <CFormInput
                      name="otherServiceRequest"
                      value={formData.otherServiceRequest}
                      onChange={handleInputChange}
                      placeholder="E.g. Pet relocation, specific furniture request, etc."
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel className="fw-bold">
                      Additional Comments (Internal Ops Notes)
                    </CFormLabel>
                    <CFormTextarea
                      rows={3}
                      name="additionalComments"
                      value={formData.additionalComments}
                      onChange={handleInputChange}
                      placeholder="Enter any extra context for the case manager..."
                    />
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                <CButton
                  color="secondary"
                  variant="outline"
                  className="px-4 fw-bold"
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                >
                  Previous
                </CButton>
                {currentStep < steps.length ? (
                  <CButton
                    className="px-5 text-white fw-bold shadow-sm"
                    style={{
                      background: 'linear-gradient(45deg, #0d6efd 0%, #004dc0 100%)',
                      border: 'none',
                      borderRadius: '4px',
                    }}
                    onClick={nextStep}
                    disabled={loading}
                  >
                    CONTINUE TO {steps[currentStep].toUpperCase()}
                  </CButton>
                ) : (
                  <CButton
                    className="px-5 text-white fw-bold shadow-sm"
                    style={{
                      background: 'linear-gradient(45deg, #198754 0%, #146c43 100%)',
                      border: 'none',
                      borderRadius: '4px',
                    }}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? <CSpinner size="sm" className="me-2" /> : null}
                    FINALIZE & INITIATE CASE
                  </CButton>
                )}
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CreateCase

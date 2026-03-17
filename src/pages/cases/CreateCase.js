import React, { useState, useEffect } from 'react'
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
    assigneeName: '',
    billingEntity: '',
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
    kids: [], // Array of kid objects { name: '', age: '', grade: '' }
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

  // For generic documents upload
  const [generalDocuments, setGeneralDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

  // Get current user role
  const userStr = localStorage.getItem('user')
  let userRole = ''
  if (userStr) {
    try {
      const parsedUser = JSON.parse(userStr)
      const userObj = parsedUser?.user || parsedUser
      userRole = userObj?.role || ''
    } catch (e) {}
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceTrackingChange = (service, field, value) => {
    setFormData((prev) => ({
      ...prev,
      serviceTracking: {
        ...prev.serviceTracking,
        [service]: {
          ...prev.serviceTracking[service],
          [field]: value,
        },
      },
    }))
  }

  const handleCategorizedDocumentChange = (category, files) => {
    setCategorizedDocuments((prev) => ({
      ...prev,
      [category]: files,
    }))
  }

  const handleGeneralDocumentChange = (index, field, value) => {
    setGeneralDocuments((prev) => {
      const newDocs = [...prev]
      newDocs[index] = { ...newDocs[index], [field]: value }
      return newDocs
    })
  }

  const addGeneralDocument = () => {
    setGeneralDocuments((prev) => [...prev, { type: '', file: null }])
  }

  const removeGeneralDocument = (index) => {
    setGeneralDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNumberOfKidsChange = (e) => {
    const { value } = e.target
    // ensure value maps directly to text box but updates arrays safely
    const num = parseInt(value, 10)
    let updatedKids = [...formData.kids]

    if (isNaN(num) || num < 0) {
      updatedKids = []
    } else {
      if (num > updatedKids.length) {
        const newKids = Array.from({ length: num - updatedKids.length }, () => ({
          name: '',
          age: '',
          grade: '',
        }))
        updatedKids = [...updatedKids, ...newKids]
      } else if (num < updatedKids.length) {
        updatedKids = updatedKids.slice(0, num)
      }
    }

    setFormData((prev) => ({
      ...prev,
      numberOfKids: value,
      kids: updatedKids,
    }))
  }

  const handleServiceChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      servicesAuthorized: {
        ...prev.servicesAuthorized,
        [name]: checked,
      },
    }))
  }

  const handleVisaDetailChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      visaDetails: {
        ...prev.visaDetails,
        [name]: checked,
      },
    }))
  }

  const handleKidChange = (index, field, value) => {
    const newKids = [...formData.kids]
    newKids[index] = { ...newKids[index], [field]: value }
    setFormData((prev) => ({ ...prev, kids: newKids }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')).token
        : null
      const submitData = new FormData()

      // Append standard fields
      Object.keys(formData).forEach((key) => {
        if (
          key === 'servicesAuthorized' ||
          key === 'visaDetails' ||
          key === 'kids' ||
          key === 'serviceTracking'
        ) {
          submitData.append(key, JSON.stringify(formData[key]))
        } else {
          submitData.append(key, formData[key])
        }
      })

      // Helper to append a file with its specific documentType
      const appendDoc = (fileList, docType) => {
        if (fileList) {
          const filesArray = Array.from(fileList)
          filesArray.forEach((file) => {
            submitData.append('documents', file)
            submitData.append('documentTypes', docType)
          })
        }
      }

      // Append Categorized Documents based on selected services
      if (formData.servicesAuthorized.homeSearch) {
        appendDoc(categorizedDocuments.homeSearch_houseLease, 'House Lease')
        appendDoc(categorizedDocuments.homeSearch_propertyListing, 'Property Listing')
      }
      if (formData.servicesAuthorized.orientationProgram) {
        appendDoc(categorizedDocuments.orientation_itinerary, 'Itinerary')
      }
      if (formData.servicesAuthorized.schoolSearch) {
        appendDoc(categorizedDocuments.schoolSearch_schoolListing, 'School Listing')
      }
      if (formData.servicesAuthorized.departure) {
        appendDoc(categorizedDocuments.departure_propertyClosure, 'Property Closure Report')
      }
      if (formData.servicesAuthorized.visaApplication) {
        appendDoc(categorizedDocuments.visa_visaCopy, 'Visa Copy')
        appendDoc(categorizedDocuments.visa_passportCopy, 'Passport Copy')
        appendDoc(categorizedDocuments.visa_frroDocument, 'FRRO Document')
        appendDoc(categorizedDocuments.visa_extensionDocument, 'Visa Extension Document')
      }
      if (formData.servicesAuthorized.aadharCard) {
        appendDoc(categorizedDocuments.aadharCard_document, 'Aadhar Card Document')
      }
      // Append Generic/Initial Documents
      generalDocuments.forEach((doc) => {
        if (doc.type && doc.file && doc.file.length > 0) {
          appendDoc(doc.file, doc.type)
        }
      })

      const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'
      const response = await axios.post(`${BASE_API_URL}/cases`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Case Initiated successfully!')
      navigate('/cases')
    } catch (error) {
      console.error('Error initiating case:', error)
      toast.error(error.response?.data?.message || 'Failed to initiate case.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Initiate New Case</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <h5 className="mb-3 border-bottom pb-2">Relocation Type</h5>
              <CRow className="mb-4">
                <CCol md={6}>
                  <CFormCheck
                    type="radio"
                    name="relocationType"
                    id="relocationDomestic"
                    label="Domestic Relocation"
                    value="Domestic"
                    checked={formData.relocationType === 'Domestic'}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormCheck
                    type="radio"
                    name="relocationType"
                    id="relocationInternational"
                    label="International Relocation"
                    value="International"
                    checked={formData.relocationType === 'International'}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              {formData.relocationType && (
                <>
                  <h5 className="mb-3 border-bottom pb-2">Assignee Information</h5>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Assignee Name *</CFormLabel>
                      <CFormInput
                        required
                        name="assigneeName"
                        value={formData.assigneeName}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>Employee Number</CFormLabel>
                      <CFormInput
                        name="empNumber"
                        value={formData.empNumber}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel>Billing Entity</CFormLabel>
                      <CFormInput
                        name="billingEntity"
                        value={formData.billingEntity}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Gender</CFormLabel>
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
                      <CFormLabel>Marital Status</CFormLabel>
                      <CFormSelect
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                      >
                        <option value="">Select...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel>Moving With Family</CFormLabel>
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
                          <CFormLabel>Moving From (Country)</CFormLabel>
                          <CFormSelect
                            name="movingFromCountry"
                            value={formData.movingFromCountry}
                            onChange={handleInputChange}
                          >
                            <option value="">Select...</option>
                            {COUNTRY_LIST.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </CFormSelect>
                        </CCol>
                        <CCol md={4}>
                          <CFormLabel>Moving To (Country)</CFormLabel>
                          <CFormSelect
                            name="movingToCountry"
                            value={formData.movingToCountry}
                            onChange={handleInputChange}
                          >
                            <option value="">Select...</option>
                            {COUNTRY_LIST.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </CFormSelect>
                        </CCol>
                      </>
                    )}
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Moving From (City)</CFormLabel>
                      <CFormInput
                        name="movingFromCity"
                        value={formData.movingFromCity}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>Moving To (City)</CFormLabel>
                      <CFormInput name="city" value={formData.city} onChange={handleInputChange} />
                    </CCol>
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Official Email Address</CFormLabel>
                      <CFormInput
                        type="email"
                        name="officialEmailAddress"
                        value={formData.officialEmailAddress}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel>Personal Email Address</CFormLabel>
                      <CFormInput
                        type="email"
                        name="personalEmailAddress"
                        value={formData.personalEmailAddress}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>Current Home Telephone Number</CFormLabel>
                      <CFormInput
                        name="currentHomeTelephoneNumber"
                        value={formData.currentHomeTelephoneNumber}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  <CRow className="mb-4">
                    <CCol md={4}>
                      <CFormLabel>Mobile Number</CFormLabel>
                      <CFormInput
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Host Phone Number</CFormLabel>
                      <CFormInput
                        name="hostPhoneNumber"
                        value={formData.hostPhoneNumber}
                        onChange={handleInputChange}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Current Home Address</CFormLabel>
                      <CFormInput
                        name="currentHomeAddress"
                        value={formData.currentHomeAddress}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  {/* Kids Section */}
                  {(formData.movingWithFamily === 'Yes' ||
                    formData.maritalStatus === 'Married') && (
                    <div className="mb-4 p-3 border rounded bg-light">
                      <h6 className="mb-3">Family Information</h6>
                      {formData.maritalStatus === 'Married' && (
                        <CRow className="mb-3">
                          <CCol md={6}>
                            <CFormLabel>Spouse Name</CFormLabel>
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
                          <CRow className="mb-3">
                            <CCol md={6}>
                              <CFormLabel>Number of Kids</CFormLabel>
                              <CFormInput
                                type="number"
                                min="0"
                                name="numberOfKids"
                                value={formData.numberOfKids}
                                onChange={handleNumberOfKidsChange}
                              />
                            </CCol>
                          </CRow>
                          <CRow>
                            {formData.kids.map((kid, idx) => (
                              <React.Fragment key={idx}>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Kid {idx + 1} Name</CFormLabel>
                                  <CFormInput
                                    value={kid.name || ''}
                                    onChange={(e) => handleKidChange(idx, 'name', e.target.value)}
                                  />
                                </CCol>
                                <CCol md={2} className="mb-3">
                                  <CFormLabel>Kid {idx + 1} Age</CFormLabel>
                                  <CFormInput
                                    type="number"
                                    value={kid.age || ''}
                                    onChange={(e) => handleKidChange(idx, 'age', e.target.value)}
                                  />
                                </CCol>
                              </React.Fragment>
                            ))}
                          </CRow>
                        </>
                      )}
                    </div>
                  )}

                  {(formData.relocationType === 'International' ||
                    formData.relocationType === 'Domestic') && (
                    <>
                      <h5 className="mt-4 mb-3 border-bottom pb-2">Services Authorized</h5>
                      <CRow className="mb-3">
                        {Object.keys(formData.servicesAuthorized)
                          .filter((key) => !['personalLease', 'corporateLease'].includes(key))
                          .filter(
                            (key) =>
                              formData.relocationType === 'International' ||
                              ['homeSearch', 'schoolSearch', 'householdGoodsMovement'].includes(
                                key,
                              ),
                          )
                          .map((serviceKey) => (
                            <CCol md={4} key={serviceKey} className="mb-3">
                              <CFormCheck
                                id={serviceKey}
                                name={serviceKey}
                                label={serviceKey
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, (str) => str.toUpperCase())}
                                checked={formData.servicesAuthorized[serviceKey]}
                                onChange={handleServiceChange}
                              />
                              {serviceKey === 'homeSearch' && formData.servicesAuthorized.homeSearch && (
                                <div className="ms-3 mt-2 border-start ps-2">
                                  <CFormCheck
                                    name="personalLease"
                                    id="personalLease"
                                    label="Personal Lease"
                                    checked={formData.servicesAuthorized.personalLease}
                                    onChange={handleServiceChange}
                                  />
                                  <CFormCheck
                                    name="corporateLease"
                                    id="corporateLease"
                                    label="Corporate Lease"
                                    checked={formData.servicesAuthorized.corporateLease}
                                    onChange={handleServiceChange}
                                  />
                                  <div className="mt-2" style={{ maxWidth: '200px' }}>
                                    <CFormLabel className="small mb-1">Budget (Rupees)</CFormLabel>
                                    <CInputGroup size="sm">
                                      <CInputGroupText>₹</CInputGroupText>
                                      <CFormInput
                                        type="number"
                                        name="homeSearchBudget"
                                        value={formData.homeSearchBudget}
                                        onChange={handleInputChange}
                                        placeholder="Enter amount"
                                      />
                                    </CInputGroup>
                                  </div>
                                </div>
                              )}
                            </CCol>
                          ))}
                      </CRow>

                      {/* Conditional Service Metadata */}
                      {userRole !== 'HR' &&
                        (formData.servicesAuthorized.homeSearch ||
                          formData.servicesAuthorized.householdGoodsMovement ||
                          formData.servicesAuthorized.orientationProgram ||
                          formData.servicesAuthorized.schoolSearch ||
                          formData.servicesAuthorized.departure ||
                          formData.servicesAuthorized.tenancyManagement ||
                          formData.servicesAuthorized.aadharCard ||
                          formData.servicesAuthorized.other ||
                          formData.servicesAuthorized.visaApplication) && (
                          <div className="mb-4 p-3 border rounded bg-light">
                            <h6 className="mb-3">Service Specific Details</h6>

                          {/* Home Search Fields */}
                          {formData.servicesAuthorized.homeSearch && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Home Search Requirements
                              </strong>

                              <CRow>
                                <CCol md={3} className="mb-3">
                                  <CFormLabel>Start Date</CFormLabel>
                                  <CFormInput
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
                                <CCol md={3} className="mb-3">
                                  <CFormLabel>End Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.homeSearch.endDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'homeSearch',
                                        'endDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Property Address</CFormLabel>
                                  <CFormInput
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
                                <CCol md={3} className="mb-3">
                                  <CFormLabel>Monthly Rent</CFormLabel>
                                  <CInputGroup>
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput
                                      type="number"
                                      value={formData.serviceTracking.homeSearch.monthlyRent}
                                      onChange={(e) =>
                                        handleServiceTrackingChange(
                                          'homeSearch',
                                          'monthlyRent',
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </CInputGroup>
                                </CCol>
                                <CCol md={3} className="mb-3">
                                  <CFormLabel>Deposit</CFormLabel>
                                  <CInputGroup>
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput
                                      type="number"
                                      value={formData.serviceTracking.homeSearch.deposit}
                                      onChange={(e) =>
                                        handleServiceTrackingChange(
                                          'homeSearch',
                                          'deposit',
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </CInputGroup>
                                </CCol>
                                <CCol md={3} className="mb-3">
                                  <CFormLabel>Lease Start Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.homeSearch.leaseStartDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'homeSearch',
                                        'leaseStartDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={3} className="mb-3">
                                  <CFormLabel>Lease End Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.homeSearch.leaseEndDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'homeSearch',
                                        'leaseEndDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Budget</CFormLabel>
                                  <CInputGroup>
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput
                                      type="number"
                                      name="homeSearchBudget"
                                      value={formData.homeSearchBudget}
                                      onChange={handleInputChange}
                                    />
                                  </CInputGroup>
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>House Lease Document</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'homeSearch_houseLease',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Property Listing Document</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'homeSearch_propertyListing',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Orientation Program Fields */}
                          {formData.servicesAuthorized.orientationProgram && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Orientation Program Requirements
                              </strong>
                              <CRow>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Start Date</CFormLabel>
                                  <CFormInput
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
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>End Date</CFormLabel>
                                  <CFormInput
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
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Itinerary Upload</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'orientation_itinerary',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* School Search Fields */}
                          {formData.servicesAuthorized.schoolSearch && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                School Search Requirements
                              </strong>
                              <CRow>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Start Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.schoolSearch.startDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'schoolSearch',
                                        'startDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>End Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.schoolSearch.endDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'schoolSearch',
                                        'endDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Number of Kids</CFormLabel>
                                  <CFormInput
                                    type="number"
                                    min="0"
                                    name="numberOfKids"
                                    value={formData.numberOfKids}
                                    onChange={handleNumberOfKidsChange}
                                  />
                                </CCol>
                              </CRow>

                              {formData.kids.length > 0 && (
                                <div className="mt-3 p-3 border rounded bg-white">
                                  <h6 className="mb-3">Children Details for Schooling</h6>
                                  {formData.kids.map((kid, index) => (
                                    <div key={index} className="mb-4 pb-3 border-bottom">
                                      <strong className="d-block mb-3 text-secondary">Kid {index + 1} Profile</strong>
                                      <CRow className="mb-3 align-items-end">
                                        <CCol md={4}>
                                          <CFormLabel className="small">Name</CFormLabel>
                                          <CFormInput
                                            size="sm"
                                            value={kid.name || ''}
                                            onChange={(e) => {
                                              const newKids = [...formData.kids]
                                              newKids[index].name = e.target.value
                                              setFormData((prev) => ({ ...prev, kids: newKids }))
                                            }}
                                          />
                                        </CCol>
                                        <CCol md={2}>
                                          <CFormLabel className="small">Age</CFormLabel>
                                          <CFormInput
                                            size="sm"
                                            type="number"
                                            value={kid.age || ''}
                                            onChange={(e) => {
                                              const newKids = [...formData.kids]
                                              newKids[index].age = e.target.value
                                              setFormData((prev) => ({ ...prev, kids: newKids }))
                                            }}
                                          />
                                        </CCol>
                                        <CCol md={3}>
                                          <CFormLabel className="small">Admitting Grade</CFormLabel>
                                          <CFormInput
                                            size="sm"
                                            value={kid.grade || ''}
                                            onChange={(e) => {
                                              const newKids = [...formData.kids]
                                              newKids[index].grade = e.target.value
                                              setFormData((prev) => ({ ...prev, kids: newKids }))
                                            }}
                                            placeholder="e.g. 5th Grade"
                                          />
                                        </CCol>
                                        <CCol md={3}>
                                          <CFormLabel className="small">Type of School</CFormLabel>
                                          <CFormSelect
                                            size="sm"
                                            value={kid.typeOfSchool || ''}
                                            onChange={(e) => {
                                              const newKids = [...formData.kids]
                                              newKids[index].typeOfSchool = e.target.value
                                              setFormData((prev) => ({ ...prev, kids: newKids }))
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
                                            onChange={(e) => {
                                              const newKids = [...formData.kids]
                                              newKids[index].schoolName = e.target.value
                                              setFormData((prev) => ({ ...prev, kids: newKids }))
                                            }}
                                            placeholder="Enter school name"
                                          />
                                        </CCol>
                                        <CCol md={8}>
                                          <CFormLabel className="small">School Address</CFormLabel>
                                          <CFormInput
                                            size="sm"
                                            value={kid.schoolAddress || ''}
                                            onChange={(e) => {
                                              const newKids = [...formData.kids]
                                              newKids[index].schoolAddress = e.target.value
                                              setFormData((prev) => ({ ...prev, kids: newKids }))
                                            }}
                                            placeholder="Enter school address"
                                          />
                                        </CCol>
                                      </CRow>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <CRow className="mt-3">
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>School Listing Upload</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'schoolSearch_schoolListing',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Departure Fields */}
                          {formData.servicesAuthorized.departure && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Departure Requirements
                              </strong>
                              <CRow>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Property Closure Report Upload</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'departure_propertyClosure',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Tenancy Management Fields */}
                          {formData.servicesAuthorized.tenancyManagement && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Tenancy Management Requirements
                              </strong>
                              <CRow>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Start Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.tenancyManagement.startDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'tenancyManagement',
                                        'startDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>End Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.tenancyManagement.endDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'tenancyManagement',
                                        'endDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Visa Fields */}
                          {formData.servicesAuthorized.visaApplication && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Visa Requirements
                              </strong>
                              <CRow>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Visa Start Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.visa.startDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange(
                                        'visa',
                                        'startDate',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Visa End Date</CFormLabel>
                                  <CFormInput
                                    type="date"
                                    value={formData.serviceTracking.visa.endDate}
                                    onChange={(e) =>
                                      handleServiceTrackingChange('visa', 'endDate', e.target.value)
                                    }
                                  />
                                </CCol>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Visa Type</CFormLabel>
                                  <CFormInput
                                    value={formData.serviceTracking.visa.type}
                                    onChange={(e) =>
                                      handleServiceTrackingChange('visa', 'type', e.target.value)
                                    }
                                  />
                                </CCol>
                                <CCol xs={12} className="mt-2 mb-3">
                                  <strong className="d-block mb-2">Internal Visa Flags:</strong>
                                  <CRow>
                                    <CCol md={2}>
                                      <CFormCheck
                                        name="businessVisa"
                                        label="Business Visa"
                                        checked={formData.visaDetails.businessVisa}
                                        onChange={handleVisaDetailChange}
                                      />
                                    </CCol>
                                    <CCol md={3}>
                                      <CFormCheck
                                        name="employmentVisa"
                                        label="Employment Visa"
                                        checked={formData.visaDetails.employmentVisa}
                                        onChange={handleVisaDetailChange}
                                      />
                                    </CCol>
                                    <CCol md={2}>
                                      <CFormCheck
                                        name="touristVisa"
                                        label="Tourist Visa"
                                        checked={formData.visaDetails.touristVisa}
                                        onChange={handleVisaDetailChange}
                                      />
                                    </CCol>
                                    <CCol md={2}>
                                      <CFormCheck
                                        name="frro"
                                        label="FRRO"
                                        checked={formData.visaDetails.frro}
                                        onChange={handleVisaDetailChange}
                                      />
                                    </CCol>
                                    <CCol md={3}>
                                      <CFormCheck
                                        name="visaExtension"
                                        label="Visa Extension"
                                        checked={formData.visaDetails.visaExtension}
                                        onChange={handleVisaDetailChange}
                                      />
                                    </CCol>
                                  </CRow>
                                </CCol>
                                {formData.visaDetails.frro && (
                                  <>
                                    <CCol md={4} className="mb-3">
                                      <CFormLabel>FRRO Start Date</CFormLabel>
                                      <CFormInput
                                        type="date"
                                        value={formData.serviceTracking.visa.frroStartDate}
                                        onChange={(e) =>
                                          handleServiceTrackingChange(
                                            'visa',
                                            'frroStartDate',
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </CCol>
                                    <CCol md={4} className="mb-3">
                                      <CFormLabel>FRRO End Date</CFormLabel>
                                      <CFormInput
                                        type="date"
                                        value={formData.serviceTracking.visa.frroEndDate}
                                        onChange={(e) =>
                                          handleServiceTrackingChange(
                                            'visa',
                                            'frroEndDate',
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </CCol>
                                  </>
                                )}
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Visa Copy</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'visa_visaCopy',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Passport Copy</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'visa_passportCopy',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>FRRO Document</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'visa_frroDocument',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Visa Extension Document</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'visa_extensionDocument',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Other standard checks like limits that don't fit exactly above */}
                          {formData.servicesAuthorized.householdGoodsMovement && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Household Goods Movement Requirements
                              </strong>
                              <CRow>
                                <CCol md={4} className="mb-3">
                                  <CFormLabel>Household Goods Limit</CFormLabel>
                                  <CFormSelect
                                    name="householdGoodsContainerSize"
                                    value={formData.householdGoodsContainerSize}
                                    onChange={(e) => {
                                      handleInputChange(e)
                                      const val = e.target.value
                                      handleInputChange({
                                        target: {
                                          name: 'householdGoodsLimit',
                                          value:
                                            val === 'Other'
                                              ? formData.householdGoodsContainerSizeOther
                                              : val,
                                        },
                                      })
                                    }}
                                  >
                                    <option value="">Select Size...</option>
                                    <option value="20 feet">20 feet</option>
                                    <option value="40 feet">40 feet</option>
                                    <option value="Other">Other</option>
                                  </CFormSelect>
                                </CCol>
                                {formData.householdGoodsContainerSize === 'Other' && (
                                  <CCol md={4} className="mb-3">
                                    <CFormLabel>Custom Container Size</CFormLabel>
                                    <CFormInput
                                      name="householdGoodsContainerSizeOther"
                                      value={formData.householdGoodsContainerSizeOther}
                                      onChange={(e) => {
                                        handleInputChange(e)
                                        handleInputChange({
                                          target: {
                                            name: 'householdGoodsLimit',
                                            value: e.target.value,
                                          },
                                        })
                                      }}
                                    />
                                  </CCol>
                                )}
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Aadhar Card Fields */}
                          {formData.servicesAuthorized.aadharCard && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Aadhar Card Requirements
                              </strong>
                              <CRow>
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Aadhar Card Expiry Date</CFormLabel>
                                  <CFormInput
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
                                <CCol md={6} className="mb-3">
                                  <CFormLabel>Aadhar Card Document</CFormLabel>
                                  <CFormInput
                                    type="file"
                                    onChange={(e) =>
                                      handleCategorizedDocumentChange(
                                        'aadharCard_document',
                                        e.target.files,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}

                          {/* Other Requirements */}
                          {formData.servicesAuthorized.other && (
                            <div className="mb-4">
                              <strong className="d-block mb-2 text-primary">
                                Other Requirements
                              </strong>
                              <CRow>
                                <CCol md={12} className="mb-3">
                                  <CFormLabel>Service Request Details</CFormLabel>
                                  <CFormTextarea
                                    rows={3}
                                    name="otherServiceRequest"
                                    value={formData.otherServiceRequest}
                                    onChange={handleInputChange}
                                  />
                                </CCol>
                              </CRow>
                              <hr />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <h5 className="mt-4 mb-3 border-bottom pb-2">Documents & Comments</h5>
                  <CRow className="mb-3">
                    <CCol xs={12} className="mb-4">
                      <strong className="d-block mb-3">Document Uploads</strong>
                      {generalDocuments.map((doc, idx) => (
                        <CRow key={idx} className="mb-2 align-items-center">
                          <CCol md={4}>
                            <CFormSelect
                              value={doc.type}
                              onChange={(e) =>
                                handleGeneralDocumentChange(idx, 'type', e.target.value)
                              }
                            >
                              <option value="">Select Document Type...</option>
                              <option value="Passport">Passport</option>
                              <option value="Visa">Visa</option>
                              <option value="Arrival Seal">Arrival Seal</option>
                              <option value="House lease">House lease</option>
                              <option value="Employment Contract">Employment Contract</option>
                              <option value="Resume">Resume</option>
                              <option value="Education Document">Education Document</option>
                              <option value="Others">Others</option>
                            </CFormSelect>
                          </CCol>
                          <CCol md={6}>
                            <CFormInput
                              type="file"
                              onChange={(e) =>
                                handleGeneralDocumentChange(idx, 'file', e.target.files)
                              }
                            />
                          </CCol>
                          <CCol md={2}>
                            <CButton
                              color="danger"
                              variant="outline"
                              onClick={() => removeGeneralDocument(idx)}
                            >
                              Remove
                            </CButton>
                          </CCol>
                        </CRow>
                      ))}
                      <CButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={addGeneralDocument}
                      >
                        + Add Document
                      </CButton>
                    </CCol>
                    <CCol md={12}>
                      <CFormLabel>Additional Comments</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        name="additionalComments"
                        value={formData.additionalComments}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  <div className="d-flex justify-content-end mt-4">
                    <CButton color="secondary" className="me-2" onClick={() => navigate('/cases')}>
                      Cancel
                    </CButton>
                    <CButton type="submit" color="primary" disabled={loading}>
                      {loading ? <CSpinner size="sm" className="me-2" /> : null}
                      Initiate Case
                    </CButton>
                  </div>
                </>
              )}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CreateCase

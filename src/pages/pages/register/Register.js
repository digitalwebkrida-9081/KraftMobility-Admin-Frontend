import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilPhone } from '@coreui/icons'
import { authService } from '../../../services/authService'
import { Link } from 'react-router-dom'

const Register = () => {
  const [username, setUsername] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [propertyAddress, setPropertyAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [repeatPassword, setRepeatPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      setError('Invalid email address format.')
      return
    }

    const phoneRegex = /^\+?[0-9\s\-]{10,20}$/
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      setError('Invalid phone number format. Use digits, spaces, or dashes.')
      return
    }

    try {
      await authService.register({
        username,
        email,
        password,
        phoneNumber,
        location,
        propertyAddress,
      })
      setSuccess('Registration successful! Please wait for admin approval.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm onSubmit={handleRegister}>
                  <h1>Register</h1>
                  <p className="text-body-secondary">Create your account</p>
                  {error && <p className="text-danger">{error}</p>}
                  {success && (
                    <div className="alert alert-success">
                      {success} <Link to="/login">Login here</Link>
                    </div>
                  )}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilPhone} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Phone Number"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <div className="mb-3">
                    <CFormSelect
                      className="mb-3"
                      aria-label="Location Select"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      options={[
                        { label: 'Select Location', value: '' },
                        { label: 'Bangalore', value: 'Bangalore' },
                        { label: 'Ahmedabad', value: 'Ahmedabad' },
                        { label: 'Guwahati', value: 'Guwahati' },
                        { label: 'Mumbai', value: 'Mumbai' },
                        { label: 'Pune', value: 'Pune' },
                        { label: 'Chennai', value: 'Chennai' },
                        { label: 'Hyderabad', value: 'Hyderabad' },
                        { label: 'Gurgaon', value: 'Gurgaon' },
                      ]}
                    />
                  </div>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>Address</CInputGroupText>
                    <CFormTextarea
                      placeholder="Property Address"
                      rows={2}
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      required
                    />
                  </CInputGroup>
                  <div className="d-grid mb-3">
                    <CButton color="success" type="submit">
                      Create Account
                    </CButton>
                  </div>
                  <div className="d-grid">
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      <CButton color="primary" className="w-100">
                        Back to Login
                      </CButton>
                    </Link>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register

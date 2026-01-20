import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import logo from '../../../assets/brand/Login-page-image.png'
import loginBg from '../../../assets/images/login-bg.jpg'

const Login = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Failed to login. Please check your credentials.')
    }
  }

  return (
    // how to set background image here

    <div
      className="min-vh-100 d-flex flex-row align-items-center"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={8} xl={7}>
            <CCardGroup className="shadow-lg overflow-hidden" style={{ borderRadius: '18px' }}>
              {/* LEFT LOGIN CARD */}
              <CCard className="p-4 p-md-5 border-0">
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <h2 className="fw-bold mb-2">Welcome Back 👋</h2>
                    <p className="text-body-secondary mb-4">
                      Sign in to continue to your dashboard
                    </p>

                    {error && <p className="text-danger">{error}</p>}

                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light border-0 px-3 text-dark">
                        <CIcon icon={cilUser} className="text-dark" />
                      </CInputGroupText>

                      <CFormInput
                        className="bg-light border-0 py-2 text-dark"
                        placeholder="Email address"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          color: '#000',
                        }}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText className="bg-light border-0 px-3 text-dark" >
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        className="bg-light border-0 py-2 text-dark"
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>

                    <CRow className="align-items-center">
                      <CCol xs={12} className="mb-3">
                        <CButton
                          color="primary"
                          className="w-100 py-2 fw-semibold"
                          type="submit"
                          style={{ borderRadius: '12px' }}
                        >
                          Login
                        </CButton>
                      </CCol>

                      <CCol xs={12} className="text-center">
                        <CButton color="link" className="px-0 text-decoration-none">
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              {/* RIGHT BRANDING CARD */}
              <CCard
                className="text-white border-0 d-none d-md-flex"
                style={{
                  width: 'full',
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${logo})`,
                  backgroundSize: 'center',
                  backgroundPosition: 'center',
                }}
              >
                <CCardBody className="d-flex flex-column justify-content-center text-center p-4">
                  {/* <h3 className="fw-bold mb-2">Your Brand</h3> */}
                  {/* <p className="mb-4 opacity-75">
                    Simple. Secure. Fast access to everything you need.
                  </p> */}

                  {/* Optional small logo in center */}
                  {/* <div>
                    <img
                      src={logo}
                      alt="Logo"
                      style={{
                        width: '90px',
                        height: '90px',
                        objectFit: 'contain',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.15)',
                        padding: '12px',
                      }}
                    />
                  </div> */}
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login

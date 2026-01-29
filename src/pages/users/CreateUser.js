import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CRow,
} from '@coreui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const CreateUser = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { createUser, updateUser, getUsers } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'End-User', // Default role
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const users = await getUsers()
          const user = users.find((u) => u.id === parseInt(id) || u.id === id) // specific check
          if (user) {
            setFormData({
              username: user.username,
              email: user.email,
              phoneNumber: user.phoneNumber || '',
              password: '', // Don't populate password
              role: user.role,
            })
          }
        } catch (err) {
          console.error('Failed to fetch user', err)
        }
      }
      fetchUser()
    }
  }, [id, getUsers])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (id) {
        // If editing, password is optional. If empty, remove it from payload
        const dataToUpdate = { ...formData }
        if (!dataToUpdate.password) {
          delete dataToUpdate.password
        }
        await updateUser(id, dataToUpdate)
      } else {
        await createUser(formData)
      }
      navigate('/users')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{id ? 'Edit User' : 'Create New User'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              {error && <p className="text-danger">{error}</p>}
              <div className="mb-3">
                <CFormInput
                  type="text"
                  id="username"
                  name="username"
                  label="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormInput
                  type="email"
                  id="email"
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormInput
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <CFormInput
                  type="password"
                  id="password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!id}
                />
              </div>
              <div className="mb-3">
                <CFormSelect
                  id="role"
                  name="role"
                  label="Role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Admin">Admin</option>
                  <option value="Operator">Operator</option>
                  <option value="HR">HR</option>
                  <option value="End-User">End-User</option>
                </CFormSelect>
              </div>
              <CButton type="submit" color="primary">
                {id ? 'Update User' : 'Create User'}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CreateUser

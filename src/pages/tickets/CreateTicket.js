import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormSelect,
  CFormTextarea,
  CRow,
} from '@coreui/react'
import TicketService from '../../services/ticketService'
import { authService } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

const CreateTicket = () => {
  const [service, setService] = useState('Visa Renewal')
  const [description, setDescription] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (user && ['Admin', 'Operator', 'HR'].includes(user.role)) {
      toast.error('Admins, Operators, and HR cannot create tickets.')
      navigate('/tickets')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await TicketService.createTicket(service, description)
      toast.success('Ticket created successfully!')
      navigate('/tickets')
    } catch (error) {
      const resMessage =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString()

      toast.error(resMessage)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Create Ticket</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormSelect
                  label="Select Service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  options={[
                    'Visa Renewal',
                    'Household',
                    'Furniture Service',
                    'Maintenance',
                    'Other',
                  ]}
                />
              </div>
              <div className="mb-3">
                <CFormTextarea
                  label="Description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your request..."
                ></CFormTextarea>
              </div>
              <CButton color="primary" type="submit">
                Submit Ticket
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CreateTicket

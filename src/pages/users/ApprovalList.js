import React, { useState, useEffect } from 'react'
import {
  CButton,
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheck, cilTrash, cilX } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const ApprovalList = () => {
  const [users, setUsers] = useState([])
  const { getUsers, updateUser, deleteUser } = useAuth()

  const fetchUsers = async () => {
    try {
      const data = await getUsers()
      // Filter only pending users
      const pendingUsers = data.filter((user) => user.status === 'pending')
      setUsers(pendingUsers)
    } catch (error) {
      console.error('Failed to fetch users', error)
      toast.error('Failed to fetch users')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [getUsers])

  const handleApprove = async (id) => {
    try {
      await updateUser(id, { status: 'approved' })
      toast.success('User approved successfully')
      fetchUsers()
    } catch (error) {
      console.error('Failed to approve user', error)
      toast.error('Failed to approve user')
    }
  }

  const handleReject = async (id) => {
    MySwal.fire({
      title: 'Reject User?',
      text: "This will delete the user request. You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reject it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Determine if we should delete or set status to rejected.
          // For now, let's just delete the user request or set to rejected?
          // The prompt says "rejected" status exists. Let's use that.
          await updateUser(id, { status: 'rejected' })
          toast.success('User rejected successfully')
          fetchUsers()
        } catch (error) {
          console.error('Failed to reject user', error)
          toast.error('Failed to reject user')
        }
      }
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Pending Approvals</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Phone Number</CTableHeaderCell>
                  <CTableHeaderCell>Role</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {users.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="6" className="text-center">
                      No pending approvals
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  users.map((user) => (
                    <CTableRow key={user.id}>
                      <CTableDataCell>{user.username}</CTableDataCell>
                      <CTableDataCell>{user.email}</CTableDataCell>
                      <CTableDataCell>{user.phoneNumber || '-'}</CTableDataCell>
                      <CTableDataCell>{user.role}</CTableDataCell>
                      <CTableDataCell>{user.status}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="success"
                          variant="ghost"
                          size="sm"
                          className="me-2"
                          onClick={() => handleApprove(user.id)}
                          title="Approve"
                        >
                          <CIcon icon={cilCheck} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(user.id)}
                          title="Reject"
                        >
                          <CIcon icon={cilX} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ApprovalList

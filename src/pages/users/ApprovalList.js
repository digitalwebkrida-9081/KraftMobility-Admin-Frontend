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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheck, cilTrash, cilX, cilMagnifyingGlass } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const ApprovalList = () => {
  const [users, setUsers] = useState([])
  const { getUsers, updateUser, deleteUser } = useAuth()
  const [visible, setVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const handleView = (user) => {
    setSelectedUser(user)
    setVisible(true)
  }

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
                  <CTableHeaderCell>Location</CTableHeaderCell>
                  <CTableHeaderCell>Property Address</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {users.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="8" className="text-center">
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
                      <CTableDataCell>{user.location || '-'}</CTableDataCell>
                      <CTableDataCell
                        className="text-truncate"
                        style={{ maxWidth: '150px' }}
                        title={user.propertyAddress}
                      >
                        {user.propertyAddress || '-'}
                      </CTableDataCell>
                      <CTableDataCell>{user.status}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          variant="ghost"
                          size="sm"
                          className="me-2"
                          onClick={() => handleView(user)}
                          title="View Details"
                        >
                          <CIcon icon={cilMagnifyingGlass} />
                        </CButton>
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

      <CModal visible={visible} onClose={() => setVisible(false)} alignment="center">
        <CModalHeader onClose={() => setVisible(false)}>
          <CModalTitle>User Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedUser && (
            <div>
              <p>
                <strong>Username:</strong> {selectedUser.username}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Phone Number:</strong> {selectedUser.phoneNumber || 'N/A'}
              </p>
              <p>
                <strong>Role:</strong> {selectedUser.role}
              </p>
              <p>
                <strong>Location:</strong> {selectedUser.location || 'N/A'}
              </p>
              <p>
                <strong>Status:</strong> {selectedUser.status}
              </p>
              <hr />
              <p>
                <strong>Property Address:</strong>
              </p>
              <div className="p-2 bg-light text-dark border rounded">
                {selectedUser.propertyAddress || 'N/A'}
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default ApprovalList

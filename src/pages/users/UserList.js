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
import { cilPencil, cilTrash, cilCheck, cilMagnifyingGlass } from '@coreui/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const UserList = () => {
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const { getUsers, deleteUser, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const roleFilter = queryParams.get('role')

  const [visible, setVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const handleView = (user) => {
    setSelectedUser(user)
    setVisible(true)
  }

  const fetchUsers = async (page = 1) => {
    try {
      const data = await getUsers(page, limit, roleFilter, 'approved')
      if (data.data) {
        setUsers(data.data)
        setTotalPages(data.totalPages)
        // Only set currentPage if actually different to avoid extra renders
        if (data.currentPage !== currentPage) {
          setCurrentPage(data.currentPage)
        }
      } else {
        setUsers(data)
        setTotalPages(1)
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Failed to fetch users', error)
      toast.error('Failed to fetch users')
    }
  }

  // Effect to reset page and fetch when role changes
  useEffect(() => {
    setCurrentPage(1)
    fetchUsers(1)
  }, [roleFilter])

  // Initial fetch removed from original useEffect to avoid double calls with roleFilter effect

  const handleDelete = async (id) => {
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
          await deleteUser(id)
          toast.success('User deleted successfully')
          fetchUsers(currentPage) // Refresh list
        } catch (error) {
          console.error('Failed to delete user', error)
          toast.error('Failed to delete user')
        }
      }
    })
  }

  const handleEdit = (id) => {
    navigate(`/users/edit/${id}`)
  }

  const handleApprove = async (id) => {
    try {
      await updateUser(id, { status: 'approved' })
      toast.success('User approved successfully')
      fetchUsers(currentPage)
    } catch (error) {
      console.error('Failed to approve user', error)
      toast.error('Failed to approve user')
    }
  }

  // Use users directly since filtering is now done on backend
  const displayUsers = users 

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Users {roleFilter ? `- ${roleFilter}` : ''}</strong>
            <CButton
              color="primary"
              className="float-end"
              onClick={() => navigate('/users/create')}
            >
              Create User
            </CButton>
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
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {displayUsers.map((user) => (
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
                        color="info"
                        variant="ghost"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(user.id)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3 mb-4">
                <CButton
                  color="primary"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(currentPage - 1)
                    fetchUsers(currentPage - 1)
                  }}
                  className="me-2"
                >
                  Previous
                </CButton>
                <span className="align-self-center mx-3 fw-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <CButton
                  color="primary"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(currentPage + 1)
                    fetchUsers(currentPage + 1)
                  }}
                  className="ms-2"
                >
                  Next
                </CButton>
              </div>
            )}
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

export default UserList

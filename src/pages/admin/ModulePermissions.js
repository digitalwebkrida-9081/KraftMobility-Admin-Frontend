import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormSelect,
  CFormCheck,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
} from '@coreui/react'
import { permissionService } from '../../services/permissionService'
import { toast } from 'react-toastify'

const ModulePermissions = () => {
  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState('')
  const [permissions, setPermissions] = useState([]) // [{ role: 'Operator', actions: [] }]
  const [moduleConfig, setModuleConfig] = useState(null) // { name: 'tickets', actions: [...] }
  const [loading, setLoading] = useState(false)
  const [roles] = useState(['Operator', 'HR', 'End-User']) // Admin has all permissions by default

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    if (selectedModule) {
      fetchPermissions(selectedModule)
      const config = modules.find((m) => m.name === selectedModule)
      setModuleConfig(config)
    } else {
      setPermissions([])
      setModuleConfig(null)
    }
  }, [selectedModule, modules])

  const fetchModules = async () => {
    try {
      const data = await permissionService.getModules()
      setModules(data)
      if (data.length > 0) {
        setSelectedModule(data[0].name)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchPermissions = async (moduleName) => {
    setLoading(true)
    try {
      const data = await permissionService.getPermissions(moduleName)
      // Transform data into a map for easier UI handling
      // backend returns [{ role: '...', actions: [...] }]
      // We want to ensure we have entries for all roles
      const formattedPermissions = roles.map((role) => {
        const existing = data.find((p) => p.role === role)
        return {
          role,
          actions: existing ? existing.actions : [],
        }
      })
      setPermissions(formattedPermissions)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (role, action, checked) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role === role) {
          const newActions = checked
            ? [...p.actions, action]
            : p.actions.filter((a) => a !== action)
          return { ...p, actions: newActions }
        }
        return p
      }),
    )
  }

  const handleSave = async () => {
    try {
      await permissionService.updatePermissions(selectedModule, permissions)
      toast.success('Permissions updated successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Module Permissions</strong>
          </CCardHeader>
          <CCardBody>
            <div className="mb-3">
              <label className="form-label">Select Module</label>
              <CFormSelect
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                {modules.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name.charAt(0).toUpperCase() + m.name.slice(1)}
                  </option>
                ))}
              </CFormSelect>
            </div>

            {loading ? (
              <div className="text-center">
                <CSpinner color="primary" />
              </div>
            ) : moduleConfig ? (
              <>
                <CTable bordered>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Role</CTableHeaderCell>
                      {moduleConfig.actions.map((action) => (
                        <CTableHeaderCell key={action}>
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </CTableHeaderCell>
                      ))}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {permissions.map((p) => (
                      <CTableRow key={p.role}>
                        <CTableDataCell>
                          <strong>{p.role}</strong>
                        </CTableDataCell>
                        {moduleConfig.actions.map((action) => (
                          <CTableDataCell key={action}>
                            <CFormCheck
                              checked={p.actions.includes(action)}
                              onChange={(e) =>
                                handlePermissionChange(p.role, action, e.target.checked)
                              }
                            />
                          </CTableDataCell>
                        ))}
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                  <CButton color="primary" onClick={handleSave}>
                    Save Changes
                  </CButton>
                </div>
              </>
            ) : (
              <p>No module selected or configuration available.</p>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ModulePermissions

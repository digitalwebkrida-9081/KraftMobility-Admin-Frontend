import { authService } from './authService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

export const permissionService = {
  getModules: async () => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/modules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch modules')
    return await response.json()
  },

  getPermissions: async (moduleName) => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/permissions?module=${moduleName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch permissions')
    return await response.json()
  },

  updatePermissions: async (moduleName, permissions) => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ module: moduleName, permissions }),
    })
    if (!response.ok) throw new Error('Failed to update permissions')
    return await response.json()
  },
}

const API_URL = 'http://localhost:5000/api'

export const authService = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Login failed')
    }

    const data = await response.json()
    if (data.token) {
      localStorage.setItem('user', JSON.stringify(data))
    }
    return data.user
  },

  logout: () => {
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr).user
    }
    return null
  },

  getToken: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr).token
    }
    return null
  },

  getUsers: async () => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch users')
    return await response.json()
  },

  createUser: async (userData) => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create user')
    }
    return await response.json()
  },

  updateUser: async (id, userData) => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update user')
    }
    return await response.json()
  },

  deleteUser: async (id) => {
    const token = authService.getToken()
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to delete user')
    }
    return await response.json()
  },
}

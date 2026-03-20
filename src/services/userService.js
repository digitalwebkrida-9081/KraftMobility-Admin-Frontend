import axios from 'axios'
import { authService } from './authService'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/users/`

const getPendingCount = () => {
  const token = authService.getToken()
  return axios.get(API_URL + 'pending-count', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const UserService = {
  getPendingCount,
  getUsers: (page, limit, role, status) => {
    const token = authService.getToken()
    const params = {}
    if (page) params.page = page
    if (limit) params.limit = limit
    if (role) params.role = role
    if (status) params.status = status

    return axios.get(API_URL, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
      params,
    })
  },
}

export default UserService

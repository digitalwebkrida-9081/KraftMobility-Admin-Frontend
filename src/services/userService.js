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
  getUsers: (page, limit) => {
    const token = authService.getToken()
    let params = {}
    if (page && limit) {
      params = { page, limit }
    }
    return axios.get(API_URL, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
      params,
    })
  },
}

export default UserService

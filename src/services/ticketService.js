import axios from 'axios'
import { authService } from './authService'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tickets/`

const createTicket = (service, description, image) => {
  const token = authService.getToken()
  const formData = new FormData()
  formData.append('service', service)
  formData.append('description', description)
  if (image) {
    formData.append('image', image)
  }

  return axios.post(API_URL, formData, {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'multipart/form-data',
    },
  })
}

const getTickets = () => {
  const token = authService.getToken()
  return axios.get(API_URL, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const updateTicket = (id, data) => {
  const token = authService.getToken()
  return axios.put(API_URL + id, data, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const updateTicketStatus = (id, status) => {
  const token = authService.getToken()
  return axios.put(
    API_URL + id,
    { status },
    {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    },
  )
}

const deleteTicket = (id) => {
  const token = authService.getToken()
  return axios.delete(API_URL + id, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const extendTicket = (id, days) => {
  const token = authService.getToken()
  return axios.post(
    API_URL + id + '/extend',
    { days },
    {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    },
  )
}

const TicketService = {
  createTicket,
  getTickets,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  extendTicket,
  addNote: (id, note) => {
    const token = authService.getToken()
    return axios.post(
      API_URL + id + '/notes',
      { note },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )
  },

  assignTicket: (id, operatorId, operatorName) => {
    const token = authService.getToken()
    return axios.post(
      API_URL + id + '/assign',
      { operatorId, operatorName },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )
  },
}

export default TicketService

import axios from 'axios'
import { authService } from './authService'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/ratings/`

const createRating = (ticketId, rating, feedback) => {
  const token = authService.getToken()
  return axios.post(
    API_URL,
    { ticketId, rating, feedback },
    {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    },
  )
}

const getRatingByTicketId = (ticketId) => {
  const token = authService.getToken()
  return axios.get(API_URL + 'ticket/' + ticketId, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const getRatingsByOperator = (operatorId) => {
  const token = authService.getToken()
  return axios.get(API_URL + 'operator/' + operatorId, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const RatingService = {
  createRating,
  getRatingByTicketId,
  getRatingsByOperator,
  getAllRatings: () => {
    const token = authService.getToken()
    return axios.get(API_URL, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
  },
}

export default RatingService

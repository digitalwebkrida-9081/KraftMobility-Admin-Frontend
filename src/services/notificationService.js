import axios from 'axios'
import { authService } from './authService'

const API_URL = 'https://servicekraft.digitalwebkrida.com/api/notifications'

const getNotifications = () => {
  const token = authService.getToken()
  return axios.get(API_URL, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const NotificationService = {
  getNotifications,
}

export default NotificationService

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import UserService from '../services/userService' // Import UserService

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch pending count
  const fetchPendingCount = async () => {
    // Only Admin needs this
    // We check authService.getCurrentUser() because 'user' state might lag slightly or be null initially
    const currentUser = authService.getCurrentUser() || user
    if (currentUser?.role === 'Admin') {
      try {
        const response = await UserService.getPendingCount()
        setPendingCount(response.data.count)
      } catch (error) {
        console.error('Failed to fetch pending count', error)
      }
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Auth initialization failed', error)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  // Poll for pending count if user is admin
  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchPendingCount()
      const interval = setInterval(fetchPendingCount, 15000) // Poll every 15s
      return () => clearInterval(interval)
    }
  }, [user])

  const login = async (email, password) => {
    const user = await authService.login(email, password)
    setUser(user)
    return user
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  // Expose other service methods if needed directly or wrap them
  const createUser = async (userData) => {
    return await authService.createUser(userData)
  }

  const getUsers = async () => {
    return await authService.getUsers()
  }

  const updateUser = async (id, userData) => {
    const res = await authService.updateUser(id, userData)
    // Update pending count whenever a user update happens (like approval)
    fetchPendingCount()
    return res
  }

  const deleteUser = async (id) => {
    const res = await authService.deleteUser(id)
    fetchPendingCount()
    return res
  }

  const value = {
    user,
    loading,
    login,
    logout,
    createUser,
    getUsers,
    isAdmin: user?.role === 'Admin',
    updateUser,
    deleteUser,
    pendingCount, // Expose count
    fetchPendingCount, // Expose updater
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

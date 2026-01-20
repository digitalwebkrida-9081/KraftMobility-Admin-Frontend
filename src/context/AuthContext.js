import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
    return await authService.updateUser(id, userData)
  }

  const deleteUser = async (id) => {
    return await authService.deleteUser(id)
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

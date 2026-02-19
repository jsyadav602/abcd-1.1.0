import React, { createContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../services/api'

export const AuthContext = createContext()

/**
 * Sanitize user data for localStorage - only store minimal safe fields
 * Security: Don't store sensitive data like phone_no, organizationId, branchId, remarks, etc.
 */
const sanitizeUserForStorage = (user) => {
  if (!user) return null
  
  return {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation || null,
    department: user.department || null,
    // Exclude sensitive fields: phone_no, organizationId, branchId, remarks, 
    // createdBy, reportingTo, isBlocked, canLogin, etc.
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        const storedPermissions = localStorage.getItem('permissions')
        const accessToken = sessionStorage.getItem('accessToken')
        
        // Skip if stored value is the string "undefined"
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null' && accessToken) {
          try {
            const parsedUser = JSON.parse(storedUser)
            if (parsedUser && parsedUser._id) {
              // Restore minimal user data from localStorage
              setUser(parsedUser)
              
              if (storedPermissions && storedPermissions !== 'undefined') {
                try {
                  setPermissions(JSON.parse(storedPermissions))
                } catch (e) {
                  console.error('Invalid permissions JSON:', e)
                  setPermissions([])
                }
              }
              
              // Try to fetch full user profile from backend to restore complete data
              try {
                const profileResponse = await authAPI.getProfile()
                const fullUserData = profileResponse.data?.data || profileResponse.data
                if (fullUserData && fullUserData._id) {
                  // Update state with full user data
                  setUser(fullUserData)
                  // Update localStorage with sanitized version
                  const sanitized = sanitizeUserForStorage(fullUserData)
                  localStorage.setItem('user', JSON.stringify(sanitized))
                }
              } catch (profileError) {
                // If profile fetch fails, continue with minimal data from localStorage
                console.warn('Could not fetch full profile, using minimal data:', profileError)
              }
              
              setIsAuthenticated(true)
            }
          } catch (e) {
            console.error('Invalid user JSON:', e)
            throw e
          }
        }
      } catch (err) {
        console.error('Error restoring auth:', err)
        // Clear corrupted data
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
        localStorage.removeItem('permissions')
        sessionStorage.removeItem('accessToken')
        setUser(null)
        setPermissions([])
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (loginId, password) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await authAPI.login(loginId, password)
      // Backend returns: { statusCode, data: { user, permissions, accessToken, ... }, message, success }
      const responseData = response.data.data || response.data
      const { user, permissions: userPermissions = [], accessToken } = responseData

      // Ensure permissions is an array
      const perms = Array.isArray(userPermissions) ? userPermissions : []

      // Validate user data
      if (!user || !user._id) {
        throw new Error('Invalid user data received')
      }

      // Store in appropriate storage:
      // - Minimal user data in localStorage (only safe fields for display)
      // - Full user data stays in React state (memory only - more secure)
      // - Permissions: localStorage (needed for UI control)
      // - accessToken: sessionStorage (cleared on browser close = more secure)
      const sanitizedUser = sanitizeUserForStorage(user)
      localStorage.setItem('user', JSON.stringify(sanitizedUser))
      localStorage.setItem('permissions', JSON.stringify(perms))
      sessionStorage.setItem('accessToken', accessToken)
      
      // Update state with FULL user data (kept in memory only)
      setUser(user)
      setPermissions(perms)
      setIsAuthenticated(true)
      
      return { success: true, user, permissions: perms }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response
          ? err.message
          : 'Network error: cannot reach backend API. Make sure Backend is running and CORS allows your Frontend origin.') ||
        'Login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await authAPI.register(userData)
      // Backend returns: { statusCode, data: { user, permissions, accessToken, ... }, message, success }
      const responseData = response.data.data || response.data
      const { user, permissions: userPermissions = [], accessToken } = responseData

      // Ensure permissions is an array
      const perms = Array.isArray(userPermissions) ? userPermissions : []

      // Validate user data
      if (!user || !user._id) {
        throw new Error('Invalid user data received')
      }

      // Store in appropriate storage:
      // - Minimal user data in localStorage (only safe fields for display)
      // - Full user data stays in React state (memory only - more secure)
      // - Permissions: localStorage (needed for UI control)
      // - accessToken: sessionStorage (cleared on browser close = more secure)
      const sanitizedUser = sanitizeUserForStorage(user)
      localStorage.setItem('user', JSON.stringify(sanitizedUser))
      localStorage.setItem('permissions', JSON.stringify(perms))
      sessionStorage.setItem('accessToken', accessToken)
      
      // Update state with FULL user data (kept in memory only)
      setUser(user)
      setPermissions(perms)
      setIsAuthenticated(true)
      
      return { success: true, user, permissions: perms }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear all storage
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      sessionStorage.removeItem('accessToken')
      
      setUser(null)
      setPermissions([])
      setIsAuthenticated(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError('')
  }, [])

  const value = {
    user,
    permissions,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

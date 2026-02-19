import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input, Button, Alert } from '../components'
import AuthLayout from '../layouts/AuthLayout'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, error, clearError, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    loginId: '', // Can be username, userID, or email
    password: ''
  })

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(formData.loginId, formData.password)

    if (result.success) {
      navigate('/')
    }

    setLoading(false)
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      {error && (
        <Alert type="danger" title="Login Error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <Input
          type="text"
          name="loginId"
          label="Username, User ID, or Email"
          placeholder="e.g., EMP001 or user@example.com"
          value={formData.loginId}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <button
          type="button"
          className="password-toggle-button"
          onClick={() => setShowPassword(prev => !prev)}
          style={{
            marginTop: '0.25rem',
            marginBottom: '0.75rem',
            fontSize: '0.85rem',
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            padding: 0,
            alignSelf: 'flex-end'
          }}
        >
          {showPassword ? 'Hide password' : 'Show password'}
        </button>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="login-footer">
       {/* <p>
          Don't have an account?{' '}
          <Link to="/register" className="register-link">
            Sign up here
          </Link>
        </p>*/}
        <p>
          <Link to="/forgot-password" className="forgot-link">
            Forgot Password?
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Login

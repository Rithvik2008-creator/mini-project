import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer token to all requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token expired or invalid
      // Only clear and redirect if we're not already on the login or signup page
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message
    if (serverMessage && typeof serverMessage === 'string') {
      return serverMessage
    }
    const statusText = error.response?.statusText
    if (statusText) {
      return `Server Error (${error.response?.status}): ${statusText}`
    }
    return error.message || 'Network connection to backend server failed.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred.'
}

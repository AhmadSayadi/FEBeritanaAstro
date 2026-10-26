'use client'

/**
 * Auth module — connects to real Laravel backend API
 * Endpoints: POST /api/auth/login, POST /api/auth/register, etc.
 */

export interface User {
  id: number
  name: string
  email: string
  avatar_url: string
  role: 'reader' | 'author' | 'editor'
  verified: boolean
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  message?: string
  errors?: Record<string, string[]>
}

const TOKEN_KEY = 'beritana_token'
const USER_KEY = 'beritana_user'

// API base for client-side auth calls (goes through Next.js proxy or direct)
function getApiBase(): string {
  return '/api/auth'
}

/**
 * Login — tries /auth/author/login first, then /auth/login
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  const body = JSON.stringify({ email: username, password })
  const headers = { 'Content-Type': 'application/json' }

  // Try author login first
  try {
    const res = await fetch(`${getApiBase()}/author/login`, {
      method: 'POST',
      headers,
      body,
    })
    const data = await res.json()

    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.data || data.user))
      return { success: true, token: data.token, user: data.data || data.user }
    }

    // If author login says "not found" or 404, try reader login
    if (res.status === 404 || res.status === 401) {
      // Fall through to reader login below
    } else {
      return { success: false, message: data.message || 'Login gagal', errors: data.errors }
    }
  } catch {
    // Fall through
  }

  // Try reader login
  try {
    const res = await fetch(`${getApiBase()}/login`, {
      method: 'POST',
      headers,
      body,
    })
    const data = await res.json()

    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.data || data.user))
      return { success: true, token: data.token, user: data.data || data.user }
    }
    return { success: false, message: data.message || 'Email atau password salah', errors: data.errors }
  } catch {
    return { success: false, message: 'Tidak dapat terhubung ke server' }
  }
}

/**
 * Register — POST /api/auth/register
 */
export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${getApiBase()}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, password_confirmation: password }),
    })
    const data = await res.json()

    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.data || data.user))
      return { success: true, token: data.token, user: data.data || data.user }
    }
    return { success: false, message: data.message || 'Registrasi gagal', errors: data.errors }
  } catch {
    return { success: false, message: 'Tidak dapat terhubung ke server' }
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const token = getToken()
  if (token) {
    try {
      await fetch(`${getApiBase()}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
    } catch {
      // Ignore — clear local state regardless
    }
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Get token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * Check if user is author/editor (can write articles)
 */
export function isAuthor(): boolean {
  const user = getCurrentUser()
  if (!user?.role) return false
  const role = user.role.toLowerCase()
  return role === 'author' || role === 'editor' || role.includes('editor') || role.includes('author') || role.includes('penulis')
}

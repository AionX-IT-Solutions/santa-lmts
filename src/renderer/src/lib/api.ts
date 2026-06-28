import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE as string

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('lmts-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      const token: string | undefined = parsed?.state?.user?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err?.config?.url, err?.response?.status, err?.response?.data)
    return Promise.reject(err)
  }
)

// Firebase config
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
  serviceEmail: import.meta.env.VITE_FIREBASE_SERVICE_EMAIL as string,
  servicePassword: import.meta.env.VITE_FIREBASE_SERVICE_PASSWORD as string
}

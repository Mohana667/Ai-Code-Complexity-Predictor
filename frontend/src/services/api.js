import axios from 'axios'
import { auth } from './firebase'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120000, // 2 minutes for AI analysis
})

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser

  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* =========================
   ANALYSIS APIs
========================= */

export const analyzeCode = (payload) =>
  api.post('/analysis', payload).then((r) => r.data)

export const getHistory = (limit = 20) =>
  api.get(`/analysis/history?limit=${limit}`).then((r) => r.data)

export const getAnalysis = (id) =>
  api.get(`/analysis/${id}`).then((r) => r.data)

/* =========================
   USER DASHBOARD APIs
========================= */

export const getDashboardStats = () =>
  api.get('/dashboard/stats').then((r) => r.data)

export const syncProfile = () =>
  api.post('/auth/sync').then((r) => r.data)

/* =========================
   NOTIFICATION APIs
========================= */

export const getVapidPublicKey = () =>
  api.get('/notifications/vapid-public-key').then((r) => r.data)

export const subscribePush = (subscription) =>
  api.post('/notifications/subscribe', subscription).then((r) => r.data)

/* =========================
   ADMIN APIs
========================= */

// Overall admin dashboard statistics
export const getAdminOverview = () =>
  api.get('/admin/overview').then((r) => r.data)

// All registered users
export const getAdminUsers = () =>
  api.get('/admin/users').then((r) => r.data)

// All analyses
export const getAdminAnalyses = (limit = 50) =>
  api.get(`/admin/analyses?limit=${limit}`).then((r) => r.data)

export default api
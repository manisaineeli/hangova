/**
 * Thin fetch wrapper around the API Gateway.
 *
 * Every request goes to a relative /api path, which the Vite dev server proxies
 * to the gateway on port 8080. The JWT bearer token is attached automatically
 * and a 401 clears the session so the UI falls back to the sign-in screen.
 */

const TOKEN_KEY = 'hangova.token'
const USER_KEY = 'hangova.user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the Hangova services. Make sure the backend is running.')
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) clearSession()
    const message =
      (data && (data.message || data.error)) || `Request failed (${res.status})`
    throw new ApiError(res.status, message, data)
  }
  return data
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  put: (p, b) => request(p, { method: 'PUT', body: b }),
  del: (p) => request(p, { method: 'DELETE' }),

  /* ---- Module 1: users and admin ---- */
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  me: () => request('/users/me'),
  updateMe: (payload) => request('/users/me', { method: 'PUT', body: payload }),
  adminUsers: () => request('/users/admin'),
  adminUpdateUser: (id, payload) => request(`/users/admin/${id}`, { method: 'PUT', body: payload }),

  /* ---- Module 2: AI trip planning ---- */
  planTrip: (payload) => request('/trips/plan', { method: 'POST', body: payload }),
  myTrips: () => request('/trips'),
  trip: (id) => request(`/trips/${id}`),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  tripStats: () => request('/trips/stats'),
  recommendations: (interest) =>
    request(`/trips/recommendations${interest ? `?interest=${encodeURIComponent(interest)}` : ''}`),
  destinations: (filter) =>
    request(`/trips/destinations${filter ? `?interest=${encodeURIComponent(filter)}` : ''}`),
  searchPlaces: (q) => request(`/places/search?q=${encodeURIComponent(q || '')}&limit=8`),
  placeDetail: (name) => request(`/places/detail?name=${encodeURIComponent(name)}`),
  weather: (destination, days = 5) =>
    request(`/weather?destination=${encodeURIComponent(destination)}&days=${days}`),
  providerStatus: () => request('/weather/status'),

  /* ---- Module 3: booking and borrowing ---- */
  hotels: (destination, checkIn, checkOut, travellers, rooms) =>
    request(
      `/hotels?destination=${encodeURIComponent(destination)}` +
        (checkIn ? `&checkIn=${checkIn}` : '') +
        (checkOut ? `&checkOut=${checkOut}` : '') +
        `&travellers=${travellers}&rooms=${rooms}`,
    ),
  transport: (destination, date, travellers, mode) =>
    request(
      `/transport?destination=${encodeURIComponent(destination)}` +
        (date ? `&date=${date}` : '') +
        `&travellers=${travellers}` +
        (mode ? `&mode=${mode}` : ''),
    ),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  myBookings: () => request('/bookings'),
  cancelBooking: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'POST', body: { reason } }),
  bookingSummary: () => request('/bookings/summary'),
  applyLoan: (payload) => request('/borrow/apply', { method: 'POST', body: payload }),
  myLoans: () => request('/borrow/mine'),
  usableLoans: () => request('/borrow/usable'),
  allLoans: () => request('/borrow/all'),
  approveLoan: (id, payload) => request(`/borrow/${id}/approve`, { method: 'POST', body: payload }),
  rejectLoan: (id, payload) => request(`/borrow/${id}/reject`, { method: 'POST', body: payload }),
  disburseLoan: (id) => request(`/borrow/${id}/disburse`, { method: 'POST', body: {} }),
  adminBookings: () => request('/admin/bookings'),
  adminBookingSummary: () => request('/admin/summary'),

  /* ---- Module 4: travel information ---- */
  infoTrips: () => request('/info/trips'),
  infoTrip: (id) => request(`/info/trips/${id}`),
  renameTrip: (id, title) => request(`/info/trips/${id}`, { method: 'PUT', body: { title } }),
  expenses: (tripId) => request(`/info/expenses${tripId ? `?tripId=${tripId}` : ''}`),
  addExpense: (payload) => request('/info/expenses', { method: 'POST', body: payload }),
  updateExpense: (id, payload) => request(`/info/expenses/${id}`, { method: 'PUT', body: payload }),
  deleteExpense: (id) => request(`/info/expenses/${id}`, { method: 'DELETE' }),
  expenseSummary: (tripId) =>
    request(`/info/expenses/summary${tripId ? `?tripId=${tripId}` : ''}`),
  adminOverview: () => request('/admin/overview'),
  adminActivity: (limit = 40) => request(`/admin/activity?limit=${limit}`),
}

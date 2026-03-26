import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('engseg_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('engseg_token')
      localStorage.removeItem('engseg_user')
      localStorage.removeItem('engseg_empresa')
      localStorage.removeItem('engseg_estabelecimento')
      localStorage.removeItem('engseg_empresa_filha')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client

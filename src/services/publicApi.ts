import axios from 'axios'

const publicApi = axios.create({ baseURL: '', withCredentials: false })

publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('applicantToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

publicApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('applicantToken')
      window.location.href = '/app/login'
    }
    return Promise.reject(err)
  },
)

export default publicApi

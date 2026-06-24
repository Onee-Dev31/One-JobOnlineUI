import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import MainLayout from './layouts/MainLayout'
import PublicLayout from './layouts/PublicLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Applicants from './pages/Applicants'
import AdminUsers from './pages/AdminUsers'
import Departments from './pages/Departments'
import Roles from './pages/Roles'
import JobList from './pages/public/JobList'
import JobPublicDetail from './pages/public/JobPublicDetail'

const queryClient = new QueryClient()

function ProtectedLayout() {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <MainLayout />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/applicants" element={<Applicants />} />
              <Route path="/admin-users" element={<AdminUsers />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/roles" element={<Roles />} />
            </Route>
            <Route path="/app" element={<PublicLayout />}>
              <Route index element={<Navigate to="/app/jobs" replace />} />
              <Route path="jobs" element={<JobList />} />
              <Route path="jobs/:id" element={<JobPublicDetail />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </QueryClientProvider>
  )
}
